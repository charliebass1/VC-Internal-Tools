import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const DEMO_REPORT = (dealId: string) => ({
  deal_id: dealId,
  summary: 'Customers consistently praise the product\'s ease of use and time-to-value, with most reporting measurable ROI within the first 90 days. The onboarding experience is highlighted as a key differentiator versus incumbent solutions. However, two references flagged concerns about pricing transparency as contracts scale, and one noted a 6-week support delay during a critical integration.',
  signals: [
    { category: 'product_quality', signal: 'Strong ease-of-use scores', sentiment: 'positive', evidence: 'Multiple references describe setup as "surprisingly fast" and "required no IT involvement"' },
    { category: 'market_fit', signal: 'Clear pain point displacement', sentiment: 'positive', evidence: 'All references switched from manual processes or legacy tools; none considered it a "nice to have"' },
    { category: 'churn_risk', signal: 'Pricing concern at scale', sentiment: 'negative', evidence: 'Two references mentioned unexpected cost increases above 500 seats; one is evaluating alternatives' },
    { category: 'expansion_potential', signal: 'High cross-team adoption', sentiment: 'positive', evidence: 'Three of four references have expanded to additional teams since initial purchase' },
    { category: 'competitive_position', signal: 'Beats incumbents on UX', sentiment: 'positive', evidence: 'References who previously used Salesforce or HubSpot cite UI as primary switching reason' },
    { category: 'team_perception', signal: 'Responsive but support gaps', sentiment: 'neutral', evidence: 'CSM praised universally; one escalation took 6 weeks to resolve' },
  ],
  red_flags: ['Pricing opacity at scale could drive churn in 12-18 months', 'One reference actively evaluating a competitor'],
  green_flags: ['100% of references would recommend to a peer', 'Measurable ROI cited by all completed references', 'Strong organic expansion within accounts'],
  generated_at: new Date().toISOString(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { deal_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch deal info
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', deal_id)
      .single()

    if (dealError || !deal) {
      return new Response(JSON.stringify({ error: 'Deal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch all notes for all references on this deal
    const { data: references } = await supabase
      .from('reference_contacts')
      .select('id, name, title, company, reference_notes(*)')
      .eq('deal_id', deal_id)

    const allNotes = (references || []).flatMap((ref: any) =>
      (ref.reference_notes || []).map((note: any) => ({
        reference: `${ref.name} (${ref.title} at ${ref.company})`,
        content: note.content,
        call_date: note.call_date,
        interviewer: note.interviewer,
      }))
    )

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    let reportData: any

    if (!apiKey || allNotes.length === 0) {
      reportData = DEMO_REPORT(deal_id)
    } else {
      const client = new Anthropic({ apiKey })

      const system = `You are a venture capital analyst synthesizing customer reference check calls. Analyze the call notes and produce a structured signal report.

Return valid JSON with these keys:
- summary: 2-3 paragraph overall assessment
- signals: array of {category, signal, sentiment, evidence} where:
  - category is one of: product_quality, market_fit, churn_risk, competitive_position, expansion_potential, team_perception
  - signal is a short description
  - sentiment is "positive", "negative", or "neutral"
  - evidence is a quote or paraphrase from the notes
- red_flags: array of strings — concerning patterns
- green_flags: array of strings — strong positive signals

Return ONLY valid JSON, no other text.`

      const prompt = `Company: ${deal.company_name}
Sector: ${deal.sector || 'N/A'}

Reference call notes:
${JSON.stringify(allNotes, null, 2)}

Synthesize these reference calls into a structured signal report.`

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''

      try {
        reportData = JSON.parse(text)
      } catch {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          reportData = JSON.parse(match[1].trim())
        } else {
          reportData = { summary: text, signals: [], red_flags: [], green_flags: [] }
        }
      }
    }

    // Save signal report to DB
    const { data: savedReport, error: insertError } = await supabase
      .from('signal_reports')
      .insert({
        deal_id,
        summary: reportData.summary || '',
        signals: reportData.signals || [],
        red_flags: reportData.red_flags || [],
        green_flags: reportData.green_flags || [],
      })
      .select()
      .single()

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(savedReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
