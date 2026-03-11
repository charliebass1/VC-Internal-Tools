const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Deals
export const listDeals = () => request<any[]>('/deals')
export const getDeal = (id: string) => request<any>(`/deals/${id}`)
export const createDeal = (data: any) =>
  request<any>('/deals', { method: 'POST', body: JSON.stringify(data) })
export const updateDeal = (id: string, data: any) =>
  request<any>(`/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteDeal = (id: string) =>
  request<void>(`/deals/${id}`, { method: 'DELETE' })

// References
export const listReferences = (dealId: string) =>
  request<any[]>(`/deals/${dealId}/references`)
export const createReference = (dealId: string, data: any) =>
  request<any>(`/deals/${dealId}/references`, { method: 'POST', body: JSON.stringify(data) })
export const updateReference = (refId: string, data: any) =>
  request<any>(`/references/${refId}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteReference = (refId: string) =>
  request<void>(`/references/${refId}`, { method: 'DELETE' })

// Notes
export const addNote = (refId: string, data: any) =>
  request<any>(`/references/${refId}/notes`, { method: 'POST', body: JSON.stringify(data) })

// AI
export const discoverCustomers = (dealId: string, data: any) =>
  request<any>(`/deals/${dealId}/discover`, { method: 'POST', body: JSON.stringify(data) })
export const generateOutreach = (refId: string, data: any) =>
  request<any>(`/references/${refId}/outreach`, { method: 'POST', body: JSON.stringify(data) })
export const generateInterviewGuide = (dealId: string, data: any) =>
  request<any>(`/deals/${dealId}/interview-guide`, { method: 'POST', body: JSON.stringify(data) })
export const synthesizeSignals = (dealId: string) =>
  request<any>(`/deals/${dealId}/synthesize`, { method: 'POST' })
export const getSignalReports = (dealId: string) =>
  request<any[]>(`/deals/${dealId}/signals`)

// Tutorial
export const seedTutorialData = () =>
  request<{ success: boolean; message: string; deal_id?: string }>('/seed-tutorial', { method: 'POST' })
