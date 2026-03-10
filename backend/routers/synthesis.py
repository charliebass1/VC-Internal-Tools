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


def _call_claude(system: str, prompt: str) -> str:
    client = _get_claude_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Claude API not available. Set ANTHROPIC_API_KEY in .env and install the anthropic package.",
        )
    response = client.messages.create(
        model="claude-sonnet-4-6",
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
