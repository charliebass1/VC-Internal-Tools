import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Create primary tutorial deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        company_name: 'Lattice AI',
        company_website: 'https://lattice.ai',
        sector: 'B2B SaaS / HR Tech',
        stage: 'deep_dive',
        lead_partner: 'Sequoia Capital',
        description: 'AI-powered performance management platform that automates OKR tracking and employee development plans. 200+ enterprise customers, $8M ARR, growing 15% MoM.',
      })
      .select()
      .single()

    if (dealError) throw new Error(`Failed to create deal: ${dealError.message}`)

    // Create second deal (screening stage)
    await supabase.from('deals').insert({
      company_name: 'Canopy Health',
      company_website: 'https://canopyhealth.io',
      sector: 'Digital Health',
      stage: 'screening',
      lead_partner: 'a16z Bio',
      description: 'Remote patient monitoring platform for chronic disease management. FDA cleared, 50 health system pilots.',
    })

    // Create reference contacts for Lattice AI
    const refsData = [
      {
        deal_id: deal.id,
        name: 'Jennifer Walsh',
        title: 'VP People Operations',
        company: 'Stripe',
        email: 'j.walsh@stripe.com',
        source: 'company_provided',
        status: 'completed',
      },
      {
        deal_id: deal.id,
        name: 'Marcus Thompson',
        title: 'Chief People Officer',
        company: 'Figma',
        email: 'm.thompson@figma.com',
        source: 'company_provided',
        status: 'completed',
      },
      {
        deal_id: deal.id,
        name: 'Priya Sharma',
        title: 'Director of HR',
        company: 'Notion',
        email: 'p.sharma@notion.so',
        source: 'discovered',
        status: 'completed',
      },
      {
        deal_id: deal.id,
        name: 'David Chen',
        title: 'Head of Talent',
        company: 'Linear',
        email: 'd.chen@linear.app',
        source: 'backchannel',
        status: 'completed',
      },
    ]

    const { data: refs, error: refsError } = await supabase
      .from('reference_contacts')
      .insert(refsData)
      .select()

    if (refsError) throw new Error(`Failed to create references: ${refsError.message}`)

    // Add call notes for each reference
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()

    const notesData = [
      {
        reference_id: refs[0].id,
        content: "Jennifer has been using Lattice for 18 months across Stripe's 4,000-person org. She described it as transformative for their performance review cycle — cut admin time by 60%. Key quote: 'We went from dreading review season to actually looking forward to the data we get.' She mentioned the AI summaries for manager feedback are the killer feature. One concern: pricing jumped 40% at renewal and the contract terms were 'less flexible than we expected.' She'd still recommend it — gave it an 8/10. Said they're expanding to use it for compensation planning next quarter.",
        call_date: twoWeeksAgo,
        interviewer: 'Sarah Kim',
      },
      {
        reference_id: refs[1].id,
        content: "Marcus was highly enthusiastic. Figma (700 people) adopted Lattice 2 years ago after evaluating Lattice, Culture Amp, and Workday Perf. Chose Lattice for UX and the OKR module. Strong product-market fit signal: 'Our managers actually use it without being told to.' He noted the Slack integration is excellent. Downside: the analytics dashboard is 'basic compared to what our data team wants.' He specifically called out the customer success team as exceptional — their CSM has helped them redesign their entire performance philosophy. NPS: 9/10. They're a reference account and speak at Lattice's customer events.",
        call_date: oneWeekAgo,
        interviewer: 'James Park',
      },
      {
        reference_id: refs[2].id,
        content: "Priya was more measured. Notion (400 people) has been a customer for 12 months. She said implementation was faster than expected — live in 3 weeks vs the 8 weeks they were quoted by competitors. The AI-generated development plans are 'hit or miss — good 70% of the time.' She raised a yellow flag: they had a 6-week period 6 months ago where the product was notably slow and support response times were poor. Lattice apparently had a infrastructure migration. They stayed but it eroded trust. She's evaluating at renewal whether to switch to Rippling's new HR module. Score: 6.5/10. Wants to see more integrations with their HRIS.",
        call_date: threeDaysAgo,
        interviewer: 'Sarah Kim',
      },
      {
        reference_id: refs[3].id,
        content: "David at Linear (150 people) is their smallest customer in our sample. Very positive — described Lattice as 'right-sized for where we are.' The self-serve onboarding was critical for a team their size without a dedicated HR admin. He had interesting perspective on competitive positioning: they looked at Leapsome and 15Five seriously. Chose Lattice for the brand and the quality of the mobile app. Main critique: pricing feels high for a company under 200 people. 'We're basically subsidizing enterprise customers.' Has recommended to 3 other founders — two became customers. NPS: 8/10. Plans to expand to use compensation benchmarking next cycle.",
        call_date: yesterday,
        interviewer: 'James Park',
      },
    ]

    await supabase.from('reference_notes').insert(notesData)

    // Create a pre-built signal report
    await supabase.from('signal_reports').insert({
      deal_id: deal.id,
      summary: "Lattice AI shows strong product-market fit across enterprise and mid-market segments, with customers citing meaningful efficiency gains in performance management workflows. The product's AI features — particularly feedback summarization and development plan generation — are emerging as key differentiators, though quality is inconsistent. Customer success quality is universally praised and appears to drive retention. The primary risk is pricing: two of four references flagged unexpected cost increases at renewal, and one is actively evaluating alternatives. The 6-week infrastructure outage cited by Notion (now resolved) is a one-time concern but warrants a question about infrastructure roadmap.\n\nNet promoter signal is strong: 3 of 4 references have organically referred other customers, and Figma is an active reference account. Expansion signals are positive, with three references adding use cases beyond core performance reviews. The competitive moat appears to be UX quality and customer success — not defensible long-term without continued product investment.",
      signals: [
        { category: 'product_quality', signal: 'Strong core UX, AI features inconsistent', sentiment: 'positive', evidence: 'Figma: managers use it without being told to. Notion: AI plans are good 70% of the time.' },
        { category: 'market_fit', signal: 'Displacing manual processes, not just incumbents', sentiment: 'positive', evidence: 'Stripe: cut review admin time 60%. All references switched from spreadsheets or Workday.' },
        { category: 'churn_risk', signal: 'Pricing transparency at renewal is a friction point', sentiment: 'negative', evidence: 'Stripe saw 40% price increase. Notion is evaluating Rippling at next renewal.' },
        { category: 'expansion_potential', signal: 'Strong land-and-expand motion', sentiment: 'positive', evidence: '3 of 4 references expanding to new modules (compensation, development planning).' },
        { category: 'competitive_position', signal: 'UX and CS are key differentiators vs. Culture Amp, Leapsome', sentiment: 'positive', evidence: 'Figma and Linear both cited UX and mobile app as primary switching reasons.' },
        { category: 'team_perception', signal: 'Customer success team is a retention driver', sentiment: 'positive', evidence: 'Figma: CSM helped redesign performance philosophy. All references mentioned CSM positively.' },
      ],
      red_flags: [
        'Pricing opacity at renewal eroding trust with 2 of 4 references',
        'One reference (Notion) actively evaluating Rippling as a replacement',
        '6-week infrastructure outage raised reliability concerns despite resolution',
      ],
      green_flags: [
        '3 of 4 references organically referred other customers',
        'Figma is an active reference account and speaks at customer events',
        'All references reporting expansion to additional product modules',
        'Universal praise for customer success team quality',
      ],
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Tutorial data seeded successfully', deal_id: deal.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
