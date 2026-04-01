import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const DEMO_ANALYSIS = {
  key_strengths: [
    'Clean, intuitive UI with minimal onboarding required',
    'Fast load times and responsive interactions throughout the demo',
    'Deep API integration with major platforms (Salesforce, HubSpot, Slack)',
    'Real-time collaboration features that competitors lack',
  ],
  weaknesses: [
    'Mobile experience feels like an afterthought — limited feature parity',
    'Reporting and analytics module is basic compared to incumbents',
    'No offline mode, which limits use in field sales scenarios',
  ],
  follow_up_questions: [
    'What is the roadmap for mobile feature parity?',
    'How does the reporting module compare to dedicated BI tools customers may already use?',
    'What is the current infrastructure for handling 10x user growth?',
    'How is data exported if a customer churns — is there lock-in risk?',
  ],
  red_flags: [
    'Demo crashed briefly during the data import flow — possible stability issues at scale',
    'Pricing page was skipped quickly — may indicate sensitivity around pricing model',
  ],
  suggested_scores: {
    ux_score: 4,
    performance_score: 4,
    integration_score: 4,
    roadmap_score: 3,
    moat_score: 3,
  },
  summary:
    'The product demonstrates strong UX fundamentals and solid technical execution in its core ' +
    'workflow. Integration depth with major platforms is a real differentiator and creates meaningful ' +
    'switching costs. However, the mobile experience and analytics capabilities lag behind what ' +
    'enterprise buyers expect, and the brief crash during data import raises questions about ' +
    'infrastructure maturity. Overall, the product feels like a strong Series A-stage tool with ' +
    'clear gaps to close before it can win upmarket deals.',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { evaluation_id, transcript, company_name, sector } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the evaluation exists
    const { data: evaluation, error: evalError } = await supabase
      .from('product_evaluations')
      .select('id, deal_id')
      .eq('id', evaluation_id)
      .single()

    if (evalError || !evaluation) {
      return new Response(JSON.stringify({ error: 'Evaluation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    let analysisData: any

    if (!apiKey || !transcript?.trim()) {
      analysisData = DEMO_ANALYSIS
    } else {
      const client = new Anthropic({ apiKey })

      const system = `You are a venture capital product analyst evaluating a software product demo.
Analyze the demo transcript and produce a structured assessment.

Return valid JSON with these keys:
- key_strengths: array of strings — what the product does well
- weaknesses: array of strings — gaps, missing features, rough edges
- follow_up_questions: array of strings — questions to ask the founder
- red_flags: array of strings — concerning patterns observed
- suggested_scores: object with keys ux_score, performance_score, integration_score, roadmap_score, moat_score (each integer 1-5)
- summary: 2-3 sentence overall assessment

Return ONLY valid JSON, no other text.`

      const prompt = `Company: ${company_name}
Sector: ${sector || 'N/A'}

Demo transcript / notes:
${transcript}

Analyze this product demo and provide a structured assessment.`

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''

      try {
        analysisData = JSON.parse(text)
      } catch {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) {
          analysisData = JSON.parse(match[1].trim())
        } else {
          analysisData = {
            key_strengths: [],
            weaknesses: [],
            follow_up_questions: [],
            red_flags: [],
            suggested_scores: {},
            summary: text,
          }
        }
      }
    }

    // Save transcript and analysis back to the evaluation
    const { error: updateError } = await supabase
      .from('product_evaluations')
      .update({
        demo_transcript: transcript || '',
        demo_analysis: JSON.stringify(analysisData),
      })
      .eq('id', evaluation_id)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
