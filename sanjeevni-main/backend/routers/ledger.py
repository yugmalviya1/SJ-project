"""
MedSecure AI: Cryptographic Ledger & Tamper-Evident Integrity Router (M5)
Handles:
- Immutable audit block queries
- Chain cryptographic continuity verification
- Real-time record state verification vs. cryptographic ledger anchor
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.models import Patient, AuditLog
from backend.deps import get_db, get_ledger
from security.auth import get_current_user, RBACEnforcer
from blockchain.ledger import MedicalLedger

router = APIRouter()

@router.get("/blocks")
def get_ledger_blocks(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ledger: MedicalLedger = Depends(get_ledger)
):
    """Returns the full tamper-evident audit ledger chain."""
    RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin", "Auditor", "Patient"])
    
    role = current_user.get("role")
    if role == "Patient":
        mrn = current_user.get("patient_mrn")
        # Patient only sees blocks anchoring their own MRN and Genesis
        blocks = [b.to_dict() for b in ledger.chain if b.record_id in [mrn, "GENESIS"]]
    else:
        blocks = [b.to_dict() for b in ledger.chain]

    return {
        "chain_length": len(blocks),
        "total_blocks": len(ledger.chain),
        "blocks": blocks
    }

@router.get("/verify-chain")
def verify_ledger_chain(
    current_user: Dict[str, Any] = Depends(get_current_user),
    ledger: MedicalLedger = Depends(get_ledger)
):
    """Validates the internal cryptographic hash continuity of the entire ledger chain."""
    RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin", "Auditor", "Patient", "PoliceEmergency", "PoliceAccidentOnly"])

    is_valid = ledger.verify_chain_integrity()
    return {
        "chain_integrity_valid": is_valid,
        "total_blocks": len(ledger.chain),
        "genesis_hash": ledger.chain[0].block_hash if ledger.chain else None,
        "latest_block_hash": ledger.chain[-1].block_hash if ledger.chain else None,
        "status": "CHAIN_CRYPTOGRAPHICALLY_SOUND" if is_valid else "CORRUPTED_CHAIN"
    }

@router.get("/verify-record/{mrn}")
def verify_record_integrity(
    mrn: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
    ledger: MedicalLedger = Depends(get_ledger)
):
    """
    Checks live database state of patient EHR against the immutable ledger anchor.
    Immediately detects any unauthorized out-of-band record tampering!
    """
    RBACEnforcer.verify_role_and_scope(current_user, ["Doctor", "HospitalAdmin", "Auditor", "Patient"], target_mrn=mrn)

    patient = db.query(Patient).filter(Patient.mrn == mrn).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{mrn}' not found.")

    # Reconstruct live canonical representation for comparison against anchor
    # Check if there is an anchored block for this MRN
    matching_blocks = [b for b in ledger.chain if b.record_id == mrn]
    if not matching_blocks:
        return {
            "status": "NOT_ANCHORED",
            "verified": False,
            "mrn": mrn,
            "message": "No ledger anchor exists for this patient record yet."
        }

    latest_block = matching_blocks[-1]
    version = latest_block.version

    # Construct current DB data matching the anchored structure
    if version == 1:
        # Initial seeded structure
        diag_list = []
        med_list = []
        hba1c_val = None
        tsh_val = None
        trop_val = None

        for enc in patient.encounters:
            for d in enc.diagnoses:
                diag_list.append(f"{d.code}: {d.description}")
            for m in enc.medications:
                med_list.append(f"{m.name} {m.dosage}")
            for l in enc.lab_results:
                if "HbA1c" in l.test_name:
                    hba1c_val = l.value
                elif "TSH" in l.test_name:
                    tsh_val = l.value
                elif "Troponin" in l.test_name:
                    trop_val = l.value

        current_db_data: Dict[str, Any] = {
            "mrn": patient.mrn,
            "full_name": patient.full_name,
            "diagnoses": diag_list,
            "medications": med_list,
        }
        if hba1c_val is not None:
            current_db_data["latest_hba1c"] = hba1c_val
        if tsh_val is not None:
            current_db_data["latest_tsh"] = tsh_val
        if trop_val is not None:
            current_db_data["latest_troponin"] = trop_val

    else:
        # Version 2+ approved extraction structure
        latest_enc = patient.encounters[-1] if patient.encounters else None
        current_db_data = {
            "mrn": patient.mrn,
            "encounter_id": latest_enc.id if latest_enc else "",
            "document_id": patient.documents[-1].id if patient.documents else "",
            "approved_by": patient.documents[-1].approved_by if patient.documents else "",
            "diagnoses": [d.description for d in latest_enc.diagnoses] if latest_enc else [],
            "medications": [f"{m.name} {m.dosage}" for m in latest_enc.medications] if latest_enc else [],
            "lab_results": [{l.test_name: l.value} for l in latest_enc.lab_results] if latest_enc else [],
            "clinical_findings": latest_enc.notes if latest_enc else ""
        }

    verification = ledger.verify_record_integrity(record_id=mrn, current_record_data=current_db_data)

    # Log audit
    audit = AuditLog(
        user_id=current_user["sub"],
        action="INTEGRITY_VERIFICATION",
        patient_mrn=mrn,
        resource_id=mrn,
        status="SUCCESS" if verification["verified"] else "TAMPER_DETECTED",
        details={
            "status": verification["status"],
            "verified": verification["verified"],
            "block_index": latest_block.index
        }
    )
    db.add(audit)
    db.commit()

    return {
        "mrn": mrn,
        "verification": verification,
        "anchored_block": latest_block.to_dict(),
        "evaluated_db_snapshot": current_db_data
    }
