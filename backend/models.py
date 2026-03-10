import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_name = Column(String, nullable=False)
    company_website = Column(String, default="")
    sector = Column(String, default="")
    stage = Column(String, default="screening")  # screening | deep_dive | ic_review | closed
    lead_partner = Column(String, default="")
    description = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    references = relationship("ReferenceContact", back_populates="deal", cascade="all, delete-orphan")
    signal_reports = relationship("SignalReport", back_populates="deal", cascade="all, delete-orphan")


class ReferenceContact(Base):
    __tablename__ = "reference_contacts"

    id = Column(String, primary_key=True, default=gen_uuid)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    name = Column(String, nullable=False)
    title = Column(String, default="")
    company = Column(String, default="")
    email = Column(String, default="")
    linkedin_url = Column(String, default="")
    source = Column(String, default="company_provided")  # company_provided | discovered | backchannel
    status = Column(String, default="identified")  # identified | outreach_sent | scheduled | completed | declined
    outreach_template = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    deal = relationship("Deal", back_populates="references")
    notes = relationship("ReferenceNote", back_populates="reference", cascade="all, delete-orphan")


class ReferenceNote(Base):
    __tablename__ = "reference_notes"

    id = Column(String, primary_key=True, default=gen_uuid)
    reference_id = Column(String, ForeignKey("reference_contacts.id"), nullable=False)
    content = Column(Text, nullable=False)
    call_date = Column(DateTime, default=utcnow)
    interviewer = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)

    reference = relationship("ReferenceContact", back_populates="notes")


class SignalReport(Base):
    __tablename__ = "signal_reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    summary = Column(Text, default="")
    signals = Column(JSON, default=list)  # [{category, signal, sentiment, evidence}]
    red_flags = Column(JSON, default=list)
    green_flags = Column(JSON, default=list)
    generated_at = Column(DateTime, default=utcnow)

    deal = relationship("Deal", back_populates="signal_reports")
