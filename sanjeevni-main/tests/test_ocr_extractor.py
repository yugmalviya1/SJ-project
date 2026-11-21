"""
MedSecure AI: OCR & Clinical NLP Extractor Unit Tests (M1 & M2)
Validates:
- OCR text cleaning and newline normalization
- Section boundary segmentation
- Heuristic clinical entity extraction
"""

from ocr.processor import MedicalDocumentProcessor
from ai.inference.baseline_extractor import BaselineHeuristicExtractor

def test_ocr_text_cleaner_and_segmentation():
    proc = MedicalDocumentProcessor()
    sample = """
    HOSPITAL CLINICAL REPORT
    
    Patient: John Doe    Age: 45    Gender: Male    MRN: MRN-9090
    
    DIAGNOSES:
    Essential Hypertension
    
    MEDICATIONS:
    Amlodipine 5mg Daily
    """
    cleaned = proc.clean_text(sample)
    sections = proc.segment_sections(cleaned)
    assert "patient_demographics" in sections
    assert "diagnoses" in sections
    assert "medications" in sections

def test_baseline_heuristic_extraction():
    extractor = BaselineHeuristicExtractor()
    report = """METRO LABS & DIAGNOSTICS - CLINICAL REPORT
Patient: Ankit Verma    Age: 29    Gender: Male    MRN: MRN-53456
Collection Date: 2026-01-24    Report Type: Complete Blood Count (CBC)
----------------------------------------------------------------
TEST NAME                RESULT       REFERENCE RANGE   UNIT
Hemoglobin               14.2         12.0 - 16.0       g/dL
WBC                      6500         4,500 - 11,000    /µL
Platelets                240000       150,000 - 450,000 /µL
"""
    extracted = extractor.extract(report)
    assert extracted["report_type"] == "CBC"
    assert extracted["patient_info"]["name"] == "Ankit Verma"
    assert extracted["patient_info"]["mrn"] == "MRN-53456"
    assert extracted["patient_info"]["age"] == 29
    assert len(extracted["lab_results"]) == 3
