"""
MedSecure AI: Authorization-Scoped RAG Engine Tests (M6)
Validates:
- Document indexing and chunking
- Dense semantic vector retrieval
- Strict authorization filtering preventing cross-patient data leakage
"""

from rag.engine import ScopedMedicalRAG

def test_rag_semantic_retrieval_and_cross_patient_isolation():
    rag = ScopedMedicalRAG()

    # Index Patient A record
    rag.index_document(
        patient_mrn="MRN-101",
        document_id="DOC-101",
        text="Patient diagnosed with Chronic Kidney Disease Stage 3. Prescribed Enalapril 5mg."
    )

    # Index Patient B record
    rag.index_document(
        patient_mrn="MRN-202",
        document_id="DOC-202",
        text="Patient diagnosed with Acute Bronchitis. Prescribed Azithromycin 500mg."
    )

    # 1. Authorized query on Patient A retrieves Patient A's information
    res_a = rag.query("What is the kidney disease prescription?", authorized_mrns=["MRN-101"])
    assert len(res_a["citations"]) > 0
    assert res_a["citations"][0]["patient_mrn"] == "MRN-101"
    assert "Enalapril" in res_a["citations"][0]["snippet"]

    # 2. Strict Security Check: Caller authorized ONLY for Patient A queries for Bronchitis (Patient B's record)
    res_leak_attempt = rag.query("What antibiotic was given for bronchitis?", authorized_mrns=["MRN-101"])
    # MUST return 0 citations from Patient B!
    assert len(res_leak_attempt["citations"]) == 0
    assert "No authorized clinical documentation available" in res_leak_attempt["answer"]

    # 3. Caller authorized for Patient B retrieves Patient B's information
    res_b = rag.query("What antibiotic was given for bronchitis?", authorized_mrns=["MRN-202"])
    assert len(res_b["citations"]) > 0
    assert res_b["citations"][0]["patient_mrn"] == "MRN-202"
    assert "Azithromycin" in res_b["citations"][0]["snippet"]
