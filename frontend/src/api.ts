import { supabase } from './lib/supabase'

// ── Deals ──────────────────────────────────────────────────────────────────

export async function listDeals() {
  const { data, error } = await supabase
    .from('deals')
    .select('*, reference_contacts(id, status)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map((d: any) => {
    const { reference_contacts, ...deal } = d
    return {
      ...deal,
      reference_count: reference_contacts.length,
      completed_references: reference_contacts.filter((r: any) => r.status === 'completed').length,
    }
  })
}

export async function getDeal(id: string) {
  const { data, error } = await supabase
    .from('deals')
    .select('*, reference_contacts(id, status)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  const { reference_contacts, ...deal } = data
  return {
    ...deal,
    reference_count: reference_contacts.length,
    completed_references: reference_contacts.filter((r: any) => r.status === 'completed').length,
  }
}

export async function createDeal(data: any) {
  const { data: row, error } = await supabase
    .from('deals')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  const deal = { ...row, reference_count: 0, completed_references: 0 }
  logActivity('deal_created', `${deal.company_name} added to pipeline`, deal.id, { company_name: deal.company_name })
  return deal
}

export async function updateDeal(id: string, data: any) {
  const { data: row, error } = await supabase
    .from('deals')
    .update(data)
    .eq('id', id)
    .select('*, reference_contacts(id, status)')
    .single()
  if (error) throw new Error(error.message)
  const { reference_contacts, ...deal } = row
  return {
    ...deal,
    reference_count: reference_contacts.length,
    completed_references: reference_contacts.filter((r: any) => r.status === 'completed').length,
  }
}

export async function deleteDeal(id: string) {
  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── References ────────────────────────────────────────────────────────────

export async function listReferences(dealId: string) {
  const { data, error } = await supabase
    .from('reference_contacts')
    .select('*, reference_notes(*)')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  // Rename reference_notes → notes to match the existing TypeScript types
  return data.map((r: any) => {
    const { reference_notes, ...ref } = r
    return { ...ref, notes: reference_notes || [] }
  })
}

export async function createReference(dealId: string, data: any) {
  const { data: row, error } = await supabase
    .from('reference_contacts')
    .insert({ ...data, deal_id: dealId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return { ...row, notes: [] }
}

export async function updateReference(refId: string, data: any) {
  const { data: row, error } = await supabase
    .from('reference_contacts')
    .update(data)
    .eq('id', refId)
    .select('*, reference_notes(*)')
    .single()
  if (error) throw new Error(error.message)
  const { reference_notes, ...ref } = row
  return { ...ref, notes: reference_notes || [] }
}

export async function deleteReference(refId: string) {
  const { error } = await supabase.from('reference_contacts').delete().eq('id', refId)
  if (error) throw new Error(error.message)
}

// ── Notes ─────────────────────────────────────────────────────────────────

export async function addNote(refId: string, data: any) {
  const { data: row, error } = await supabase
    .from('reference_notes')
    .insert({ ...data, reference_id: refId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return row
}

// ── AI (Edge Functions) ───────────────────────────────────────────────────

async function invokeFunction(name: string, body: any) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw new Error(error.message)
  return data
}

export const discoverCustomers = (dealId: string, data: any) =>
  invokeFunction('discover', { ...data, deal_id: dealId })

export const generateOutreach = (refId: string, data: any) =>
  invokeFunction('outreach', { ...data, ref_id: refId })

export const generateInterviewGuide = (dealId: string, data: any) =>
  invokeFunction('interview-guide', { ...data, deal_id: dealId })

export const synthesizeSignals = (dealId: string) =>
  invokeFunction('synthesize', { deal_id: dealId })

// ── Signal Reports ────────────────────────────────────────────────────────

export async function getSignalReports(dealId: string) {
  const { data, error } = await supabase
    .from('signal_reports')
    .select('*')
    .eq('deal_id', dealId)
    .order('generated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

// ── Tutorial ──────────────────────────────────────────────────────────────

export const seedTutorialData = () =>
  invokeFunction('seed-tutorial', {})

// ── Company Profiles ─────────────────────────────────────────────────

const DEMO_ENRICHMENT = {
  founded_year: 2019,
  team_size_range: '51-200',
  funding_stage: 'Series B',
  total_raised: '$45M',
  competitors: ['Competitor Alpha', 'Competitor Beta', 'Competitor Gamma'],
  key_people: [
    { name: 'Jane Doe', title: 'CEO & Co-founder', linkedin_url: '' },
    { name: 'John Smith', title: 'CTO & Co-founder', linkedin_url: '' },
    { name: 'Alice Johnson', title: 'VP of Engineering', linkedin_url: '' },
  ],
  ai_summary:
    'A fast-growing B2B SaaS platform that uses AI to automate complex workflows for mid-market enterprises. The company has shown strong product-market fit with 3x YoY revenue growth, high net retention, and a rapidly expanding customer base across financial services and healthcare verticals.',
}

function logoUrlFromWebsite(website: string): string {
  if (!website) return ''
  try {
    const hostname = new URL(website.startsWith('http') ? website : `https://${website}`).hostname
    return `https://logo.clearbit.com/${hostname}`
  } catch {
    return ''
  }
}

export async function getCompanyProfile(dealId: string) {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('deal_id', dealId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function enrichCompany(
  dealId: string,
  info: { company_name: string; company_website: string; sector: string; description: string }
) {
  const logo_url = logoUrlFromWebsite(info.company_website)

  let profileData: any
  try {
    profileData = await invokeFunction('enrich-company', { ...info, deal_id: dealId })
  } catch {
    // Edge Function not deployed — use demo data
    profileData = { ...DEMO_ENRICHMENT }
  }

  // Remove non-profile keys
  delete profileData.demo
  delete profileData.error

  const { data, error } = await supabase
    .from('company_profiles')
    .upsert(
      {
        deal_id: dealId,
        logo_url,
        founded_year: profileData.founded_year ?? null,
        team_size_range: profileData.team_size_range || '',
        funding_stage: profileData.funding_stage || '',
        total_raised: profileData.total_raised || '',
        competitors: profileData.competitors || [],
        key_people: profileData.key_people || [],
        ai_summary: profileData.ai_summary || '',
        enriched_at: new Date().toISOString(),
      },
      { onConflict: 'deal_id' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)

  logActivity('company_enriched', `${info.company_name} profile enriched`, dealId, {
    company_name: info.company_name,
  })

  return data
}

// ── Activity Events ──────────────────────────────────────────────────

export async function logActivity(
  event_type: string,
  title: string,
  deal_id?: string,
  metadata: Record<string, any> = {}
) {
  try {
    await supabase
      .from('activity_events')
      .insert({ event_type, title, deal_id: deal_id || null, metadata })
  } catch {
    // fire-and-forget: never block CRUD operations
  }
}

export async function getRecentActivity(limit = 15) {
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!error && data && data.length > 0) return data

  // Fallback: derive activity from recent deals if table doesn't exist or is empty
  const { data: deals } = await supabase
    .from('deals')
    .select('id, company_name, stage, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit)

  return (deals || []).map((d: any) => ({
    id: d.id,
    deal_id: d.id,
    event_type: 'deal_created',
    title: d.company_name,
    metadata: { company_name: d.company_name, stage: d.stage },
    created_at: d.updated_at || d.created_at,
  }))
}

// ── Dashboard Stats ──────────────────────────────────────────────────

export async function getDashboardStats() {
  const { data: deals, error } = await supabase
    .from('deals')
    .select('stage, reference_contacts(id, status)')

  if (error) throw new Error(error.message)

  const pipelineCounts: Record<string, number> = {
    screening: 0, deep_dive: 0, ic_review: 0, closed: 0,
  }

  let refsInProgress = 0
  deals.forEach((d: any) => {
    pipelineCounts[d.stage] = (pipelineCounts[d.stage] || 0) + 1
    ;(d.reference_contacts || []).forEach((r: any) => {
      if (['outreach_sent', 'scheduled'].includes(r.status)) refsInProgress++
    })
  })

  const { count: signalCount } = await supabase
    .from('signal_reports')
    .select('*', { count: 'exact', head: true })

  return {
    activeDeals: deals.filter((d: any) => d.stage !== 'closed').length,
    refsInProgress,
    signalsGenerated: signalCount || 0,
    dealsClosed: pipelineCounts.closed,
    pipelineCounts,
  }
}
