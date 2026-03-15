import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ref_id, reference_name, reference_company, reference_title, target_company, your_name, your_firm } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    let email: string

    if (!apiKey) {
      email = `Hi ${reference_name},

I hope this finds you well. I'm reaching out from ${your_firm || 'our firm'} — we're currently evaluating an investment in ${target_company} and came across your name as someone who may have worked with their product.

Would you be open to a quick 15-minute call this week to share your experience? Your perspective would be genuinely valuable to us, and I'd be happy to return the favor with any market insights we can share.

No prep needed at all.

Best,
${your_name || 'the investment team'}`
    } else {
      const client = new Anthropic({ apiKey })

      const system = `You are helping a venture capital investor draft a short, professional outreach email to a potential customer reference. The email should be:
- Concise (under 150 words)
- Professional but warm
- Clear about why you're reaching out
- Respectful of their time
- NOT pushy or salesy

Return just the email body text, no subject line.`

      const prompt = `Draft an outreach email to:
Name: ${reference_name}
Title: ${reference_title || 'N/A'}
Company: ${reference_company || 'N/A'}

Context:
- We're evaluating an investment in: ${target_company}
- Sender: ${your_name || 'the investment team'} from ${your_firm || 'our firm'}`

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: prompt }],
      })

      email = response.content[0].type === 'text' ? response.content[0].text : ''
    }

    // Save the generated email to the reference contact record
    if (ref_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase
        .from('reference_contacts')
        .update({ outreach_template: email })
        .eq('id', ref_id)
    }

    return new Response(JSON.stringify({ email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
