from __future__ import annotations

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
