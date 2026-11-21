"""
MedSecure AI: Document Upload & OCR Processing Router (M2)
Handles:
- Clinical document ingestion (PDF, text reports, lab scans)
- OCR preprocessing and structural boundary segmentation
- Storing extracted raw sections pending human-in-the-loop clinical review
"""

import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from database.models import Document, Patient, AuditLog
from backend.deps import get_db
from security.auth import get_current_user, RBACEnforcer
from ocr.processor import MedicalDocumentProcessor

router = APIRouter()
processor = MedicalDocumentProcessor()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_mrn: str = Form(...),
    document_type: str = Form("CBC"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    RBACEnforcer.verify_role_and_scope(current_user, ["Patient", "Doctor", "HospitalAdmin"], target_mrn=patient_mrn)

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.mrn == patient_mrn).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient MRN '{patient_mrn}' not registered.")

    # Save file
    file_id = f"DOC-{os.urandom(4).hex().upper()}"
    safe_filename = f"{file_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process through OCR and document processor
    try:
        proc_result = processor.process_file(str(file_path))
    except Exception as e:
        proc_result = {
            "file_name": file.filename,
            "raw_length": 0,
            "cleaned_text": f"Error parsing document: {e}",
            "sections": {}
        }

    # Store document record
    doc_record = Document(
        id=file_id,
        patient_mrn=patient_mrn,
        uploader_id=current_user["sub"],
        filename=file.filename,
        file_path=str(file_path),
        document_type=document_type,
        extraction_status="PENDING",
        extracted_data={
            "raw_text": proc_result.get("cleaned_text", ""),
            "sections": proc_result.get("sections", {}),
            "source_file": file.filename
        }
    )
    db.add(doc_record)

    # Log audit
    audit = AuditLog(
        user_id=current_user["sub"],
        action="DOCUMENT_UPLOAD",
        patient_mrn=patient_mrn,
        resource_id=file_id,
        status="SUCCESS",
        details={"filename": file.filename, "document_type": document_type}
    )
    db.add(audit)
    db.commit()
    db.refresh(doc_record)

    return {
        "id": doc_record.id,
        "patient_mrn": doc_record.patient_mrn,
        "filename": doc_record.filename,
        "document_type": doc_record.document_type,
        "extraction_status": doc_record.extraction_status,
        "parsed_sections": proc_result.get("sections", {}),
        "raw_text_preview": proc_result.get("cleaned_text", "")[:300]
    }

@router.get("")
def list_documents(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    role = current_user.get("role")
    if role == "Patient":
        patient_mrn = current_user.get("patient_mrn")
        docs = db.query(Document).filter(Document.patient_mrn == patient_mrn).all()
    else:
        docs = db.query(Document).all()

    return [
        {
            "id": d.id,
            "patient_mrn": d.patient_mrn,
            "filename": d.filename,
            "document_type": d.document_type,
            "extraction_status": d.extraction_status,
            "approved_by": d.approved_by,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
        }
        for d in docs
    ]

@router.get("/{doc_id}")
def get_document(doc_id: str, current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    RBACEnforcer.verify_role_and_scope(current_user, ["Patient", "Doctor", "HospitalAdmin", "Auditor"], target_mrn=doc.patient_mrn)

    return {
        "id": doc.id,
        "patient_mrn": doc.patient_mrn,
        "uploader_id": doc.uploader_id,
        "filename": doc.filename,
        "document_type": doc.document_type,
        "extraction_status": doc.extraction_status,
        "approved_by": doc.approved_by,
        "extracted_data": doc.extracted_data,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
    }
