"""
MedSecure AI: FastAPI Backend - Main Application Entry Point
Integrates: Auth, Scoped Patients, Clinical Case Sheets, Consent, Emergency & Police,
AI Extraction, Integrity Ledger, RAG, Audit
"""

import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

import httpx

# Compatibility patch for starlette < 0.37 with httpx >= 0.28.0
_orig_httpx_init = httpx.Client.__init__
def _compat_httpx_init(self, *args, **kwargs):
    kwargs.pop("app", None)
    return _orig_httpx_init(self, *args, **kwargs)
httpx.Client.__init__ = _compat_httpx_init

from backend.routers import (
    auth, patients, documents, ai_extract, ledger, rag_router, audit,
    consent, case_sheets, emergency
)

from contextlib import asynccontextmanager
from backend.deps import SessionLocal, init_rag_knowledge, ledger_instance
from database.seed_data import seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed()
        # Ensure in-memory ledger instance reloads any seeded anchors
        ledger_instance._load_from_storage()
        init_rag_knowledge(db)
        print("[MedSecure AI Backend] Enterprise clinical platform initialized with database & RAG indices.")
    finally:
        db.close()
    yield

app = FastAPI(
    title="MedSecure AI - Digital Health Record Platform",
    description="Enterprise Patient-Centric EHR with Scoped Consent, Break-Glass Emergency, Cryptographic Integrity, and Clinical Case Sheets",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router,         prefix="/api/auth",        tags=["Authentication & Identity"])
app.include_router(patients.router,     prefix="/api/patients",    tags=["Patients & Health Overview"])
app.include_router(consent.router,      prefix="/api/consent",     tags=["Consent & Access Control"])
app.include_router(case_sheets.router,  prefix="/api/case-sheets", tags=["Clinical Case Sheets"])
app.include_router(emergency.router,    prefix="/api/emergency",   tags=["Emergency & Police Access"])
app.include_router(documents.router,    prefix="/api/documents",   tags=["Documents & Reports"])
app.include_router(ai_extract.router,   prefix="/api/ai",          tags=["AI Extraction & Review"])
app.include_router(ledger.router,       prefix="/api/ledger",      tags=["Integrity Ledger"])
app.include_router(rag_router.router,   prefix="/api/rag",         tags=["Scoped Clinical RAG"])
app.include_router(audit.router,        prefix="/api/audit",       tags=["Audit & Compliance"])

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MedSecure AI Enterprise Platform",
        "version": "2.0.0",
        "environment": "DEMO / SYNTHETIC DATA"
    }

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc), "path": str(request.url)})

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
