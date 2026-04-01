from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deal, DiligenceWorkstream
from ..schemas import (
    DiligenceWorkstreamCreate,
    DiligenceWorkstreamUpdate,
    DiligenceWorkstreamOut,
)

router = APIRouter(prefix="/api", tags=["diligence"])

DEFAULT_CHECKLIST = [
    # customer
    {"category": "customer", "title": "Reference check calls (company-provided)", "priority": "high"},
    {"category": "customer", "title": "Independent customer interviews (backchannel)", "priority": "high"},
    {"category": "customer", "title": "G2/Capterra review analysis", "priority": "medium"},
    {"category": "customer", "title": "NPS benchmark review", "priority": "medium"},
    # legal
    {"category": "legal", "title": "Cap table review", "priority": "high"},
    {"category": "legal", "title": "IP ownership verification", "priority": "high"},
    {"category": "legal", "title": "Prior litigation check", "priority": "medium"},
    {"category": "legal", "title": "Data privacy compliance (SOC2/GDPR)", "priority": "medium"},
    {"category": "legal", "title": "Key customer contract terms", "priority": "medium"},
    # financial
    {"category": "financial", "title": "ARR/revenue growth rate", "priority": "high"},
    {"category": "financial", "title": "Gross margin analysis", "priority": "high"},
    {"category": "financial", "title": "Burn rate and runway", "priority": "high"},
    {"category": "financial", "title": "Unit economics (CAC, LTV, payback)", "priority": "high"},
    {"category": "financial", "title": "Full data room review", "priority": "medium"},
    # technical
    {"category": "technical", "title": "System architecture review", "priority": "medium"},
    {"category": "technical", "title": "Security posture assessment", "priority": "medium"},
    {"category": "technical", "title": "Engineering team size/quality", "priority": "medium"},
    {"category": "technical", "title": "Tech debt evaluation", "priority": "low"},
    # market
    {"category": "market", "title": "TAM/SAM/SOM sizing", "priority": "high"},
    {"category": "market", "title": "Competitive landscape map", "priority": "high"},
    {"category": "market", "title": "Industry analyst reports", "priority": "medium"},
    {"category": "market", "title": "Market timing thesis", "priority": "medium"},
    # team
    {"category": "team", "title": "Founder background checks", "priority": "high"},
    {"category": "team", "title": "Key leadership assessment", "priority": "high"},
    {"category": "team", "title": "Org design and culture", "priority": "medium"},
    {"category": "team", "title": "Founder reference calls", "priority": "high"},
    # commercial
    {"category": "commercial", "title": "Customer concentration analysis", "priority": "high"},
    {"category": "commercial", "title": "Contract terms and duration", "priority": "medium"},
    {"category": "commercial", "title": "Pricing power signals", "priority": "medium"},
    {"category": "commercial", "title": "Logo churn data", "priority": "high"},
]


@router.get("/deals/{deal_id}/diligence", response_model=list[DiligenceWorkstreamOut])
def list_diligence(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return db.query(DiligenceWorkstream).filter(
        DiligenceWorkstream.deal_id == deal_id
    ).order_by(DiligenceWorkstream.category, DiligenceWorkstream.created_at).all()


@router.post("/deals/{deal_id}/diligence", response_model=DiligenceWorkstreamOut)
def create_diligence(deal_id: str, payload: DiligenceWorkstreamCreate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    item = DiligenceWorkstream(deal_id=deal_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/deals/{deal_id}/diligence/seed", response_model=list[DiligenceWorkstreamOut])
def seed_diligence(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    items = []
    for item_data in DEFAULT_CHECKLIST:
        item = DiligenceWorkstream(deal_id=deal_id, **item_data)
        db.add(item)
        items.append(item)

    db.commit()
    for item in items:
        db.refresh(item)
    return items


@router.patch("/diligence/{item_id}", response_model=DiligenceWorkstreamOut)
def update_diligence(item_id: str, payload: DiligenceWorkstreamUpdate, db: Session = Depends(get_db)):
    item = db.query(DiligenceWorkstream).filter(DiligenceWorkstream.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Diligence item not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/diligence/{item_id}", status_code=204)
def delete_diligence(item_id: str, db: Session = Depends(get_db)):
    item = db.query(DiligenceWorkstream).filter(DiligenceWorkstream.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Diligence item not found")

    db.delete(item)
    db.commit()
