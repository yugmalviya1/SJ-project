"""
MedSecure AI: Security & RBAC Unit Tests (M4)
Validates:
- Password hashing & verification with bcrypt
- Field-level AES-256 Fernet encryption and decryption
- JWT access token generation and validation
- Strict RBAC scoping (Patient isolated to own MRN; Doctor/Admin authorized)
"""

import pytest
from fastapi import HTTPException
from security.auth import (
    hash_password, verify_password, encrypt_phi, decrypt_phi,
    create_access_token, decode_access_token, RBACEnforcer
)

def test_password_hashing():
    pw = "SuperSecureClinicalPass!2026"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_field_level_phi_encryption():
    raw_phi = "Confidential Diagnosis: HIV-1 positive; SSN: 000-12-3456"
    encrypted = encrypt_phi(raw_phi)
    assert encrypted != raw_phi
    decrypted = decrypt_phi(encrypted)
    assert decrypted == raw_phi

def test_jwt_token_lifecycle():
    user_payload = {
        "sub": "USR-TEST-01",
        "username": "dr_test",
        "role": "Doctor",
        "patient_mrn": None
    }
    token = create_access_token(user_payload)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "USR-TEST-01"
    assert decoded["role"] == "Doctor"
    assert "exp" in decoded

def test_rbac_patient_scoping():
    patient_user = {
        "sub": "USR-PAT-1",
        "role": "Patient",
        "patient_mrn": "MRN-1002"
    }

    # Allowed: Patient accessing own record
    RBACEnforcer.verify_role_and_scope(patient_user, ["Patient", "Doctor"], target_mrn="MRN-1002")

    # Forbidden: Patient attempting to access another patient's record (MRN-9999)
    with pytest.raises(HTTPException) as exc_info:
        RBACEnforcer.verify_role_and_scope(patient_user, ["Patient", "Doctor"], target_mrn="MRN-9999")
    assert exc_info.value.status_code == 403

def test_rbac_role_enforcement():
    auditor_user = {
        "sub": "USR-AUD-1",
        "role": "Auditor"
    }

    # Forbidden: Auditor attempting clinical write/upload
    with pytest.raises(HTTPException) as exc_info:
        RBACEnforcer.verify_role_and_scope(auditor_user, ["Doctor", "HospitalAdmin"])
    assert exc_info.value.status_code == 403
