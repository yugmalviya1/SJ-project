"""
MedSecure AI: Shared Backend Dependencies & Singletons
- Database Session generator
- Persistent Ledger instance
- Authorization-Scoped RAG engine instance
"""

import os
from pathlib import Path
from typing import Generator
from sqlalchemy.orm import Session

from database.models import SessionLocal, Patient, Encounter, Diagnosis, Medication, LabResult, Document
from blockchain.ledger import MedicalLedger
from rag.engine import ScopedMedicalRAG

LEDGER_PATH = str(Path(__file__).resolve().parent.parent / "database" / "ledger_chain.json")

# Singleton ledger with file persistence
ledger_instance = MedicalLedger(storage_path=LEDGER_PATH)

# Singleton RAG engine
rag_instance = ScopedMedicalRAG()

def init_rag_knowledge(db: Session):
    """Initializes the RAG engine with existing approved documents and patient summaries."""
    try:
        rag_instance.knowledge_store = []
        patients = db.query(Patient).all()
        for p in patients:
            for enc in p.encounters:
                diag_strs = [f"{d.code} - {d.description}" for d in enc.diagnoses]
                med_strs = [f"{m.name} {m.dosage} {m.frequency}" for m in enc.medications]
                lab_strs = [f"{l.test_name}: {l.value} {l.unit}" for l in enc.lab_results]
                enc_summary = (
                    f"Patient {p.full_name} (MRN: {p.mrn}, Age: {p.age}, Gender: {p.gender}). "
                    f"Encounter on {enc.encounter_date} ({enc.encounter_type}): {enc.notes or ''}. "
                    f"Diagnoses: {', '.join(diag_strs)}. "
                    f"Medications prescribed: {', '.join(med_strs)}. "
                    f"Lab observations: {', '.join(lab_strs)}."
                )
                rag_instance.index_document(
                    patient_mrn=p.mrn,
                    document_id=f"ENC-{enc.id}",
                    text=enc_summary,
                    metadata={"encounter_id": enc.id, "patient_name": p.full_name}
                )

        # Also index any approved documents
        docs = db.query(Document).filter(Document.extraction_status == "APPROVED").all()
        for doc in docs:
            if doc.extracted_data and isinstance(doc.extracted_data, dict):
                findings = doc.extracted_data.get("clinical_findings", "")
                diag_list = [d.get("description", "") for d in doc.extracted_data.get("diagnoses", [])]
                med_list = [m.get("name", "") + " " + m.get("dosage", "") for m in doc.extracted_data.get("medications", [])]
                doc_text = f"Report Type: {doc.document_type}. Clinical Findings: {findings}. Diagnoses: {', '.join(diag_list)}. Medications: {', '.join(med_list)}"
                rag_instance.index_document(
                    patient_mrn=doc.patient_mrn,
                    document_id=doc.id,
                    text=doc_text,
                    metadata={"filename": doc.filename, "document_type": doc.document_type}
                )
    except Exception as e:
        print(f"[RAG Init Warning] Could not preload RAG knowledge: {e}")

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_ledger() -> MedicalLedger:
    return ledger_instance

def get_rag() -> ScopedMedicalRAG:
    return rag_instance
