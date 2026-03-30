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
