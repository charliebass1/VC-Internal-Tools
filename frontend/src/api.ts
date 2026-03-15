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
  return { ...row, reference_count: 0, completed_references: 0 }
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
