import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deal, ProductEvaluation
from ..schemas import (
    ProductEvaluationCreate,
    ProductEvaluationUpdate,
    ProductEvaluationOut,
    DemoAnalysisRequest,
)

router = APIRouter(prefix="/api", tags=["evaluation"])

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


def _get_claude_client():
    if not ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except ImportError:
        return None


def _demo_mode() -> bool:
    return not ANTHROPIC_API_KEY


def _call_claude(system: str, prompt: str) -> str:
    client = _get_claude_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Claude API not available. Set ANTHROPIC_API_KEY.",
        )
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def _compute_overall_score(evaluation) -> float | None:
    scores = [
        s for s in [
            evaluation.ux_score,
            evaluation.performance_score,
            evaluation.integration_score,
            evaluation.roadmap_score,
            evaluation.moat_score,
        ] if s is not None
    ]
    if not scores:
        return None
    return round(sum(scores) / len(scores), 2)


DEMO_ANALYSIS = json.dumps({
    "key_strengths": [
        "Clean, intuitive UI with minimal onboarding required",
        "Fast load times and responsive interactions throughout the demo",
        "Deep API integration with major platforms (Salesforce, HubSpot, Slack)",
        "Real-time collaboration features that competitors lack",
    ],
    "weaknesses": [
        "Mobile experience feels like an afterthought — limited feature parity",
        "Reporting and analytics module is basic compared to incumbents",
        "No offline mode, which limits use in field sales scenarios",
    ],
    "follow_up_questions": [
        "What is the roadmap for mobile feature parity?",
        "How does the reporting module compare to dedicated BI tools customers may already use?",
        "What is the current infrastructure for handling 10x user growth?",
        "How is data exported if a customer churns — is there lock-in risk?",
    ],
    "red_flags": [
        "Demo crashed briefly during the data import flow — possible stability issues at scale",
        "Pricing page was skipped quickly — may indicate sensitivity around pricing model",
    ],
    "suggested_scores": {
        "ux_score": 4,
        "performance_score": 4,
        "integration_score": 4,
        "roadmap_score": 3,
        "moat_score": 3,
    },
    "summary": (
        "The product demonstrates strong UX fundamentals and solid technical execution in its core "
        "workflow. Integration depth with major platforms is a real differentiator and creates meaningful "
        "switching costs. However, the mobile experience and analytics capabilities lag behind what "
        "enterprise buyers expect, and the brief crash during data import raises questions about "
        "infrastructure maturity. Overall, the product feels like a strong Series A-stage tool with "
        "clear gaps to close before it can win upmarket deals."
    ),
})


# --- Get Evaluation ---

@router.get("/deals/{deal_id}/evaluation", response_model=ProductEvaluationOut)
def get_evaluation(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    evaluation = db.query(ProductEvaluation).filter(
        ProductEvaluation.deal_id == deal_id
    ).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="No evaluation found for this deal")

    return evaluation


# --- Create / Upsert Evaluation ---

@router.post("/deals/{deal_id}/evaluation", response_model=ProductEvaluationOut)
def create_evaluation(deal_id: str, payload: ProductEvaluationCreate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    existing = db.query(ProductEvaluation).filter(
        ProductEvaluation.deal_id == deal_id
    ).first()

    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.overall_score = _compute_overall_score(existing)
        db.commit()
        db.refresh(existing)
        return existing

    evaluation = ProductEvaluation(deal_id=deal_id, **payload.model_dump())
    evaluation.overall_score = _compute_overall_score(evaluation)
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation


# --- Update Evaluation ---

@router.patch("/evaluations/{eval_id}", response_model=ProductEvaluationOut)
def update_evaluation(eval_id: str, payload: ProductEvaluationUpdate, db: Session = Depends(get_db)):
    evaluation = db.query(ProductEvaluation).filter(
        ProductEvaluation.id == eval_id
    ).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(evaluation, key, value)

    evaluation.overall_score = _compute_overall_score(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation


# --- Analyze Demo ---

@router.post("/evaluations/{eval_id}/analyze-demo")
def analyze_demo(eval_id: str, payload: DemoAnalysisRequest, db: Session = Depends(get_db)):
    evaluation = db.query(ProductEvaluation).filter(
        ProductEvaluation.id == eval_id
    ).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    if _demo_mode():
        analysis = json.loads(DEMO_ANALYSIS)
        evaluation.demo_transcript = payload.transcript
        evaluation.demo_analysis = DEMO_ANALYSIS
        db.commit()
        return analysis

    system = """You are a venture capital product analyst evaluating a software product demo.
Analyze the demo transcript and produce a structured assessment.

Return valid JSON with these keys:
- key_strengths: array of strings — what the product does well
- weaknesses: array of strings — gaps, missing features, rough edges
- follow_up_questions: array of strings — questions to ask the founder
- red_flags: array of strings — concerning patterns observed
- suggested_scores: object with keys ux_score, performance_score, integration_score, roadmap_score, moat_score (each 1-5)
- summary: 2-3 sentence overall assessment

Return ONLY valid JSON, no other text."""

    prompt = f"""Company: {payload.company_name}
Sector: {payload.sector}

Demo transcript / notes:
{payload.transcript}

Analyze this product demo and provide a structured assessment."""

    result = _call_claude(system, prompt)

    try:
        analysis = json.loads(result)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', result, re.DOTALL)
        if match:
            analysis = json.loads(match.group())
        else:
            analysis = {
                "key_strengths": [],
                "weaknesses": [],
                "follow_up_questions": [],
                "red_flags": [],
                "suggested_scores": {},
                "summary": result,
            }

    evaluation.demo_transcript = payload.transcript
    evaluation.demo_analysis = json.dumps(analysis)
    db.commit()

    return analysis
