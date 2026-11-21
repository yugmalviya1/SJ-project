"""
MedSecure AI: Authentication & Identity Router (M4 Extended)
Handles:
- User login with bcrypt verification & JWT issuance
- Current profile lookup
- Role-based user administration
- One-click demo role switcher for live evaluation (including Doctor DR-1001, Police Emergency, etc.)
- Prototype Mock National ID Verification & Face Biometric Verification endpoints
"""

import os
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.models import User, AuditLog, Patient, Doctor, Hospital
from backend.deps import get_db
from security.auth import (
    verify_password, hash_password, create_access_token, get_current_user, RBACEnforcer
)
from security.identity_service import IdentityVerificationService

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class SwitchDemoRequest(BaseModel):
    role: str  # Doctor, Patient, HospitalAdmin, Auditor, PoliceEmergency

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    patient_mrn: Optional[str] = None
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None

class VerifyIdentityRequest(BaseModel):
    national_id: str
    full_name: str
    dob_year: Optional[int] = None

class FaceVerificationRequest(BaseModel):
    face_image_base64: Optional[str] = None

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        audit = AuditLog(
            user_id=req.username,
            action="AUTH_LOGIN_FAILED",
            status="DENIED",
            details={"reason": "Invalid credentials"}
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Generate token with full RBAC claims
    token_payload = {
        "sub": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "patient_mrn": user.patient_mrn,
        "doctor_id": user.doctor_id,
        "hospital_id": user.hospital_id
    }
    access_token = create_access_token(token_payload)

    audit = AuditLog(
        user_id=user.id,
        action="AUTH_LOGIN_SUCCESS",
        status="SUCCESS",
        details={
            "role": user.role,
            "patient_mrn": user.patient_mrn,
            "doctor_id": user.doctor_id,
            "hospital_id": user.hospital_id
        }
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "patient_mrn": user.patient_mrn,
            "doctor_id": user.doctor_id,
            "hospital_id": user.hospital_id
        }
    }

@router.get("/me")
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    
    doctor_info = None
    if user.doctor_id:
        doc = db.query(Doctor).filter(Doctor.id == user.doctor_id).first()
        if doc:
            doctor_info = {
                "professional_id": doc.id,
                "specialization": doc.specialization,
                "qualifications": doc.qualifications,
                "registration_no": doc.registration_no,
                "departments": doc.departments,
                "hospitals": [
                    {
                        "hospital_id": h.hospital_id,
                        "hospital_name": h.hospital.name if h.hospital else "",
                        "department": h.department,
                        "role": h.role_designation
                    }
                    for h in doc.hospital_affiliations
                ]
            }

    hospital_info = None
    if user.hospital_id:
        hosp = db.query(Hospital).filter(Hospital.id == user.hospital_id).first()
        if hosp:
            hospital_info = {
                "hospital_id": hosp.id,
                "name": hosp.name,
                "address": hosp.address,
                "departments": hosp.departments
            }

    patient_info = None
    if user.patient_mrn:
        pat = db.query(Patient).filter(Patient.mrn == user.patient_mrn).first()
        if pat:
            patient_info = {
                "mrn": pat.mrn,
                "global_id": pat.global_id,
                "full_name": pat.full_name,
                "blood_group": pat.blood_group,
                "identity_verified": pat.identity_verified,
                "identity_provider": pat.identity_provider
            }

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "patient_mrn": user.patient_mrn,
        "doctor_id": user.doctor_id,
        "hospital_id": user.hospital_id,
        "doctor_profile": doctor_info,
        "hospital_profile": hospital_info,
        "patient_profile": patient_info,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.post("/switch-demo")
def switch_demo_role(req: SwitchDemoRequest, db: Session = Depends(get_db)):
    """Convenience endpoint to instantly switch active demo persona for UI evaluation."""
    role_map = {
        "Doctor": "dr_smith",
        "Patient": "pat_rahul",
        "HospitalAdmin": "admin_sarah",
        "Auditor": "auditor_alex",
        "PoliceEmergency": "officer_kumar"
    }
    target_username = role_map.get(req.role)
    if not target_username:
        raise HTTPException(status_code=400, detail=f"Unknown demo role '{req.role}'")

    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Demo user for role '{req.role}' not found")

    token_payload = {
        "sub": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "patient_mrn": user.patient_mrn,
        "doctor_id": user.doctor_id,
        "hospital_id": user.hospital_id
    }
    access_token = create_access_token(token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "patient_mrn": user.patient_mrn,
            "doctor_id": user.doctor_id,
            "hospital_id": user.hospital_id
        }
    }

@router.post("/verify-identity")
def verify_identity(req: VerifyIdentityRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Prototype Identity Verification (Mock Aadhaar / National ID validation)."""
    result = IdentityVerificationService.verify_mock_national_id(
        national_id_number=req.national_id,
        full_name=req.full_name,
        dob_year=req.dob_year
    )
    return result

@router.post("/verify-face")
def verify_face(req: FaceVerificationRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Prototype Biometric Face Security check."""
    result = IdentityVerificationService.verify_face_biometric(
        user_id=current_user["sub"],
        face_image_base64=req.face_image_base64
    )
    return result

@router.get("/users")
def list_users(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    RBACEnforcer.verify_role_and_scope(current_user, ["HospitalAdmin"])
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "patient_mrn": u.patient_mrn,
            "doctor_id": u.doctor_id,
            "hospital_id": u.hospital_id,
            "is_active": u.is_active
        }
        for u in users
    ]
