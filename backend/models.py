import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Integer, Float
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
    product_evaluation = relationship("ProductEvaluation", back_populates="deal", uselist=False, cascade="all, delete-orphan")
    diligence_workstreams = relationship("DiligenceWorkstream", back_populates="deal", cascade="all, delete-orphan")


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


class ProductEvaluation(Base):
    __tablename__ = "product_evaluations"

    id = Column(String, primary_key=True, default=gen_uuid)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False, unique=True)

    # Scoring dimensions (1-5)
    ux_score = Column(Integer, nullable=True)
    performance_score = Column(Integer, nullable=True)
    integration_score = Column(Integer, nullable=True)
    roadmap_score = Column(Integer, nullable=True)
    moat_score = Column(Integer, nullable=True)

    # Notes per dimension
    ux_notes = Column(Text, default="")
    performance_notes = Column(Text, default="")
    integration_notes = Column(Text, default="")
    roadmap_notes = Column(Text, default="")
    moat_notes = Column(Text, default="")

    # Review aggregation
    g2_rating = Column(Float, nullable=True)
    g2_review_count = Column(Integer, nullable=True)
    capterra_rating = Column(Float, nullable=True)
    capterra_review_count = Column(Integer, nullable=True)
    review_summary = Column(Text, default="")

    # Demo analysis
    demo_transcript = Column(Text, default="")
    demo_analysis = Column(Text, default="")
    demo_date = Column(DateTime, nullable=True)

    # Metadata
    evaluator = Column(String, default="")
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    deal = relationship("Deal", back_populates="product_evaluation")


class DiligenceWorkstream(Base):
    __tablename__ = "diligence_workstreams"

    id = Column(String, primary_key=True, default=gen_uuid)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    owner = Column(String, default="")
    status = Column(String, default="not_started")
    priority = Column(String, default="medium")
    due_date = Column(DateTime, nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    deal = relationship("Deal", back_populates="diligence_workstreams")
