"""
MedSecure AI: End-to-End API Integration Tests (M7 & M8)
Validates:
- Health check
- Authentication (login & JWT issuance)
- Role switcher endpoint
- Scoped Patient listing and record retrieval
- AI clinical entity extraction & physician approval
- Blockchain ledger blocks retrieval & integrity verification
- Simulated database tampering and instant tamper detection
- Authorization-scoped RAG clinical query
- Immutable audit log query
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module", autouse=True)
def setup_test_environment():
    from backend.deps import SessionLocal, init_rag_knowledge
    from database.seed_data import seed
    db = SessionLocal()
    seed()
    init_rag_knowledge(db)
    db.close()

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login_and_me():
    # Login as doctor
    res = client.post("/api/auth/login", json={"username": "dr_smith", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Doctor"

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Profile lookup
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "dr_smith"

def test_patients_rbac_scoping():
    # 1. Doctor token
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    doc_headers = {"Authorization": f"Bearer {doc_res.json()['access_token']}"}

    # Doctor sees multiple patients
    patients_res = client.get("/api/patients", headers=doc_headers)
    assert patients_res.status_code == 200
    assert len(patients_res.json()) >= 3

    # 2. Patient token (Rahul Sharma, MRN-1002)
    pat_res = client.post("/api/auth/switch-demo", json={"role": "Patient"})
    pat_headers = {"Authorization": f"Bearer {pat_res.json()['access_token']}"}

    # Patient only sees their own MRN in the list
    pat_list = client.get("/api/patients", headers=pat_headers).json()
    assert len(pat_list) == 1
    assert pat_list[0]["mrn"] == "MRN-1002"

    # Patient accessing own record succeeds
    res_own = client.get("/api/patients/MRN-1002", headers=pat_headers)
    assert res_own.status_code == 200
    assert res_own.json()["full_name"] == "Rahul Sharma"

    # Patient attempting to access Priya Patel (MRN-2004) is strictly forbidden (403)
    res_unauth = client.get("/api/patients/MRN-2004", headers=pat_headers)
    assert res_unauth.status_code == 403

def test_blockchain_ledger_and_tamper_detection():
    # Doctor headers
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    headers = {"Authorization": f"Bearer {doc_res.json()['access_token']}"}

    # 1. Check ledger blocks
    blocks_res = client.get("/api/ledger/blocks", headers=headers)
    assert blocks_res.status_code == 200
    assert blocks_res.json()["chain_length"] >= 3

    # 2. Verify clean record (MRN-1002)
    clean_verif = client.get("/api/ledger/verify-record/MRN-1002", headers=headers)
    assert clean_verif.status_code == 200
    assert clean_verif.json()["verification"]["status"] == "VERIFIED"

    # 3. Simulate database tampering attack on MRN-1002
    tamper_res = client.post("/api/patients/MRN-1002/tamper", json={
        "field_to_tamper": "diagnosis",
        "tampered_value": "Malignant Neoplasm [UNAUTHORIZED_SQL_MODIFICATION]"
    }, headers=headers)
    assert tamper_res.status_code == 200

    # 4. Immediate verify triggers TAMPER_DETECTED!
    tamper_verif = client.get("/api/ledger/verify-record/MRN-1002", headers=headers)
    assert tamper_verif.status_code == 200
    assert tamper_verif.json()["verification"]["status"] == "TAMPER_DETECTED"
    assert tamper_verif.json()["verification"]["verified"] is False

    # 5. Restore record to canonical state
    restore_res = client.post("/api/patients/MRN-1002/restore", headers=headers)
    assert restore_res.status_code == 200

    # 6. Verify record is restored and valid again
    restored_verif = client.get("/api/ledger/verify-record/MRN-1002", headers=headers)
    assert restored_verif.status_code == 200
    assert restored_verif.json()["verification"]["status"] == "VERIFIED"

def test_ai_extraction_workflow():
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    headers = {"Authorization": f"Bearer {doc_res.json()['access_token']}"}

    clinical_note = """
    Patient: Vikram Malhotra    Age: 58    Gender: Male    MRN: MRN-3008
    DISCHARGE SUMMARY:
    Primary Diagnosis: Acute myocardial infarction, unspecified
    Medications: Aspirin 81 mg daily, Atorvastatin 40 mg nightly
    Clinical Findings: Patient stabilized post angioplasty. Troponin was recorded at 0.45 ng/mL (Ref: 0.00 - 0.04)
    """

    res = client.post("/api/ai/extract", json={"raw_text": clinical_note}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "DRAFT_PENDING_REVIEW"
    assert data["extraction"]["patient_info"]["name"] == "Vikram Malhotra"

def test_scoped_rag_query():
    # Doctor query
    doc_res = client.post("/api/auth/switch-demo", json={"role": "Doctor"})
    headers = {"Authorization": f"Bearer {doc_res.json()['access_token']}"}

    rag_res = client.post("/api/rag/query", json={
        "query": "What medications are prescribed for diabetes?",
        "target_mrn": "MRN-1002"
    }, headers=headers)
    assert rag_res.status_code == 200
    assert "Metformin" in rag_res.json()["answer"]

def test_audit_logs():
    auditor_res = client.post("/api/auth/switch-demo", json={"role": "Auditor"})
    headers = {"Authorization": f"Bearer {auditor_res.json()['access_token']}"}

    audit_res = client.get("/api/audit/logs", headers=headers)
    assert audit_res.status_code == 200
    assert audit_res.json()["total_records"] > 0
