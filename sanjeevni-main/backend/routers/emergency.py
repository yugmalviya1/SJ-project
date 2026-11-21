"""
MedSecure AI: Emergency & Accident Router
Handles:
- Emergency Break-Glass access authorization
- Accident record lookup
- Police legally-restricted incident view (STRICTLY NO UNRELATED MEDICAL HISTORY)
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os

from database.models import AccidentRecord, EmergencyAccessLog, Patient, AuditLog
from backend.deps import get_db
from security.auth import get_current_user, RBACEnforcer

router = APIRouter()

class BreakGlassRequest(BaseModel):
    patient_mrn: str
    reason: str
    hospital_id: Optional[str] = "HOSP-002"

@router.post("/break-glass")
def trigger_break_glass(req: BreakGlassRequest, current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Emergency Break-Glass Procedure:
    Allows an authorized emergency physician to bypass standard consent for critical unconscious/trauma admissions.
    Logs high-priority security audit event immediately.
    """
    RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin"])

    patient = db.query(Patient).filter(Patient.mrn == req.patient_mrn).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    log_id = f"BRK-{os.urandom(3).hex().upper()}"
    emergency_log = EmergencyAccessLog(
        id=log_id,
        doctor_id=current_user.get("doctor_id") or current_user["sub"],
        doctor_name=current_user.get("full_name") or "Emergency Attending",
        hospital_id=req.hospital_id,
        patient_mrn=req.patient_mrn,
        reason=req.reason,
        access_scope="ACCIDENT_EMERGENCY_ONLY",
        status="AUTHORIZED_BREAK_GLASS"
    )
    db.add(emergency_log)

    # High-priority audit trail
    audit = AuditLog(
        user_id=current_user["sub"],
        action="EMERGENCY_ACCESS",
        patient_mrn=req.patient_mrn,
        hospital_id=req.hospital_id,
        resource_id=log_id,
        status="AUTHORIZED_BREAK_GLASS",
        details={
            "break_glass_id": log_id,
            "doctor": emergency_log.doctor_name,
            "reason": req.reason,
            "scope": "ACCIDENT_EMERGENCY_ONLY"
        }
    )
    db.add(audit)
    db.commit()

    # Retrieve critical accident record
    accidents = db.query(AccidentRecord).filter(AccidentRecord.patient_mrn == req.patient_mrn).all()

    return {
        "status": "EMERGENCY_ACCESS_GRANTED",
        "emergency_id": log_id,
        "patient": {
            "mrn": patient.mrn,
            "global_id": patient.global_id,
            "full_name": patient.full_name,
            "blood_group": patient.blood_group,
            "age": patient.age,
            "gender": patient.gender,
            "emergency_contact": patient.emergency_contact
        },
        "accident_records": [
            {
                "id": a.id,
                "accident_type": a.accident_type,
                "accident_time": a.accident_time,
                "location": a.location,
                "police_report_ref": a.police_report_ref,
                "injury_details": a.injury_details,
                "bleeding_status": a.bleeding_status,
                "emergency_observations": a.emergency_observations,
                "treatment_administered": a.treatment_administered,
                "imaging_findings": a.imaging_findings,
                "discharge_status": a.discharge_status
            }
            for a in accidents
        ],
        "warning": "CRITICAL: Emergency break-glass access is actively monitored and flagged in compliance audit logs."
    }

@router.get("/police-report")
@router.get("/police-report/{fir_or_mrn:path}")
def get_police_accident_view(
    fir_or_mrn: Optional[str] = None,
    ref: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_ref = (ref or fir_or_mrn or "").strip()
    """
    Legally bounded Police Access:
    Police officials or investigating authorities can ONLY access accident incident and FIR data.
    All unrelated diagnoses, past medical history, and psychiatric/chronic records are strictly blocked.
    """
    role = current_user.get("role")
    if role not in ["PoliceEmergency", "Doctor", "HospitalAdmin", "Auditor"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to police report interface.")

    # Query accident record by FIR or MRN (case-insensitive for robust UI queries)
    record = db.query(AccidentRecord).filter(
        (AccidentRecord.police_report_ref.ilike(target_ref)) |
        (AccidentRecord.patient_mrn.ilike(target_ref)) |
        (AccidentRecord.id.ilike(target_ref))
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail=f"No accident record found for reference '{target_ref}'.")

    # Audit police view
    audit = AuditLog(
        user_id=current_user["sub"],
        action="POLICE_ACCIDENT_VIEW",
        patient_mrn=record.patient_mrn,
        resource_id=record.id,
        status="SUCCESS",
        details={
            "police_ref": record.police_report_ref,
            "police_officer": current_user.get("full_name", "Investigating Officer")
        }
    )
    db.add(audit)
    db.commit()

    return {
        "access_scope": "RESTRICTED_POLICE_ACCIDENT_DATA_ONLY",
        "accident_record_id": record.id,
        "patient_identification": {
            "name": record.patient.full_name if record.patient else "De-identified",
            "gender": record.patient.gender if record.patient else "",
            "age": record.patient.age if record.patient else None,
            "blood_group": record.patient.blood_group if record.patient else ""
        },
        "incident_details": {
            "police_report_ref": record.police_report_ref,
            "police_station": record.police_station,
            "investigating_officer": record.investigating_officer,
            "accident_type": record.accident_type,
            "accident_time": record.accident_time,
            "location": record.location,
            "injury_details": record.injury_details,
            "bleeding_status": record.bleeding_status,
            "imaging_findings": record.imaging_findings,
            "clinical_status": record.discharge_status
        },
        "blocked_private_records": {
            "past_medical_history": "BLOCKED (Legally Protected PHI)",
            "routine_prescriptions": "BLOCKED (Legally Protected PHI)",
            "personal_lifestyle_notes": "BLOCKED (Legally Protected PHI)"
        }
    }
