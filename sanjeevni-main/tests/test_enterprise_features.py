"""
Tests for MedSecure Enterprise Features:
- Case Sheets (Draft & Finalization into versioned ledger records)
- Consent & Data Sharing Grants
- Emergency Break-Glass Procedure
- Police Accidental View Scoping
- Prototype Identity & Face Biometrics Verification
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_consent_and_sharing_lifecycle():
    # 1. Patient logs in
    pat_res = client.post("/api/auth/switch-demo", json={"role": "Patient"})
    assert pat_res.status_code == 200
    pat_token = pat_res.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    # 2. View my grants
    grants_res = client.get("/api/consent/my-grants", headers=pat_headers)
    assert grants_res.status_code == 200
    assert len(grants_res.json()) >= 1

    # 3. Grant access to hospital
    grant_payload = {
        "patient_mrn": "MRN-1002",
        "granted_to_type": "HOSPITAL",
        "granted_to_id": "HOSP-002",
        "scope": "FULL",
        "reason": "Referral consultation to AIIMS Trauma Center"
    }
    grant_create = client.post("/api/consent/grant", json=grant_payload, headers=pat_headers)
    assert grant_create.status_code == 200
    assert grant_create.json()["status"] == "CONSENT_ACTIVE"

def test_clinical_case_sheet_lifecycle():
    # 1. Doctor logs in
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    doc_token = doc_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 2. Save Draft Case Sheet
    draft_payload = {
        "patient_mrn": "MRN-1002",
        "doctor_id": "DR-1001",
        "status": "DRAFT",
        "chief_complaint": "Polyuria and polydipsia for 2 weeks",
        "vitals": {"blood_pressure": "130/80 mmHg", "heart_rate": "72 bpm"},
        "provisional_diagnosis": "Type 2 Diabetes Mellitus"
    }
    draft_res = client.post("/api/case-sheets", json=draft_payload, headers=doc_headers)
    assert draft_res.status_code == 200
    assert draft_res.json()["sheet_status"] == "DRAFT"

    # 3. Finalize Case Sheet (Triggers RecordVersion and Ledger block anchoring)
    finalize_payload = {
        "patient_mrn": "MRN-1002",
        "doctor_id": "DR-1001",
        "status": "FINALIZED",
        "chief_complaint": "Polyuria and polydipsia confirmed secondary to impaired glycemic control",
        "vitals": {"blood_pressure": "130/80 mmHg", "heart_rate": "72 bpm"},
        "provisional_diagnosis": "Type 2 Diabetes Mellitus without complications",
        "treatment_plan": "Continue Metformin 500mg BID with meals"
    }
    fin_res = client.post("/api/case-sheets", json=finalize_payload, headers=doc_headers)
    assert fin_res.status_code == 200
    assert fin_res.json()["sheet_status"] == "FINALIZED"
    assert fin_res.json()["version_info"]["canonical_hash"] is not None

def test_emergency_break_glass_and_police_scoping():
    # 1. Doctor triggers Break-Glass for unconscious trauma patient (Vikram Malhotra, MRN-3008)
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    doc_headers = {"Authorization": f"Bearer {doc_res.json()['access_token']}"}

    bg_payload = {
        "patient_mrn": "MRN-3008",
        "reason": "Unresponsive driver from NH-48 collision. Immediate trauma resuscitation protocol."
    }
    bg_res = client.post("/api/emergency/break-glass", json=bg_payload, headers=doc_headers)
    assert bg_res.status_code == 200
    assert bg_res.json()["status"] == "EMERGENCY_ACCESS_GRANTED"
    assert len(bg_res.json()["accident_records"]) >= 1

    # 2. Police accesses restricted incident view via FIR
    pol_res = client.post("/api/auth/switch-demo", json={"role": "PoliceEmergency"})
    pol_headers = {"Authorization": f"Bearer {pol_res.json()['access_token']}"}

    fir_res = client.get("/api/emergency/police-report/FIR-2026/089-VKN", headers=pol_headers)
    assert fir_res.status_code == 200
    fir_data = fir_res.json()
    assert fir_data["access_scope"] == "RESTRICTED_POLICE_ACCIDENT_DATA_ONLY"
    assert "FIR-2026/089-VKN" in fir_data["incident_details"]["police_report_ref"]
    # Verifies unrelated medical history is legally blocked
    assert "BLOCKED" in fir_data["blocked_private_records"]["past_medical_history"]

def test_identity_and_face_verification():
    pat_res = client.post("/api/auth/switch-demo", json={"role": "Patient"})
    pat_headers = {"Authorization": f"Bearer {pat_res.json()['access_token']}"}

    # National ID verification check
    id_res = client.post("/api/auth/verify-identity", json={"national_id": "555544443333", "full_name": "Rahul Sharma"}, headers=pat_headers)
    assert id_res.status_code == 200
    assert id_res.json()["verified"] is True
    assert id_res.json()["verification_token"].startswith("ID-VERIFIED")

    # Face verification check
    face_res = client.post("/api/auth/verify-face", json={"face_image_base64": "data:image/jpeg;base64,samplephoto123"}, headers=pat_headers)
    assert face_res.status_code == 200
    assert face_res.json()["status"] == "FACE_VERIFICATION_SUCCESS"
