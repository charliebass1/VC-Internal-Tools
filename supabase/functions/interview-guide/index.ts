import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

const DEMO_GUIDE = (companyName: string) => `## Customer Reference Interview Guide
### ${companyName}

---

### 1. Discovery & Onboarding
1. How did you first hear about ${companyName}, and what problem were you trying to solve?
2. What other solutions did you evaluate, and why did you choose ${companyName}?
3. How long did onboarding take, and how would you rate the experience?

### 2. Product Value
4. What's the primary value you get from the product today?
5. What features do you use most, and which have exceeded or fallen short of expectations?
6. Has the product meaningfully changed how your team works?

### 3. Team & Support
7. How responsive and helpful has the ${companyName} team been?
8. Have you had any escalations or serious issues, and how were they handled?

### 4. Commercial Reality
9. How has pricing evolved since you signed? Any surprises?
10. Are you expanding usage, staying flat, or considering reducing?

### 5. Recommendation
11. On a scale of 1–10, how likely are you to recommend ${companyName} to a peer?
12. What would need to change for that score to be a 10?`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_name, sector, reference_name, reference_company } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ guide: DEMO_GUIDE(company_name), demo: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic({ apiKey })

    const system = `You are helping a venture capital investor prepare for a customer reference call. Generate a structured interview guide with 10-12 questions organized into sections. The questions should uncover:
- How they found and adopted the product
- What problem it solves and alternatives considered
- Product strengths and weaknesses
- Likelihood to renew/expand or churn
- NPS-style recommendation likelihood

Return the guide as markdown with section headers and numbered questions.`

    const prompt = `Create an interview guide for a reference call:
Target company being evaluated: ${company_name}
Sector: ${sector || 'N/A'}
Reference contact: ${reference_name || 'N/A'} at ${reference_company || 'N/A'}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: prompt }],
    })

    const guide = response.content[0].type === 'text' ? response.content[0].text : DEMO_GUIDE(company_name)

    return new Response(JSON.stringify({ guide }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
