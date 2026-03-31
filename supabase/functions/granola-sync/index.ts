import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GRANOLA_API_BASE = 'https://public-api.granola.ai/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Granola integration settings
    const { data: settings } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('provider', 'granola')
      .single()

    if (!settings?.enabled || !settings?.api_key) {
      return new Response(
        JSON.stringify({ synced: 0, message: 'Granola integration not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch notes from Granola API
    const params = new URLSearchParams()
    if (settings.sync_cursor) {
      params.set('created_after', settings.sync_cursor)
    }

    const granolaRes = await fetch(`${GRANOLA_API_BASE}/notes?${params}`, {
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json',
      },
    })

    if (!granolaRes.ok) {
      const errText = await granolaRes.text()
      throw new Error(`Granola API error ${granolaRes.status}: ${errText}`)
    }

    const granolaData = await granolaRes.json()
    const notes = granolaData.notes || granolaData.data || []

    if (notes.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, message: 'No new meetings to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing deals for matching
    const { data: deals } = await supabase
      .from('deals')
      .select('id, company_name')

    let synced = 0
    let latestCreated = settings.sync_cursor || ''

    for (const note of notes) {
      const externalId = note.id || note.document_id
      if (!externalId) continue

      // Skip if already imported
      const { data: existing } = await supabase
        .from('touchpoints')
        .select('id')
        .eq('external_id', externalId)
        .maybeSingle()

      if (existing) continue

      // Try to match to a deal by title/content containing company name
      const noteTitle = note.title || ''
      const noteSummary = note.summary || note.content || ''
      let matchedDealId: string | null = null

      if (deals) {
        for (const deal of deals) {
          const companyLower = deal.company_name.toLowerCase()
          if (
            noteTitle.toLowerCase().includes(companyLower) ||
            noteSummary.toLowerCase().includes(companyLower)
          ) {
            matchedDealId = deal.id
            break
          }
        }
      }

      // Create touchpoint
      await supabase.from('touchpoints').insert({
        deal_id: matchedDealId,
        type: 'meeting',
        title: noteTitle || 'Meeting from Granola',
        content: noteSummary,
        occurred_at: note.meeting_date || note.created_at || new Date().toISOString(),
        source: 'granola',
        external_id: externalId,
        created_by: note.created_by || '',
      })

      // Log activity if matched to a deal
      if (matchedDealId) {
        await supabase.from('activity_events').insert({
          deal_id: matchedDealId,
          event_type: 'meeting_logged',
          title: `Meeting synced from Granola: ${noteTitle}`,
          metadata: { source: 'granola', external_id: externalId },
        })
      }

      synced++

      // Track latest note for cursor
      const noteDate = note.created_at || ''
      if (noteDate > latestCreated) latestCreated = noteDate
    }

    // Update sync cursor
    if (latestCreated) {
      await supabase
        .from('integration_settings')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_cursor: latestCreated,
        })
        .eq('provider', 'granola')
    }

    return new Response(
      JSON.stringify({ synced, message: `Synced ${synced} meeting${synced !== 1 ? 's' : ''}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, synced: 0 }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
