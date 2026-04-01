from datetime import datetime
from pydantic import BaseModel


# --- Deal ---

class DealCreate(BaseModel):
    company_name: str
    company_website: str = ""
    sector: str = ""
    stage: str = "screening"
    lead_partner: str = ""
    description: str = ""


class DealUpdate(BaseModel):
    company_name: str | None = None
    company_website: str | None = None
    sector: str | None = None
    stage: str | None = None
    lead_partner: str | None = None
    description: str | None = None


class DealOut(BaseModel):
    id: str
    company_name: str
    company_website: str
    sector: str
    stage: str
    lead_partner: str
    description: str
    created_at: datetime
    updated_at: datetime
    reference_count: int = 0
    completed_references: int = 0

    model_config = {"from_attributes": True}


# --- Reference Contact ---

class ReferenceContactCreate(BaseModel):
    name: str
    title: str = ""
    company: str = ""
    email: str = ""
    linkedin_url: str = ""
    source: str = "company_provided"
    status: str = "identified"


class ReferenceContactUpdate(BaseModel):
    name: str | None = None
    title: str | None = None
    company: str | None = None
    email: str | None = None
    linkedin_url: str | None = None
    source: str | None = None
    status: str | None = None
    outreach_template: str | None = None


class ReferenceNoteOut(BaseModel):
    id: str
    reference_id: str
    content: str
    call_date: datetime
    interviewer: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReferenceContactOut(BaseModel):
    id: str
    deal_id: str
    name: str
    title: str
    company: str
    email: str
    linkedin_url: str
    source: str
    status: str
    outreach_template: str
    created_at: datetime
    updated_at: datetime
    notes: list[ReferenceNoteOut] = []

    model_config = {"from_attributes": True}


# --- Reference Note ---

class ReferenceNoteCreate(BaseModel):
    content: str
    call_date: datetime | None = None
    interviewer: str = ""


# --- Signal Report ---

class SignalReportOut(BaseModel):
    id: str
    deal_id: str
    summary: str
    signals: list[dict] = []
    red_flags: list[str] = []
    green_flags: list[str] = []
    generated_at: datetime

    model_config = {"from_attributes": True}


# --- AI Requests ---

class DiscoverRequest(BaseModel):
    company_name: str
    company_website: str = ""
    sector: str = ""
    description: str = ""


class OutreachRequest(BaseModel):
    reference_name: str
    reference_company: str
    reference_title: str
    target_company: str
    your_name: str = "the investment team"
    your_firm: str = "our firm"


class InterviewGuideRequest(BaseModel):
    company_name: str
    sector: str = ""
    reference_name: str = ""
    reference_company: str = ""


# --- Product Evaluation ---

class ProductEvaluationCreate(BaseModel):
    ux_score: int | None = None
    performance_score: int | None = None
    integration_score: int | None = None
    roadmap_score: int | None = None
    moat_score: int | None = None
    ux_notes: str = ""
    performance_notes: str = ""
    integration_notes: str = ""
    roadmap_notes: str = ""
    moat_notes: str = ""
    g2_rating: float | None = None
    g2_review_count: int | None = None
    capterra_rating: float | None = None
    capterra_review_count: int | None = None
    review_summary: str = ""
    demo_transcript: str = ""
    demo_analysis: str = ""
    demo_date: datetime | None = None
    evaluator: str = ""
    overall_score: float | None = None


class ProductEvaluationUpdate(BaseModel):
    ux_score: int | None = None
    performance_score: int | None = None
    integration_score: int | None = None
    roadmap_score: int | None = None
    moat_score: int | None = None
    ux_notes: str | None = None
    performance_notes: str | None = None
    integration_notes: str | None = None
    roadmap_notes: str | None = None
    moat_notes: str | None = None
    g2_rating: float | None = None
    g2_review_count: int | None = None
    capterra_rating: float | None = None
    capterra_review_count: int | None = None
    review_summary: str | None = None
    demo_transcript: str | None = None
    demo_analysis: str | None = None
    demo_date: datetime | None = None
    evaluator: str | None = None
    overall_score: float | None = None


class ProductEvaluationOut(BaseModel):
    id: str
    deal_id: str
    ux_score: int | None = None
    performance_score: int | None = None
    integration_score: int | None = None
    roadmap_score: int | None = None
    moat_score: int | None = None
    ux_notes: str
    performance_notes: str
    integration_notes: str
    roadmap_notes: str
    moat_notes: str
    g2_rating: float | None = None
    g2_review_count: int | None = None
    capterra_rating: float | None = None
    capterra_review_count: int | None = None
    review_summary: str
    demo_transcript: str
    demo_analysis: str
    demo_date: datetime | None = None
    evaluator: str
    overall_score: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DemoAnalysisRequest(BaseModel):
    transcript: str
    company_name: str
    sector: str = ""


# --- Diligence Workstream ---

class DiligenceWorkstreamCreate(BaseModel):
    category: str
    title: str
    owner: str = ""
    status: str = "not_started"
    priority: str = "medium"
    due_date: datetime | None = None
    notes: str = ""


class DiligenceWorkstreamUpdate(BaseModel):
    category: str | None = None
    title: str | None = None
    owner: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    notes: str | None = None


class DiligenceWorkstreamOut(BaseModel):
    id: str
    deal_id: str
    category: str
    title: str
    owner: str
    status: str
    priority: str
    due_date: datetime | None = None
    notes: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
