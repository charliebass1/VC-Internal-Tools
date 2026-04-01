import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

const DEMO_CHECKLIST = {
  items: [
    // customer
    { category: 'customer', title: 'Reference check calls (company-provided)', priority: 'high' },
    { category: 'customer', title: 'Independent customer interviews (backchannel)', priority: 'high' },
    { category: 'customer', title: 'G2/Capterra review analysis', priority: 'medium' },
    { category: 'customer', title: 'NPS benchmark review', priority: 'medium' },
    // legal
    { category: 'legal', title: 'Cap table review', priority: 'high' },
    { category: 'legal', title: 'IP ownership verification', priority: 'high' },
    { category: 'legal', title: 'Prior litigation check', priority: 'medium' },
    { category: 'legal', title: 'Data privacy compliance (SOC2/GDPR)', priority: 'medium' },
    { category: 'legal', title: 'Key customer contract terms', priority: 'medium' },
    // financial
    { category: 'financial', title: 'ARR/revenue growth rate', priority: 'high' },
    { category: 'financial', title: 'Gross margin analysis', priority: 'high' },
    { category: 'financial', title: 'Burn rate and runway', priority: 'high' },
    { category: 'financial', title: 'Unit economics (CAC, LTV, payback)', priority: 'high' },
    { category: 'financial', title: 'Full data room review', priority: 'medium' },
    // technical
    { category: 'technical', title: 'System architecture review', priority: 'medium' },
    { category: 'technical', title: 'Security posture assessment', priority: 'medium' },
    { category: 'technical', title: 'Engineering team size/quality', priority: 'medium' },
    { category: 'technical', title: 'Tech debt evaluation', priority: 'low' },
    // market
    { category: 'market', title: 'TAM/SAM/SOM sizing', priority: 'high' },
    { category: 'market', title: 'Competitive landscape map', priority: 'high' },
    { category: 'market', title: 'Industry analyst reports', priority: 'medium' },
    { category: 'market', title: 'Market timing thesis', priority: 'medium' },
    // team
    { category: 'team', title: 'Founder background checks', priority: 'high' },
    { category: 'team', title: 'Key leadership assessment', priority: 'high' },
    { category: 'team', title: 'Org design and culture', priority: 'medium' },
    { category: 'team', title: 'Founder reference calls', priority: 'high' },
    // commercial
    { category: 'commercial', title: 'Customer concentration analysis', priority: 'high' },
    { category: 'commercial', title: 'Contract terms and duration', priority: 'medium' },
    { category: 'commercial', title: 'Pricing power signals', priority: 'medium' },
    { category: 'commercial', title: 'Logo churn data', priority: 'high' },
  ],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { deal_id, company_name, sector, stage, description } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!apiKey || !company_name) {
      return new Response(JSON.stringify(DEMO_CHECKLIST), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic({ apiKey })

    const system = `You are a venture capital diligence associate generating a tailored diligence checklist.

Given a company's details, produce a list of diligence items customized for the sector and stage.
Tailor items specifically:
- Fintech: include regulatory review, banking license check, fraud rate analysis
- Dev tools: include API quality, developer community, GitHub activity
- Marketplace: include take rate, liquidity analysis, supplier concentration
- Healthcare: include regulatory/FDA pathway, reimbursement model, clinical evidence
- Seed stage: fewer items, focus on team/market/product fundamentals
- Series B+: full depth across all workstreams

Return valid JSON with this structure:
{ "items": [{ "category": string, "title": string, "priority": "low" | "medium" | "high" }] }

Categories must be one of: customer, legal, financial, technical, market, team, commercial.
Return 20-35 items total. Return ONLY valid JSON, no other text.`

    const prompt = `Company: ${company_name}
Sector: ${sector || 'N/A'}
Stage: ${stage || 'N/A'}
Description: ${description || 'N/A'}

Generate a tailored diligence checklist for this company.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let result: any
    try {
      result = JSON.parse(text)
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        result = JSON.parse(match[1].trim())
      } else {
        result = DEMO_CHECKLIST
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
