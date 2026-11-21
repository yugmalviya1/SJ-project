"""
MedSecure AI: Immutable Audit Trail & Compliance Router (M4/M7 Extended)
Provides complete visibility for Auditor and Compliance Officers:
- Access logs
- Consent lifecycle events
- Emergency break-glass event audits
- Suspicious activity and tampering flags
- Zero unnecessary clinical exposure (metadata only)
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.models import AuditLog, EmergencyAccessLog, ConsentGrant, RecordVersion
from backend.deps import get_db, get_ledger
from security.auth import get_current_user, RBACEnforcer

router = APIRouter()

@router.get("/logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = current_user.get("role")
    query = db.query(AuditLog)

    # Scoped visibility
    if role == "Patient":
        patient_mrn = current_user.get("patient_mrn")
        query = query.filter(AuditLog.patient_mrn == patient_mrn)
    elif role == "PoliceEmergency":
        query = query.filter(
            (AuditLog.user_id == current_user["sub"]) | 
            (AuditLog.action.in_(["POLICE_ACCIDENT_VIEW", "EMERGENCY_ACCESS"]))
        )
    elif role in ["Doctor", "HospitalAdmin", "Auditor"]:
        pass
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    total_count = query.count()
    denied_or_tamper = db.query(AuditLog).filter(
        AuditLog.status.in_(["DENIED", "TAMPER_DETECTED", "ERROR", "AUTHORIZED_BREAK_GLASS"])
    ).count()

    return {
        "total_records": total_count,
        "security_flags_count": denied_or_tamper,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "patient_mrn": log.patient_mrn,
                "hospital_id": log.hospital_id,
                "resource_id": log.resource_id,
                "status": log.status,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "details": log.details
            }
            for log in logs
        ]
    }

@router.get("/auditor-summary")
def get_auditor_compliance_summary(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dedicated Auditor & Government Compliance Overview:
    Summarizes metadata, emergency incidents, consent authorizations, and ledger integrity.
    Does NOT return raw clinical notes.
    """
    RBACEnforcer.verify_role_and_scope(current_user, ["Auditor", "HospitalAdmin"])

    ledger = get_ledger()
    chain_health = ledger.verify_chain_integrity()

    total_audits = db.query(AuditLog).count()
    emergency_events = db.query(EmergencyAccessLog).all()
    consent_events = db.query(ConsentGrant).all()
    record_versions = db.query(RecordVersion).all()
    
    suspicious_count = db.query(AuditLog).filter(
        AuditLog.status.in_(["DENIED", "TAMPER_DETECTED", "ERROR"])
    ).count()

    return {
        "auditor_role": current_user.get("role"),
        "compliance_environment": "MedSecure National Healthcare Node - DEMO/SYNTHETIC",
        "ledger_blocks_count": len(ledger.chain),
        "ledger_integrity": chain_health,
        "metrics": {
            "total_audit_events": total_audits,
            "emergency_break_glass_count": len(emergency_events),
            "active_consent_grants": sum(1 for c in consent_events if c.status == "ACTIVE"),
            "tracked_record_versions": len(record_versions),
            "suspicious_flags": suspicious_count
        },
        "emergency_incidents": [
            {
                "id": e.id,
                "doctor_id": e.doctor_id,
                "doctor_name": e.doctor_name,
                "hospital_id": e.hospital_id,
                "patient_mrn": e.patient_mrn,
                "reason": e.reason,
                "access_scope": e.access_scope,
                "status": e.status,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None
            }
            for e in emergency_events
        ],
        "consent_events": [
            {
                "id": c.id,
                "patient_mrn": c.patient_mrn,
                "granted_to_type": c.granted_to_type,
                "granted_to_id": c.granted_to_id,
                "granted_to_name": c.granted_to_name,
                "scope": c.scope,
                "status": c.status,
                "granted_at": c.granted_at.isoformat() if c.granted_at else None
            }
            for c in consent_events
        ],
        "record_versions": [
            {
                "id": v.id,
                "record_type": v.record_type,
                "record_id": v.record_id,
                "version_number": v.version_number,
                "canonical_hash": v.canonical_hash,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "change_summary": v.change_summary
            }
            for v in record_versions
        ]
    }
