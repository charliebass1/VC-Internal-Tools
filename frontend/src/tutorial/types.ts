export interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector?: string // CSS selector for highlighting an element
  tab?: 'references' | 'discover' | 'guide' | 'signals'
  action?: 'click' | 'observe' | 'input'
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export interface TutorialProgress {
  currentStep: number
  completedSteps: string[]
  tutorialId: string
  startedAt: string
  completed: boolean
}

export const TUTORIAL_STORAGE_KEY = 'refcheck_tutorial_progress'

export const DILIGENCE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RefCheck',
    description:
      'RefCheck automates the customer reference checking process for VC due diligence. This tutorial will walk you through the entire workflow — from creating a deal to synthesizing signals for your investment committee.',
    position: 'center',
    action: 'observe',
  },
  {
    id: 'deal-pipeline',
    title: 'Step 1: The Deal Pipeline',
    description:
      'This is your deal pipeline. Every company you\'re evaluating starts here. You can see each deal\'s stage (screening, deep dive, IC review), sector, lead partner, and how many reference calls are complete.',
    position: 'center',
    action: 'observe',
  },
  {
    id: 'create-deal',
    title: 'Step 2: Create a Deal',
    description:
      'Click "+ New Deal" to add a company you\'re evaluating. Enter the company name, website, sector, and a brief description of the investment thesis. This forms the foundation for all reference checking.',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'deal-detail-overview',
    title: 'Step 3: Deal Detail View',
    description:
      'Once you open a deal, you\'ll see the stats dashboard at the top showing total references, completed calls, scheduled calls, and signal reports. Below that are four key tabs for your workflow.',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'ai-discovery',
    title: 'Step 4: AI Customer Discovery',
    description:
      'The "AI Discovery" tab uses Claude to suggest likely customers of the target company. It analyzes the company\'s sector and description to identify realistic reference contacts you can reach out to independently — not just the cherry-picked references the company provides.',
    tab: 'discover',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'add-references',
    title: 'Step 5: Managing References',
    description:
      'The "References" tab is your command center. Add contacts manually (company-provided, backchannel, or AI-discovered), track their status from identified through outreach, scheduling, and completion. Each reference card expands to show full details.',
    tab: 'references',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'outreach-email',
    title: 'Step 6: Generate Outreach Emails',
    description:
      'For each reference, click "Generate Outreach Email" to have AI draft a professional, concise cold email. The email is tailored to the contact\'s role and company, and explains why you\'re reaching out for a reference check.',
    tab: 'references',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'interview-guide',
    title: 'Step 7: Interview Guide',
    description:
      'Before your reference calls, generate a tailored interview guide. It includes structured questions across five areas: Discovery & Onboarding, Product Value, Team & Support, Commercial Reality, and Recommendation. These questions are designed to uncover real signals, not just platitudes.',
    tab: 'guide',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'capture-notes',
    title: 'Step 8: Capture Call Notes',
    description:
      'After each reference call, expand the contact card and add your notes. Record the date, interviewer name, and freeform notes. Capture direct quotes — they become the evidence in your signal report.',
    tab: 'references',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'synthesize-signals',
    title: 'Step 9: Signal Synthesis',
    description:
      'Once you have notes from multiple reference calls, click "Synthesize Signals." AI analyzes all your notes and produces a structured report with: an overall assessment, detailed signals by category (product quality, market fit, churn risk, etc.), and clear red/green flags for your IC memo.',
    tab: 'signals',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'signal-report',
    title: 'Step 10: Reading the Signal Report',
    description:
      'The signal report gives you a 2-3 paragraph assessment, green flags (expansion signals, team quality, product love), and red flags (churn risk, competitor threats, pricing concerns). Each signal includes the sentiment and direct evidence from your notes.',
    tab: 'signals',
    action: 'observe',
    position: 'center',
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description:
      'That\'s the full RefCheck workflow. To try it yourself, load the sample dataset from the tutorial page and explore a pre-populated deal with references, notes, and a signal report. Or create your own deal from scratch!',
    position: 'center',
    action: 'observe',
  },
]
