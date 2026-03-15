import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deal, ReferenceContact, SignalReport
from ..schemas import (
    DiscoverRequest,
    OutreachRequest,
    InterviewGuideRequest,
    SignalReportOut,
)

router = APIRouter(prefix="/api", tags=["synthesis"])

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


def _get_claude_client():
    if not ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except ImportError:
        return None


DEMO_DISCOVER = json.dumps([
    {"name": "Sarah Chen", "title": "VP of Engineering", "company": "Stripe", "reasoning": "Likely buyer of developer tooling at a high-growth fintech"},
    {"name": "Marcus Webb", "title": "Head of Platform", "company": "Shopify", "reasoning": "Platform teams at e-commerce companies are core buyers"},
    {"name": "Priya Nair", "title": "CTO", "company": "Notion", "reasoning": "Productivity-first companies adopt infrastructure tools early"},
    {"name": "James Liu", "title": "Director of DevOps", "company": "Figma", "reasoning": "Fast-growing SaaS companies invest heavily in developer experience"},
    {"name": "Rachel Torres", "title": "VP Engineering", "company": "Linear", "reasoning": "Small, high-output engineering teams are a core ICP"},
    {"name": "Tom Okafor", "title": "Engineering Manager", "company": "Vercel", "reasoning": "Vercel's developer focus aligns with this product's positioning"},
])

DEMO_OUTREACH = """Hi {name},

I hope this finds you well. I'm reaching out from Benchmark Capital — we're currently evaluating an investment in [Company] and came across your name as someone who may have worked with their product.

Would you be open to a quick 15-minute call this week to share your experience? Your perspective would be genuinely valuable to us, and I'd be happy to return the favor with any market insights we can share.

No prep needed at all.

Best,
[Your name]"""

DEMO_GUIDE = """## Customer Reference Interview Guide

### 1. Discovery & Onboarding
1. How did you first hear about [Company], and what problem were you trying to solve?
2. What alternatives did you evaluate before choosing them?
3. How long did it take to get up and running, and how was the onboarding experience?

### 2. Product Value
4. What does [Company] do better than anything else you've tried?
5. Which features do you use most heavily day-to-day?
6. Are there things you wish the product did that it currently doesn't?

### 3. Team & Support
7. How responsive is the team when you have issues or questions?
8. Have they shipped improvements that addressed your feedback?

### 4. Commercial Reality
9. How has your usage and spend changed since you started — expanded, stayed flat, or contracted?
10. Are you currently evaluating any alternatives or competitors?
11. If [Company] raised prices 20%, would you stay?

### 5. Recommendation
12. On a scale of 1–10, how likely are you to recommend [Company] to a peer? What would make it a 10?
13. Is there anything about this company a VC should know before investing?"""

DEMO_SYNTHESIS = {
    "summary": (
        "Based on three customer reference calls, the overall signal on [Company] is cautiously positive. "
        "Customers consistently praised the core product's ease of use and the responsiveness of the founding team. "
        "Two of three references described the product as meaningfully better than the alternatives they'd tried, "
        "and both are expanding their usage.\n\n"
        "The primary concern is pricing sensitivity — one reference flagged a recent price increase as disruptive, "
        "and a second mentioned they're 'keeping an eye on' a competitor. The product appears to have strong initial "
        "adoption but the long-term retention thesis hasn't been fully proven out.\n\n"
        "Net: product-market fit looks real at the current customer profile, but churn risk at scale and competitive "
        "dynamics in 12–18 months are worth digging into further before IC."
    ),
    "signals": [
        {"category": "product_quality", "signal": "Consistently praised for ease of setup and daily usability", "sentiment": "positive", "evidence": "\"We were live in an afternoon — nothing else we tried came close.\""},
        {"category": "market_fit", "signal": "Solves a real pain point with no strong incumbent", "sentiment": "positive", "evidence": "\"We had duct-taped three tools together before this. It's a relief.\""},
        {"category": "churn_risk", "signal": "One customer actively evaluating a competitor", "sentiment": "negative", "evidence": "\"We're watching [Competitor] closely — if they ship X feature, we'd likely switch.\""},
        {"category": "expansion_potential", "signal": "Two of three references have expanded usage since initial purchase", "sentiment": "positive", "evidence": "\"We started with one team, now we're rolling it out company-wide.\""},
        {"category": "competitive_position", "signal": "No dominant competitor yet, but the space is attracting entrants", "sentiment": "neutral", "evidence": "\"There wasn't anyone else doing this 18 months ago. Now I see a few.\""},
        {"category": "team_perception", "signal": "Founder responsiveness cited by all three references unprompted", "sentiment": "positive", "evidence": "\"The CEO replied to my support ticket himself. That stuck with me.\""},
    ],
    "red_flags": [
        "One reference is actively evaluating a competitor and cited a missing feature as the trigger",
        "Recent price increase caused friction — suggests pricing power may be limited",
        "No reference mentioned the product as 'mission critical' — adoption is deep but not irreplaceable",
    ],
    "green_flags": [
        "All three references expanded usage since initial purchase",
        "Founding team responsiveness cited unprompted across all calls",
        "Product described as meaningfully better than prior solutions, not just incrementally better",
        "No reference is currently talking to sales at a competitor",
    ],
}


def _demo_mode() -> bool:
    return not ANTHROPIC_API_KEY


def _call_claude(system: str, prompt: str) -> str:
    client = _get_claude_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Claude API not available. Set ANTHROPIC_API_KEY in .env and install the anthropic package.",
        )
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


# --- Customer Discovery ---

@router.post("/deals/{deal_id}/discover")
def discover_customers(deal_id: str, payload: DiscoverRequest, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    system = """You are a venture capital research analyst. Given a company, suggest 6-8 likely customers
that a VC could contact for reference checks. For each, provide:
- name (a realistic but fictional name)
- title (their likely job title)
- company (the company they work at — this is the CUSTOMER of the target company)
- reasoning (why they might be a customer)

Return valid JSON as an array of objects with keys: name, title, company, reasoning.
Return ONLY the JSON array, no other text."""

    prompt = f"""Company: {payload.company_name}
Website: {payload.company_website}
Sector: {payload.sector}
Description: {payload.description}

Suggest likely customers of this company that we could reach out to for reference checks.
Think about: who buys this product? What types of companies and roles?"""

    if _demo_mode():
        return {"customers": json.loads(DEMO_DISCOVER), "demo": True}

    result = _call_claude(system, prompt)

    try:
        # Try to parse the JSON from the response
        customers = json.loads(result)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        import re
        match = re.search(r'\[.*\]', result, re.DOTALL)
        if match:
            customers = json.loads(match.group())
        else:
            customers = []

    return {"customers": customers}


# --- Outreach Email ---

@router.post("/references/{ref_id}/outreach")
def generate_outreach(ref_id: str, payload: OutreachRequest, db: Session = Depends(get_db)):
    ref = db.query(ReferenceContact).filter(ReferenceContact.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")

    system = """You are helping a venture capital investor draft a short, professional outreach email
to a potential customer reference. The email should be:
- Concise (under 150 words)
- Professional but warm
- Clear about why you're reaching out
- Respectful of their time
- NOT pushy or salesy

Return just the email body text, no subject line."""

    prompt = f"""Draft an outreach email to:
Name: {payload.reference_name}
Title: {payload.reference_title}
Company: {payload.reference_company}

We are {payload.your_firm}, evaluating an investment in {payload.target_company}.
We'd like to speak with them briefly about their experience as a customer.

Sender: {payload.your_name}"""

    if _demo_mode():
        email = DEMO_OUTREACH.replace("{name}", payload.reference_name.split()[0])
    else:
        email = _call_claude(system, prompt)

    # Save to the reference record
    ref.outreach_template = email
    db.commit()

    return {"email": email}


# --- Interview Guide ---

@router.post("/deals/{deal_id}/interview-guide")
def generate_interview_guide(deal_id: str, payload: InterviewGuideRequest, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    system = """You are helping a venture capital investor prepare for a customer reference call.
Generate a structured interview guide with 10-12 questions organized into sections.
The questions should uncover:
- How they found and adopted the product
- What problem it solves and alternatives considered
- Product strengths and weaknesses
- Likelihood to renew/expand or churn
- NPS-style recommendation likelihood

Return the guide as markdown with section headers and numbered questions."""

    prompt = f"""Generate a customer reference interview guide for a call about:
Company being evaluated: {payload.company_name}
Sector: {payload.sector}
Reference contact: {payload.reference_name} at {payload.reference_company}

Tailor the questions to this specific company and sector."""

    if _demo_mode():
        return {"guide": DEMO_GUIDE.replace("[Company]", payload.company_name), "demo": True}

    guide = _call_claude(system, prompt)
    return {"guide": guide}


# --- Signal Synthesis ---

@router.post("/deals/{deal_id}/synthesize", response_model=SignalReportOut)
def synthesize_signals(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Gather all notes from completed references
    all_notes = []
    for ref in deal.references:
        for note in ref.notes:
            all_notes.append({
                "reference": ref.name,
                "company": ref.company,
                "title": ref.title,
                "interviewer": note.interviewer,
                "date": str(note.call_date),
                "content": note.content,
            })

    if not all_notes:
        raise HTTPException(status_code=400, detail="No reference notes to synthesize. Add call notes first.")

    if _demo_mode():
        parsed = {k: v for k, v in DEMO_SYNTHESIS.items()}
        parsed["summary"] = parsed["summary"].replace("[Company]", deal.company_name)
        report = SignalReport(deal_id=deal_id, **parsed)
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    system = """You are a venture capital analyst synthesizing customer reference check calls.
Analyze the call notes and produce a structured signal report.

Return valid JSON with these keys:
- summary: 2-3 paragraph overall assessment
- signals: array of {category, signal, sentiment, evidence} where:
  - category is one of: product_quality, market_fit, churn_risk, competitive_position, expansion_potential, team_perception
  - signal is a short description
  - sentiment is "positive", "negative", or "neutral"
  - evidence is a quote or paraphrase from the notes
- red_flags: array of strings — concerning patterns
- green_flags: array of strings — strong positive signals

Return ONLY valid JSON, no other text."""

    prompt = f"""Company: {deal.company_name}
Sector: {deal.sector}

Reference call notes:
{json.dumps(all_notes, indent=2)}

Synthesize these reference calls into a structured signal report."""

    result = _call_claude(system, prompt)

    try:
        parsed = json.loads(result)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', result, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
        else:
            parsed = {
                "summary": result,
                "signals": [],
                "red_flags": [],
                "green_flags": [],
            }

    report = SignalReport(
        deal_id=deal_id,
        summary=parsed.get("summary", ""),
        signals=parsed.get("signals", []),
        red_flags=parsed.get("red_flags", []),
        green_flags=parsed.get("green_flags", []),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/deals/{deal_id}/signals", response_model=list[SignalReportOut])
def get_signal_reports(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal.signal_reports
