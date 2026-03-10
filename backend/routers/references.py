from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Deal, ReferenceContact, ReferenceNote
from ..schemas import (
    ReferenceContactCreate,
    ReferenceContactUpdate,
    ReferenceContactOut,
    ReferenceNoteCreate,
    ReferenceNoteOut,
)

router = APIRouter(prefix="/api", tags=["references"])


@router.get("/deals/{deal_id}/references", response_model=list[ReferenceContactOut])
def list_references(deal_id: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal.references


@router.post("/deals/{deal_id}/references", response_model=ReferenceContactOut, status_code=201)
def create_reference(deal_id: str, payload: ReferenceContactCreate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    ref = ReferenceContact(deal_id=deal_id, **payload.model_dump())
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


@router.patch("/references/{ref_id}", response_model=ReferenceContactOut)
def update_reference(ref_id: str, payload: ReferenceContactUpdate, db: Session = Depends(get_db)):
    ref = db.query(ReferenceContact).filter(ReferenceContact.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ref, key, value)
    db.commit()
    db.refresh(ref)
    return ref


@router.delete("/references/{ref_id}", status_code=204)
def delete_reference(ref_id: str, db: Session = Depends(get_db)):
    ref = db.query(ReferenceContact).filter(ReferenceContact.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
    db.delete(ref)
    db.commit()


# --- Notes ---

@router.post("/references/{ref_id}/notes", response_model=ReferenceNoteOut, status_code=201)
def add_note(ref_id: str, payload: ReferenceNoteCreate, db: Session = Depends(get_db)):
    ref = db.query(ReferenceContact).filter(ReferenceContact.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
    note = ReferenceNote(
        reference_id=ref_id,
        content=payload.content,
        interviewer=payload.interviewer,
    )
    if payload.call_date:
        note.call_date = payload.call_date
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
