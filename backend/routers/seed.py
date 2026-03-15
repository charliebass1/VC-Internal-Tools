"""Seed endpoint to populate the database with realistic sample data for the tutorial."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deal, ReferenceContact, ReferenceNote, SignalReport

router = APIRouter(prefix="/api", tags=["seed"])

SAMPLE_DEALS = [
    {
        "company_name": "Lattice AI",
        "company_website": "https://lattice-ai.com",
        "sector": "B2B SaaS — Developer Infrastructure",
        "stage": "deep_dive",
        "lead_partner": "Sarah Kim",
        "description": (
            "Lattice AI provides an AI-powered observability platform for ML pipelines. "
            "They help engineering teams monitor model drift, detect data quality issues, "
            "and automate retraining workflows. Series A target at $18M pre-money. "
            "Strong product signals but need to validate retention and competitive moat."
        ),
    },
    {
        "company_name": "Canopy Health",
        "company_website": "https://canopyhealth.io",
        "sector": "Healthtech SaaS",
        "stage": "screening",
        "lead_partner": "Marcus Chen",
        "description": (
            "Canopy Health is building a patient engagement platform for specialty clinics. "
            "They automate appointment reminders, treatment plan adherence tracking, and "
            "patient-reported outcomes collection. Seed+ round at $6M pre. Early traction "
            "with orthopedic and dermatology practices."
        ),
    },
]

SAMPLE_REFERENCES_DEAL1 = [
    {
        "name": "Alex Rivera",
        "title": "Head of ML Platform",
        "company": "Datadog",
        "email": "a.rivera@example.com",
        "source": "discovered",
        "status": "completed",
        "outreach_template": (
            "Hi Alex,\n\n"
            "I'm reaching out from Benchmark. We're evaluating an investment in Lattice AI and "
            "understand your team may have experience with their observability platform.\n\n"
            "Would you have 15 minutes this week for a quick call? Your perspective on the ML "
            "monitoring space would be incredibly valuable.\n\nBest,\nSarah Kim"
        ),
    },
    {
        "name": "Priya Patel",
        "title": "VP of Engineering",
        "company": "Notion",
        "email": "p.patel@example.com",
        "source": "company_provided",
        "status": "completed",
        "outreach_template": (
            "Hi Priya,\n\n"
            "Thanks for agreeing to speak with us about your experience with Lattice AI. "
            "We're currently evaluating them for a potential investment and would love to "
            "hear your candid perspective.\n\nLooking forward to connecting.\n\nBest,\nSarah Kim"
        ),
    },
    {
        "name": "Jordan Blake",
        "title": "Staff Engineer",
        "company": "Stripe",
        "email": "j.blake@example.com",
        "source": "backchannel",
        "status": "scheduled",
        "outreach_template": "",
    },
    {
        "name": "Emily Huang",
        "title": "Director of Data Engineering",
        "company": "Figma",
        "email": "e.huang@example.com",
        "source": "discovered",
        "status": "outreach_sent",
        "outreach_template": (
            "Hi Emily,\n\n"
            "I'm Sarah Kim at Benchmark. We're doing diligence on a company in the ML "
            "observability space and your name came up as someone with deep experience in "
            "this area. Would you be open to a brief call?\n\nBest,\nSarah"
        ),
    },
]

SAMPLE_REFERENCES_DEAL2 = [
    {
        "name": "Dr. Michael Torres",
        "title": "Practice Administrator",
        "company": "Bay Area Orthopedics",
        "email": "m.torres@example.com",
        "source": "company_provided",
        "status": "identified",
        "outreach_template": "",
    },
    {
        "name": "Rachel Kim",
        "title": "Chief Operations Officer",
        "company": "ClearSkin Dermatology",
        "email": "r.kim@example.com",
        "source": "company_provided",
        "status": "identified",
        "outreach_template": "",
    },
]

SAMPLE_NOTES = [
    # Notes for Alex Rivera (Datadog)
    {
        "ref_index": 0,
        "content": (
            "Strong call. Alex has been using Lattice AI for about 8 months on their ML monitoring stack.\n\n"
            "Key points:\n"
            "- Switched from an internal tool they'd spent 6 months building. Lattice was 'immediately better.'\n"
            "- Main value: model drift detection caught a production issue that would have cost them 'easily six figures' in bad recommendations.\n"
            "- Setup took about 2 weeks with their SDKs, which Alex said was 'surprisingly fast for infra tooling.'\n"
            "- They've expanded from 1 team (recommendations) to 3 teams (also fraud detection and search ranking).\n\n"
            "Concerns:\n"
            "- Pricing has gone up — 'not a dealbreaker but we noticed.'\n"
            "- Wishes they had better support for streaming data pipelines. 'It's batch-first right now.'\n"
            "- When asked about competitors: 'We've seen demos of Arize and WhyLabs. Neither felt as polished but they're improving fast.'\n\n"
            "Direct quote: 'If Lattice AI disappeared tomorrow, we'd feel it within a week. That's the honest answer.'"
        ),
        "interviewer": "Sarah Kim",
        "days_ago": 5,
    },
    {
        "ref_index": 0,
        "content": (
            "Follow-up call with Alex after he checked with his team on some specifics.\n\n"
            "- Their annual contract is ~$120K. Started at $60K — doubled in 8 months.\n"
            "- NPS: 'I'd give them an 8. Would be a 9 if pricing were more predictable.'\n"
            "- The CEO (Lattice) has personally joined two of their support escalations. That surprised Alex.\n"
            "- Their renewal is in Q3 — Alex says 'no question we're renewing.'\n"
            "- Biggest risk from their perspective: if a cloud provider (AWS/GCP) launches a native equivalent."
        ),
        "interviewer": "Sarah Kim",
        "days_ago": 3,
    },
    # Notes for Priya Patel (Notion)
    {
        "ref_index": 1,
        "content": (
            "Good conversation with Priya. Notion adopted Lattice AI about 4 months ago.\n\n"
            "Context: Notion uses ML for search, recommendations, and content summarization.\n\n"
            "Positives:\n"
            "- 'The data quality monitoring alone saved us from shipping a bad search update. Caught a training data issue we missed in our own QA.'\n"
            "- Integration with their existing MLflow setup was 'seamless.'\n"
            "- She specifically praised the alerting system: 'It's the right level of signal-to-noise.'\n\n"
            "Concerns:\n"
            "- 'It's early for them. The product works great but the company is small. We worry about bus factor.'\n"
            "- Enterprise features (SSO, audit logs) are 'on the roadmap but not there yet.'\n"
            "- She's not evaluating alternatives but said 'if Weights & Biases went deep on monitoring, we'd look.'\n\n"
            "Would she recommend? 'Yes, to teams with at least 3-4 ML engineers. Below that, it's overkill. "
            "Above that, it's a no-brainer.'"
        ),
        "interviewer": "Sarah Kim",
        "days_ago": 2,
    },
    # Notes for Priya Patel - second call
    {
        "ref_index": 1,
        "content": (
            "Quick follow-up with Priya via email.\n\n"
            "She checked with her ML lead and confirmed:\n"
            "- They're on a $85K/year plan, up from $50K initial contract.\n"
            "- Team finds the dashboard 'indispensable' during model deployment reviews.\n"
            "- One frustration: 'The docs could be better. We've had to figure out some things from source code.'\n"
            "- Would they pay 20% more? 'Probably yes, but we'd push back. The value is there but we have budget constraints.'"
        ),
        "interviewer": "Sarah Kim",
        "days_ago": 1,
    },
]

SAMPLE_SIGNAL_REPORT = {
    "summary": (
        "Based on two completed customer reference calls (Datadog and Notion), the signal on Lattice AI is "
        "strongly positive with manageable risks. Both customers describe the product as meaningfully better "
        "than alternatives and internal tools, with concrete examples of value delivered (catching production "
        "issues, preventing bad model deployments).\n\n"
        "The expansion signal is strong — both customers have roughly doubled their spend within the first year, "
        "and both confirmed renewals. The founding team's responsiveness (CEO joining support calls) is a standout "
        "signal that's consistent across references.\n\n"
        "Primary risk vectors are: (1) competitive pressure from well-funded players (Arize, WhyLabs) and potential "
        "cloud-native offerings, (2) pricing sensitivity — both references noted price increases, and (3) the company's "
        "small team size creating enterprise readiness gaps (SSO, audit logs, documentation). Net: strong product-market "
        "fit signal at the current customer profile. Recommend proceeding to IC with a focused diligence on competitive "
        "moat and enterprise roadmap."
    ),
    "signals": [
        {
            "category": "product_quality",
            "signal": "Product consistently described as superior to internal tools and competitors",
            "sentiment": "positive",
            "evidence": "\"If Lattice AI disappeared tomorrow, we'd feel it within a week.\" — Alex Rivera, Datadog",
        },
        {
            "category": "product_quality",
            "signal": "Setup and integration praised as fast for infrastructure tooling",
            "sentiment": "positive",
            "evidence": "\"Surprisingly fast for infra tooling\" (2-week setup) and \"seamless\" MLflow integration",
        },
        {
            "category": "market_fit",
            "signal": "Solves a real, quantifiable pain point with clear ROI",
            "sentiment": "positive",
            "evidence": "Drift detection caught issue worth \"easily six figures\"; prevented bad search update at Notion",
        },
        {
            "category": "expansion_potential",
            "signal": "Both customers have doubled spend within first year",
            "sentiment": "positive",
            "evidence": "Datadog: $60K → $120K in 8 months. Notion: $50K → $85K in 4 months.",
        },
        {
            "category": "churn_risk",
            "signal": "Both customers confirmed renewal intent but noted pricing sensitivity",
            "sentiment": "neutral",
            "evidence": "\"Not a dealbreaker but we noticed\" the price increase; \"We'd push back\" on 20% increase",
        },
        {
            "category": "competitive_position",
            "signal": "Competitors acknowledged but not seen as immediate threat",
            "sentiment": "neutral",
            "evidence": "\"Neither felt as polished but they're improving fast\" — on Arize and WhyLabs",
        },
        {
            "category": "competitive_position",
            "signal": "Risk of cloud provider commoditization flagged",
            "sentiment": "negative",
            "evidence": "\"Biggest risk: if a cloud provider launches a native equivalent\" — Alex Rivera",
        },
        {
            "category": "team_perception",
            "signal": "CEO responsiveness cited unprompted by both references",
            "sentiment": "positive",
            "evidence": "CEO personally joined support escalations at Datadog; team responsiveness praised at Notion",
        },
        {
            "category": "churn_risk",
            "signal": "Enterprise readiness gaps could limit upmarket expansion",
            "sentiment": "negative",
            "evidence": "SSO and audit logs \"on the roadmap but not there yet\"; docs need improvement",
        },
    ],
    "red_flags": [
        "Both references independently flagged pricing increases — suggests pricing power may be tested at scale",
        "Cloud provider risk (AWS/GCP native offering) identified as existential threat by power user",
        "Enterprise features (SSO, audit logs) not yet shipped — limits expansion into larger accounts",
        "Documentation quality cited as pain point — could slow developer adoption",
        "Small team size creates \"bus factor\" concern for enterprise buyers",
    ],
    "green_flags": [
        "Both customers doubled spend within first year — strong natural expansion motion",
        "Product catches real, high-dollar-value issues — clear and quantifiable ROI",
        "CEO responsiveness cited unprompted across all calls — founder-market fit signal",
        "Both references confirmed renewal with no hesitation",
        "Integration and setup speed praised — low barrier to adoption",
        "Referenced as meaningfully better than alternatives, not just incrementally better",
    ],
}


@router.post("/seed-tutorial")
def seed_tutorial_data(db: Session = Depends(get_db)):
    """Seed the database with realistic sample data for the tutorial."""

    now = datetime.now(timezone.utc)

    # Create deals
    deals = []
    for deal_data in SAMPLE_DEALS:
        deal = Deal(**deal_data)
        db.add(deal)
        db.flush()
        deals.append(deal)

    primary_deal = deals[0]  # Lattice AI — the fully populated deal
    secondary_deal = deals[1]  # Canopy Health — early stage deal

    # Add references to primary deal
    primary_refs = []
    for ref_data in SAMPLE_REFERENCES_DEAL1:
        ref = ReferenceContact(deal_id=primary_deal.id, **ref_data)
        db.add(ref)
        db.flush()
        primary_refs.append(ref)

    # Add references to secondary deal
    for ref_data in SAMPLE_REFERENCES_DEAL2:
        ref = ReferenceContact(deal_id=secondary_deal.id, **ref_data)
        db.add(ref)
        db.flush()

    # Add notes to primary deal references
    for note_data in SAMPLE_NOTES:
        ref = primary_refs[note_data["ref_index"]]
        note = ReferenceNote(
            reference_id=ref.id,
            content=note_data["content"],
            interviewer=note_data["interviewer"],
            call_date=now - timedelta(days=note_data["days_ago"]),
        )
        db.add(note)

    # Add signal report to primary deal
    report = SignalReport(
        deal_id=primary_deal.id,
        summary=SAMPLE_SIGNAL_REPORT["summary"],
        signals=SAMPLE_SIGNAL_REPORT["signals"],
        red_flags=SAMPLE_SIGNAL_REPORT["red_flags"],
        green_flags=SAMPLE_SIGNAL_REPORT["green_flags"],
    )
    db.add(report)

    db.commit()

    return {
        "success": True,
        "message": f"Loaded 2 deals, 6 references, 4 call notes, and 1 signal report.",
        "deal_id": primary_deal.id,
    }
