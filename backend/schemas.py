from datetime import datetime
from typing import List, Optional
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
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None
    lead_partner: Optional[str] = None
    description: Optional[str] = None


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
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    outreach_template: Optional[str] = None


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
    notes: List[ReferenceNoteOut] = []

    model_config = {"from_attributes": True}


# --- Reference Note ---

class ReferenceNoteCreate(BaseModel):
    content: str
    call_date: Optional[datetime] = None
    interviewer: str = ""


# --- Signal Report ---

class SignalReportOut(BaseModel):
    id: str
    deal_id: str
    summary: str
    signals: List[dict] = []
    red_flags: List[str] = []
    green_flags: List[str] = []
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
