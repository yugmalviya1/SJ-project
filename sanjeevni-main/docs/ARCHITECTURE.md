# MedSecure AI: Architecture & Specification Document
**Version:** 1.0.0  
**Status:** M0 Milestone Blueprint  

---

## 1. System Overview & Core Principle

> **"AI handles understanding. Database handles records. Security controls access. Blockchain proves integrity."**

MedSecure AI bridges unstructured clinical reporting and tamper-proof electronic health record (EHR) management. Raw documents (prescriptions, pathology reports, discharge summaries) undergo OCR and fine-tuned LLM extraction (QLoRA) to yield structured, FHIR-compliant clinical entities. After human-in-the-loop review, verified records are written to PostgreSQL and anchored into a cryptographic tamper-evident audit ledger.

```
                         ┌──────────────────────┐
                         │   Hospital Users     │
                         │ Doctor / Admin / etc. │
                         └──────────┬───────────┘
                                    │
                              React Dashboard
                                    │
                                  HTTPS
                                    │
                              FastAPI Backend
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
   Authentication              Medical Data               AI Layer
   + RBAC                       Service                  ┌──────────┐
          │                         │                    │   OCR    │
          │                         │                    └────┬─────┘
          │                         │                         ▼
          │                         │                  Document Parser
          │                         │                         │
          │                         │                         ▼
          │                         │                  QLoRA Model
          │                         │                         │
          │                         │                         ▼
          │                         │                  Structured JSON
          │                         │                         │
          ▼                         ▼                         ▼
     Audit Logs               PostgreSQL                  RAG
          │                         │                         │
          └──────────────┬──────────┴─────────────────────────┘
                         ▼
                  Integrity Layer
                         │
                   SHA-256 Hash
                         │
                         ▼
                Permissioned Ledger
```

---

## 2. Threat Modeling & Security Principles

1. **Information Leakage via AI / RAG:** Vector search retrieval must occur *strictly after* role-based and patient-scoped authorization filtering.
2. **Medical Record Tampering:** Any unauthorized write or modification to database records triggers an immediate hash mismatch against the ledger.
3. **Medical Hallucination Risk:** Extracted entities are treated as *draft proposals*. A qualified healthcare provider must review and approve entities before they are committed as official records.
4. **Data at Rest & Transit:** Sensitive identifiers (PII/PHI) are encrypted at rest using AES-256-GCM. In-transit data requires TLS 1.3 / HTTPS.

---

## 3. RBAC Matrix

| Role | Patient Records Scope | Upload Documents | AI Analysis / Extraction | RAG Query | Ledger Audit | Admin Controls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient** | Own record only | Limited (self-upload) | Own reports only | Own record | View own audit | ❌ |
| **Doctor** | Assigned patients | Yes | Yes (execute & review) | Authorized patients | Verify hash | ❌ |
| **Hospital Admin** | Policy-scoped / All | Yes | Configuration only | Aggregated / Policy | Full audit | Yes |
| **Auditor** | Read-only audit logs | ❌ | ❌ | ❌ | Full verification | Audit only |

---

## 4. Standard Medical Extraction Schema (Target JSON)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MedSecureReportExtraction",
  "type": "object",
  "required": ["report_type", "patient_info", "clinical_findings"],
  "properties": {
    "report_type": {
      "type": "string",
      "enum": ["CBC", "Prescription", "DischargeSummary", "Radiology", "Pathology", "ClinicalNotes"]
    },
    "patient_info": {
      "type": "object",
      "properties": {
        "name": { "type": ["string", "null"] },
        "age": { "type": ["integer", "null"] },
        "gender": { "type": ["string", "null"] },
        "mrn": { "type": ["string", "null"] }
      }
    },
    "encounter_date": { "type": ["string", "null"] },
    "diagnoses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "description": { "type": "string" },
          "status": { "type": "string" }
        }
      }
    },
    "medications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "dosage": { "type": "string" },
          "frequency": { "type": "string" },
          "route": { "type": "string" },
          "duration": { "type": "string" }
        }
      }
    },
    "lab_results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "value": { "type": ["number", "string"] },
          "unit": { "type": "string" },
          "reference_range": { "type": "string" },
          "interpretation": { "type": "string", "enum": ["NORMAL", "HIGH", "LOW", "CRITICAL", "UNKNOWN"] }
        }
      }
    },
    "clinical_findings": { "type": "string" }
  }
}
```

---

## 5. Tamper-Proof Cryptographic Ledger Design

1. **Canonical Serialization:** Record data is normalized into deterministic canonical JSON (keys alphabetically sorted, compact whitespace).
2. **SHA-256 Fingerprinting:**
   $$\text{Hash}_n = \text{SHA256}(\text{CanonicalJSON}(\text{Record}_n) \parallel \text{Timestamp} \parallel \text{Hash}_{n-1})$$
3. **Tamper Detection:** If any database row is altered out-of-band:
   $$\text{SHA256}(\text{ModifiedData}) \ne \text{LedgerHash}$$
   The integrity verification service immediately flags the record with status `TAMPER_DETECTED`.

---

## 6. Milestone Schedule

- **M0:** Architecture & System Design *(Current)*
- **M1:** AI Dataset Generation & Baseline vs. QLoRA Extraction System
- **M2:** OCR & Document Processing Pipeline (PDF/Image parsing)
- **M3:** PostgreSQL FHIR-inspired Data Layer
- **M4:** Security, RBAC & End-to-End Audit Logging
- **M5:** Cryptographic Integrity & Blockchain Verification Engine
- **M6:** Secure Authorization-Scoped RAG Pipeline
- **M7:** Unified Hospital Dashboard (React + FastAPI)
- **M8:** Comprehensive Evaluation (Security audits, hallucinations, accuracy, latency)
