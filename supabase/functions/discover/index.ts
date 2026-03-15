import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

const DEMO_CUSTOMERS = [
  { name: 'Sarah Chen', title: 'VP of Engineering', company: 'Stripe', reasoning: 'Stripe regularly adopts cutting-edge developer tools to scale their infrastructure.' },
  { name: 'Marcus Webb', title: 'CTO', company: 'Shopify', reasoning: 'Shopify\'s engineering org is a known early adopter of AI-powered development tools.' },
  { name: 'Priya Nair', title: 'Director of Product', company: 'Figma', reasoning: 'Figma invests heavily in productivity tools that help their distributed team move faster.' },
  { name: 'Jordan Kim', title: 'Head of Data', company: 'DoorDash', reasoning: 'DoorDash\'s ops-heavy business requires robust data tooling across dozens of teams.' },
  { name: 'Alex Rivera', title: 'Principal Engineer', company: 'Notion', reasoning: 'Notion\'s team is known for using novel tools that align with their product philosophy.' },
  { name: 'Taylor Brooks', title: 'Engineering Manager', company: 'Linear', reasoning: 'Linear is a design-forward company that adopts best-in-class developer experience tools.' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_name, company_website, sector, description } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ customers: DEMO_CUSTOMERS, demo: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic({ apiKey })

    const system = `You are a venture capital research analyst. Given a company, suggest 6-8 likely customers that a VC could contact for reference checks. For each, provide:
- name (a realistic but fictional name)
- title (their likely job title)
- company (the company they work at — this is the CUSTOMER of the target company)
- reasoning (why they might be a customer)

Return valid JSON as an array of objects with keys: name, title, company, reasoning.
Return ONLY the JSON array, no other text.`

    const prompt = `Company: ${company_name}
Website: ${company_website || 'N/A'}
Sector: ${sector || 'N/A'}
Description: ${description || 'N/A'}

Suggest 6-8 realistic customer contacts for reference checks.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let customers
    try {
      customers = JSON.parse(text)
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        customers = JSON.parse(match[1].trim())
      } else {
        customers = DEMO_CUSTOMERS
      }
    }

    return new Response(JSON.stringify({ customers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
