from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deal
from ..schemas import DealCreate, DealUpdate, DealOut

router = APIRouter(prefix="/api/deals", tags=["deals"])


def _deal_to_out(deal: Deal) -> DealOut:
    return DealOut(
        id=deal.id,
        company_name=deal.company_name,
        company_website=deal.company_website,
        sector=deal.sector,
        stage=deal.stage,
        lead_partner=deal.lead_partner,
        description=deal.description,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
        reference_count=len(deal.references),
        completed_references=sum(1 for r in deal.references if r.status == "completed"),
    )


@router.get("", response_model=list[DealOut])
def list_deals(db: Session = Depends(get_db)):
    deals = db.query(Deal).order_by(Deal.created_at.desc()).all()
    return [_deal_to_out(d) for d in deals]


@router.post("", response_model=DealOut, status_code=201)
def create_deal(payload: DealCreate, db: Session = Depends(get_db)):
    deal = Deal(**payload.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return _deal_to_out(deal)


@router.get("/{deal_id}", response_model=DealOut)
def get_deal(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return _deal_to_out(deal)


@router.patch("/{deal_id}", response_model=DealOut)
def update_deal(deal_id: str, payload: DealUpdate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(deal, key, value)
    db.commit()
    db.refresh(deal)
    return _deal_to_out(deal)


@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
