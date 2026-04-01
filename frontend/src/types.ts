export interface Deal {
  id: string
  company_name: string
  company_website: string
  sector: string
  stage: string
  lead_partner: string
  description: string
  created_at: string
  updated_at: string
  reference_count: number
  completed_references: number
}

export interface KeyPerson {
  name: string
  title: string
  linkedin_url: string
}

export interface CompanyProfile {
  id: string
  deal_id: string
  logo_url: string
  founded_year: number | null
  team_size_range: string
  funding_stage: string
  total_raised: string
  competitors: string[]
  key_people: KeyPerson[]
  ai_summary: string
  enriched_at: string
  created_at: string
  updated_at: string
}

export interface ReferenceNote {
  id: string
  reference_id: string
  content: string
  call_date: string
  interviewer: string
  created_at: string
}

export interface ReferenceContact {
  id: string
  deal_id: string
  name: string
  title: string
  company: string
  email: string
  linkedin_url: string
  source: string
  status: string
  outreach_template: string
  created_at: string
  updated_at: string
  notes: ReferenceNote[]
}

export interface Signal {
  category: string
  signal: string
  sentiment: 'positive' | 'negative' | 'neutral'
  evidence: string
}

export interface SignalReport {
  id: string
  deal_id: string
  summary: string
  signals: Signal[]
  red_flags: string[]
  green_flags: string[]
  generated_at: string
}

export interface ActivityEvent {
  id: string
  deal_id: string | null
  event_type: string
  title: string
  metadata: Record<string, any>
  created_at: string
}

export interface DashboardStats {
  activeDeals: number
  refsInProgress: number
  signalsGenerated: number
  dealsClosed: number
  pipelineCounts: Record<string, number>
}

export interface Contact {
  id: string
  name: string
  title: string
  company: string
  email: string
  linkedin_url: string
  relationship_strength: 'strong' | 'warm' | 'cold'
  tags: string[]
  notes: string
  last_contact_date: string | null
  created_at: string
  updated_at: string
}

export interface Touchpoint {
  id: string
  deal_id: string | null
  contact_id: string | null
  type: 'meeting' | 'email' | 'call' | 'intro' | 'note'
  title: string
  content: string
  occurred_at: string
  created_by: string
  source: 'manual' | 'granola' | 'import'
  external_id: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  contact?: Contact
}

export interface IntegrationSettings {
  id: string
  provider: string
  api_key: string
  enabled: boolean
  last_synced_at: string | null
  sync_cursor: string
  config: Record<string, any>
}
