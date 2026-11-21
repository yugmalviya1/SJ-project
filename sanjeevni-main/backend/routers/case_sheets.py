"""
MedSecure AI: Clinical Case Sheet Router
Handles:
- Creating multi-section clinical case sheets (Chief Complaint, HPI, Vitals, Exam, Diagnosis, Treatment, Follow-up)
- Saving draft case sheets
- Finalizing case sheets into versioned medical records with cryptographic SHA-256 hash generation
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os

from database.models import CaseSheet, Patient, Doctor, RecordVersion, AuditLog
from backend.deps import get_db, get_ledger
from security.auth import get_current_user, RBACEnforcer
from blockchain.ledger import MedicalLedger

router = APIRouter()

class CaseSheetSaveRequest(BaseModel):
    patient_mrn: str
    doctor_id: str
    hospital_id: Optional[str] = "HOSP-001"
    status: str = "DRAFT"  # DRAFT or FINALIZED
    chief_complaint: Optional[str] = None
    history_present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    past_surgical_history: Optional[str] = None
    family_history: Optional[str] = None
    social_lifestyle_history: Optional[str] = None
    allergies: Optional[List[str]] = []
    vitals: Optional[Dict[str, Any]] = {}
    physical_examination: Optional[str] = None
    provisional_diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    procedures: Optional[str] = None
    doctor_notes: Optional[str] = None
    follow_up_instructions: Optional[str] = None

@router.get("/patient/{mrn}")
def get_patient_case_sheets(mrn: str, current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch case sheets for a patient with RBAC & consent checking."""
    RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin", "Patient"], target_mrn=mrn)
    
    sheets = db.query(CaseSheet).filter(CaseSheet.patient_mrn == mrn).order_by(CaseSheet.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "patient_mrn": s.patient_mrn,
            "doctor_id": s.doctor_id,
            "hospital_id": s.hospital_id,
            "status": s.status,
            "version": s.version,
            "chief_complaint": s.chief_complaint,
            "history_present_illness": s.history_present_illness,
            "past_medical_history": s.past_medical_history,
            "past_surgical_history": s.past_surgical_history,
            "family_history": s.family_history,
            "social_lifestyle_history": s.social_lifestyle_history,
            "allergies": s.allergies or [],
            "vitals": s.vitals or {},
            "physical_examination": s.physical_examination,
            "provisional_diagnosis": s.provisional_diagnosis,
            "treatment_plan": s.treatment_plan,
            "procedures": s.procedures,
            "doctor_notes": s.doctor_notes,
            "follow_up_instructions": s.follow_up_instructions,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "finalized_at": s.finalized_at.isoformat() if s.finalized_at else None
        }
        for s in sheets
    ]

@router.post("")
def save_case_sheet(req: CaseSheetSaveRequest, current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates or updates a multi-section case sheet. If finalized, creates a RecordVersion and anchors SHA-256 in ledger."""
    RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin"])

    patient = db.query(Patient).filter(Patient.mrn == req.patient_mrn).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    sheet_id = f"CS-{os.urandom(3).hex().upper()}"
    new_sheet = CaseSheet(
        id=sheet_id,
        patient_mrn=req.patient_mrn,
        doctor_id=req.doctor_id,
        hospital_id=req.hospital_id,
        status=req.status,
        version=1,
        chief_complaint=req.chief_complaint,
        history_present_illness=req.history_present_illness,
        past_medical_history=req.past_medical_history,
        past_surgical_history=req.past_surgical_history,
        family_history=req.family_history,
        social_lifestyle_history=req.social_lifestyle_history,
        allergies=req.allergies or [],
        vitals=req.vitals or {},
        physical_examination=req.physical_examination,
        provisional_diagnosis=req.provisional_diagnosis,
        treatment_plan=req.treatment_plan,
        procedures=req.procedures,
        doctor_notes=req.doctor_notes,
        follow_up_instructions=req.follow_up_instructions,
        finalized_at=datetime.now(timezone.utc) if req.status == "FINALIZED" else None
    )
    db.add(new_sheet)
    db.commit()
    db.refresh(new_sheet)

    version_info = None
    if req.status == "FINALIZED":
        # Create immutable RecordVersion snapshot
        snapshot = {
            "case_sheet_id": new_sheet.id,
            "patient_mrn": new_sheet.patient_mrn,
            "doctor_id": new_sheet.doctor_id,
            "chief_complaint": new_sheet.chief_complaint,
            "vitals": new_sheet.vitals,
            "provisional_diagnosis": new_sheet.provisional_diagnosis,
            "treatment_plan": new_sheet.treatment_plan
        }
        canonical_hash = MedicalLedger.canonical_hash(snapshot)
        rec_ver = RecordVersion(
            id=f"VER-{os.urandom(3).hex().upper()}",
            record_type="CASE_SHEET",
            record_id=new_sheet.id,
            version_number=1,
            snapshot_data=snapshot,
            canonical_hash=canonical_hash,
            created_by=req.doctor_id,
            change_summary=f"Doctor finalized clinical case sheet {new_sheet.id}"
        )
        db.add(rec_ver)

        # Anchor into ledger
        ledger = get_ledger()
        ledger.commit_record(record_id=new_sheet.id, version=1, record_data=snapshot)

        version_info = {
            "version_id": rec_ver.id,
            "version_number": 1,
            "canonical_hash": canonical_hash
        }

    # Audit log
    audit = AuditLog(
        user_id=current_user["sub"],
        action="CASE_SHEET_CREATED" if req.status == "DRAFT" else "CASE_SHEET_FINALIZED",
        patient_mrn=req.patient_mrn,
        resource_id=new_sheet.id,
        status="SUCCESS",
        details={"status": req.status, "version": 1}
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SUCCESS",
        "case_sheet_id": new_sheet.id,
        "sheet_status": new_sheet.status,
        "version_info": version_info,
        "message": f"Case sheet saved as {new_sheet.status}."
    }
