import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

const DEMO_PROFILE = {
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
    'A fast-growing B2B SaaS platform that uses AI to automate complex workflows for mid-market enterprises. The company has shown strong product-market fit with 3x YoY revenue growth, high net retention, and a rapidly expanding customer base across financial services and healthcare verticals. Founded by repeat entrepreneurs with deep domain expertise.',
  demo: true,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_name, company_website, sector, description, stream } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify(DEMO_PROFILE), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic({ apiKey })

    const system = `You are a venture capital research analyst. Given a company name and any available information, generate a structured company profile for due diligence purposes.

Return valid JSON with these exact keys:
- founded_year (integer or null if unknown)
- team_size_range (string like "11-50", "51-200", "201-500")
- funding_stage (string like "Seed", "Series A", "Series B", etc., or "Unknown")
- total_raised (string like "$10M", "$45M", or "Undisclosed")
- competitors (array of 3-5 competitor company name strings)
- key_people (array of 2-4 objects with keys: name, title, linkedin_url — use empty string for linkedin_url)
- ai_summary (2-3 sentence summary of the company, its market position, and key strengths/risks for a VC investor)

Return ONLY the JSON object, no other text.`

    const prompt = `Company: ${company_name}
Website: ${company_website || 'N/A'}
Sector: ${sector || 'N/A'}
Description: ${description || 'N/A'}

Generate a structured company profile for VC due diligence.`

    // Streaming mode
    if (stream) {
      const messageStream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: prompt }],
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          let fullText = ''
          for await (const event of messageStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              fullText += event.delta.text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`)
              )
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, full: fullText })}\n\n`)
          )
          controller.close()
        },
      })

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Non-streaming mode
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    let profile
    try {
      profile = JSON.parse(text)
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        profile = JSON.parse(match[1].trim())
      } else {
        profile = DEMO_PROFILE
      }
    }

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
