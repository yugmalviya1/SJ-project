"""
MedSecure AI: Consent & Access Control Router
Handles:
- Patient-controlled access granting to specific Doctor or Hospital
- List active and historical consent grants
- Access checking verification
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os

from database.models import ConsentGrant, Patient, Doctor, Hospital, AuditLog
from backend.deps import get_db
from security.auth import get_current_user, RBACEnforcer

router = APIRouter()

class GrantConsentRequest(BaseModel):
    patient_mrn: str
    granted_to_type: str  # 'DOCTOR' or 'HOSPITAL'
    granted_to_id: str    # e.g. DR-1001 or HOSP-001
    scope: str = "FULL"   # FULL, SUMMARY_ONLY, ACCIDENT_ONLY
    reason: Optional[str] = "Patient-initiated clinical record sharing authorization"
    expires_at: Optional[str] = "2027-01-01"

@router.get("/my-grants")
def get_my_grants(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns access grants made by the authenticated patient."""
    RBACEnforcer.verify_role_and_scope(current_user, ["Patient", "Doctor", "HospitalAdmin", "Auditor"])
    
    role = current_user.get("role")
    if role == "Patient":
        mrn = current_user.get("patient_mrn")
        grants = db.query(ConsentGrant).filter(ConsentGrant.patient_mrn == mrn).all()
    else:
        grants = db.query(ConsentGrant).all()

    return [
        {
            "id": g.id,
            "patient_mrn": g.patient_mrn,
            "patient_name": g.patient.full_name if g.patient else "",
            "granted_to_type": g.granted_to_type,
            "granted_to_id": g.granted_to_id,
            "granted_to_name": g.granted_to_name,
            "scope": g.scope,
            "status": g.status,
            "reason": g.reason,
            "granted_at": g.granted_at.isoformat() if g.granted_at else None,
            "expires_at": g.expires_at
        }
        for g in grants
    ]

@router.post("/grant")
def grant_access(req: GrantConsentRequest, current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows a patient to grant explicit access to a doctor or hospital, or clinical staff on their behalf."""
    role = current_user.get("role")
    if role == "Patient":
        RBACEnforcer.verify_role_and_scope(current_user, ["Patient"], target_mrn=req.patient_mrn)
    else:
        RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin"])

    patient = db.query(Patient).filter(Patient.mrn == req.patient_mrn).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    target_name = req.granted_to_id
    if req.granted_to_type == "DOCTOR":
        doc = db.query(Doctor).filter(Doctor.id == req.granted_to_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Doctor with Professional ID '{req.granted_to_id}' not found.")
        target_name = doc.full_name
    elif req.granted_to_type == "HOSPITAL":
        hosp = db.query(Hospital).filter(Hospital.id == req.granted_to_id).first()
        if not hosp:
            raise HTTPException(status_code=404, detail=f"Hospital with ID '{req.granted_to_id}' not found.")
        target_name = hosp.name

    grant_id = f"CSN-{os.urandom(3).hex().upper()}"
    new_grant = ConsentGrant(
        id=grant_id,
        patient_mrn=req.patient_mrn,
        granted_to_type=req.granted_to_type,
        granted_to_id=req.granted_to_id,
        granted_to_name=target_name,
        scope=req.scope,
        status="ACTIVE",
        reason=req.reason,
        expires_at=req.expires_at
    )
    db.add(new_grant)

    # Log audit event
    audit = AuditLog(
        user_id=current_user["sub"],
        action="CONSENT_GRANTED",
        patient_mrn=req.patient_mrn,
        resource_id=req.granted_to_id,
        status="SUCCESS",
        details={
            "grant_id": grant_id,
            "target_type": req.granted_to_type,
            "target_id": req.granted_to_id,
            "scope": req.scope
        }
    )
    db.add(audit)
    db.commit()

    return {
        "status": "CONSENT_ACTIVE",
        "grant_id": grant_id,
        "message": f"Successfully granted {req.scope} access to {target_name}."
    }

@router.get("/directory")
def get_sharing_directory(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns available doctors and hospitals for patient sharing selection."""
    doctors = db.query(Doctor).filter(Doctor.status == "ACTIVE").all()
    hospitals = db.query(Hospital).filter(Hospital.status == "ACTIVE").all()

    return {
        "doctors": [
            {
                "id": d.id,
                "name": d.full_name,
                "specialization": d.specialization,
                "qualifications": d.qualifications,
                "departments": d.departments,
                "hospitals": [h.hospital.name for h in d.hospital_affiliations if h.hospital]
            }
            for d in doctors
        ],
        "hospitals": [
            {
                "id": h.id,
                "name": h.name,
                "address": h.address,
                "departments": h.departments
            }
            for h in hospitals
        ]
    }
