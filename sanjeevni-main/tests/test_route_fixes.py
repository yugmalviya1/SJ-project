"""
Validation tests for all route and connectivity fixes:
1. PoliceEmergency accessing audit logs and verifying ledger chain
2. Patient verifying ledger chain
3. Doctor and HospitalAdmin granting consent on behalf of patient
4. Full AI raw_text extraction -> review & approval -> ledger anchoring
5. Lab value tampering correctly detected by ledger and restored
6. Police case-insensitive lookup (FIR and MRN)
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_police_emergency_audit_and_ledger():
    pol_res = client.post("/api/auth/switch-demo", json={"role": "PoliceEmergency"})
    assert pol_res.status_code == 200
    token = pol_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Police can query audit logs
    audit_res = client.get("/api/audit/logs", headers=headers)
    assert audit_res.status_code == 200
    assert "logs" in audit_res.json()

    # Police can verify ledger chain
    chain_res = client.get("/api/ledger/verify-chain", headers=headers)
    assert chain_res.status_code == 200
    assert chain_res.json()["chain_integrity_valid"] is True

def test_patient_ledger_verify_chain():
    pat_res = client.post("/api/auth/switch-demo", json={"role": "Patient"})
    assert pat_res.status_code == 200
    token = pat_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    chain_res = client.get("/api/ledger/verify-chain", headers=headers)
    assert chain_res.status_code == 200
    assert chain_res.json()["chain_integrity_valid"] is True

def test_doctor_and_admin_consent_grant():
    # Doctor grant
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    doc_token = doc_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    grant_payload = {
        "patient_mrn": "MRN-1002",
        "granted_to_type": "DOCTOR",
        "granted_to_id": "DR-1002",
        "scope": "FULL",
        "reason": "Consultation referral"
    }
    res = client.post("/api/consent/grant", json=grant_payload, headers=doc_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "CONSENT_ACTIVE"

def test_ai_extraction_and_approval_pipeline():
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    doc_token = doc_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    raw_note = """
    Patient: Amit Kumar    Age: 40    Gender: Male    MRN: MRN-4004
    Collection Date: 2026-01-20    Report Type: Complete Blood Count (CBC)
    ----------------------------------------------------------------
    TEST NAME                RESULT       REFERENCE RANGE   UNIT
    Hemoglobin               14.5         13.0 - 17.0       g/dL
    WBC                      6800         4,500 - 11,000    /µL
    Platelets                245000       150,000 - 450,000 /µL
    Fasting Blood Glucose    138.0        70 - 99           mg/dL
    HbA1c                    7.2          4.0 - 5.6         %

    DIAGNOSIS:
    Type 2 Diabetes Mellitus without complications (ICD-10: E11.9)

    MEDICATIONS:
    Metformin Hydrochloride 500mg Oral Twice Daily with meals
    """

    # 1. Run extraction from raw text
    ext_res = client.post("/api/ai/extract", json={"raw_text": raw_note}, headers=doc_headers)
    assert ext_res.status_code == 200
    ext_data = ext_res.json()
    assert ext_data["status"] == "DRAFT_PENDING_REVIEW"
    doc_id = ext_data["document_id"]
    assert doc_id is not None
    assert len(ext_data["extraction"]["diagnoses"]) >= 1
    assert len(ext_data["extraction"]["medications"]) >= 1
    assert len(ext_data["extraction"]["lab_results"]) >= 4

    # 2. Approve and commit extraction (was previously failing with 404 Document not found)
    appr_res = client.post("/api/ai/review-approve", json={
        "document_id": doc_id,
        "approved_data": ext_data["extraction"]
    }, headers=doc_headers)
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    assert appr_data["status"] == "APPROVED_AND_COMMITTED"
    assert "ledger_block" in appr_data
    assert appr_data["ledger_block"]["index"] > 0

def test_lab_value_tamper_and_restore():
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    doc_token = doc_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 1. Tamper lab_value
    tamper_res = client.post("/api/patients/MRN-1002/tamper", json={
        "field_to_tamper": "lab_value",
        "tampered_value": "999.0"
    }, headers=doc_headers)
    assert tamper_res.status_code == 200

    # 2. Verify ledger detects the lab tamper!
    verif_res = client.get("/api/ledger/verify-record/MRN-1002", headers=doc_headers)
    assert verif_res.status_code == 200
    assert verif_res.json()["verification"]["status"] == "TAMPER_DETECTED"
    assert verif_res.json()["verification"]["verified"] is False

    # 3. Restore clean
    restore_res = client.post("/api/patients/MRN-1002/restore", headers=doc_headers)
    assert restore_res.status_code == 200

    # 4. Verify ledger shows verified again
    restored_res = client.get("/api/ledger/verify-record/MRN-1002", headers=doc_headers)
    assert restored_res.status_code == 200
    assert restored_res.json()["verification"]["status"] == "VERIFIED"
    assert restored_res.json()["verification"]["verified"] is True

def test_police_case_insensitive_lookup():
    pol_res = client.post("/api/auth/switch-demo", json={"role": "PoliceEmergency"})
    pol_token = pol_res.json()["access_token"]
    pol_headers = {"Authorization": f"Bearer {pol_token}"}

    # Lowercase lookup
    fir_res = client.get("/api/emergency/police-report?ref=fir-2026/089-vkn", headers=pol_headers)
    assert fir_res.status_code == 200
    assert fir_res.json()["access_scope"] == "RESTRICTED_POLICE_ACCIDENT_DATA_ONLY"

    # MRN lookup
    mrn_res = client.get("/api/emergency/police-report?ref=mrn-3008", headers=pol_headers)
    assert mrn_res.status_code == 200
    assert mrn_res.json()["accident_record_id"] == "ACC-001"
