import re
import json
from typing import Dict, Any

class BaselineHeuristicExtractor:
    """
    M1.1 Baseline Extractor: Uses regex heuristics and pattern matching
    to extract structured clinical entities (demographics, diagnoses, medications, labs, findings).
    """
    def extract(self, text: str) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "report_type": "Unknown",
            "patient_info": {"name": None, "age": None, "gender": None, "mrn": None},
            "encounter_date": None,
            "diagnoses": [],
            "medications": [],
            "lab_results": [],
            "clinical_findings": ""
        }
        
        # Report type identification
        if "Complete Blood Count" in text or "CBC" in text:
            result["report_type"] = "CBC"
        elif "PRESCRIPTION" in text or "Prescription" in text:
            result["report_type"] = "Prescription"
        elif "DISCHARGE SUMMARY" in text or "DischargeSummary" in text:
            result["report_type"] = "DischargeSummary"
        else:
            result["report_type"] = "ClinicalReport"
            
        # Patient Info extraction
        name_match = re.search(r"Patient:\s*([A-Za-z\s]+?)(?:\s{2,}|\||\(|\n|Age)", text)
        if name_match:
            result["patient_info"]["name"] = name_match.group(1).strip()
            
        age_match = re.search(r"Age(?:\/Sex)?:\s*(\d+)", text)
        if not age_match:
            age_match = re.search(r"(\d+)y\)", text)
        if age_match:
            try:
                result["patient_info"]["age"] = int(age_match.group(1))
            except ValueError:
                pass
                
        gender_match = re.search(r"(?:Gender|Sex):\s*(Male|Female)", text, re.IGNORECASE)
        if not gender_match:
            gender_match = re.search(r"\((Male|Female),", text, re.IGNORECASE)
        if gender_match:
            result["patient_info"]["gender"] = gender_match.group(1).capitalize()
            
        mrn_match = re.search(r"(?:MRN|ID):\s*(MRN-\d+)", text)
        if mrn_match:
            result["patient_info"]["mrn"] = mrn_match.group(1)
            
        date_match = re.search(r"(?:Date|Collection Date|Discharge Date):\s*(\d{4}-\d{2}-\d{2})", text)
        if date_match:
            result["encounter_date"] = date_match.group(1)

        # 1. Diagnoses Extraction
        diag_section_match = re.search(
            r"(?:DIAGNOSIS|Diagnosis|Chief Diagnosis|Primary Diagnosis|Diagnoses):\s*\n*(.+?)(?=\n\s*(?:MEDICATIONS|Discharge Medications|Rx Medications|Lab Results|Key Laboratory|Hospital Course|Advice|TEST NAME|---\b)|\Z)",
            text,
            re.IGNORECASE | re.DOTALL
        )
        if diag_section_match:
            raw_diag_lines = [line.strip() for line in diag_section_match.group(1).splitlines() if line.strip()]
            for d_line in raw_diag_lines:
                # Remove leading numbers/bullets like "1."
                cleaned_line = re.sub(r"^\d+\.\s*", "", d_line).strip()
                if not cleaned_line:
                    continue
                # Match ICD code e.g. (ICD-10: E11.9) or (ICD: E11.9) or (I21.9) or (E03.9)
                code_match = re.search(r"\((?:ICD(?:-10)?:\s*)?([A-Z]\d+(?:\.\d+)?)\)", cleaned_line, re.IGNORECASE)
                code = code_match.group(1).upper() if code_match else "R69"
                desc = re.sub(r"\((?:ICD(?:-10)?:\s*)?[A-Z]\d+(?:\.\d+)?\)", "", cleaned_line).strip()
                desc = desc.rstrip("- :")
                result["diagnoses"].append({
                    "code": code,
                    "description": desc or cleaned_line,
                    "status": "CONFIRMED"
                })

        # 2. Medications Extraction
        med_section_match = re.search(
            r"(?:MEDICATIONS|Discharge Medications|Rx Medications|Prescribed Medications):\s*\n*(.+?)(?=\n\s*(?:DIAGNOSIS|Diagnosis|Lab Results|Key Laboratory|Hospital Course|Advice|Advice:|TEST NAME|---\b)|\Z)",
            text,
            re.IGNORECASE | re.DOTALL
        )
        if med_section_match:
            raw_med_lines = [line.strip() for line in med_section_match.group(1).splitlines() if line.strip()]
            for m_line in raw_med_lines:
                # Remove leading numbering
                cleaned_med = re.sub(r"^\d+[\.\)]\s*", "", m_line).strip()
                if not cleaned_med or cleaned_med.startswith("---"):
                    continue

                # Parse name and dosage
                dosage_match = re.search(r"(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units))\b", cleaned_med, re.IGNORECASE)
                dosage = dosage_match.group(1) if dosage_match else "Standard"

                # Parse route if specified
                route_match = re.search(r"Route:\s*([A-Za-z]+)", cleaned_med, re.IGNORECASE)
                route = route_match.group(1).capitalize() if route_match else ("Oral" if "oral" in cleaned_med.lower() else "Oral")

                # Parse duration if specified
                duration_match = re.search(r"x\s*(\d+\s*days?)", cleaned_med, re.IGNORECASE)
                duration = duration_match.group(1) if duration_match else "30 days"

                # Parse frequency
                freq = "Daily"
                if re.search(r"twice daily|BID", cleaned_med, re.IGNORECASE):
                    freq = "Twice Daily"
                elif re.search(r"once daily", cleaned_med, re.IGNORECASE):
                    freq = "Once Daily"
                elif re.search(r"nightly", cleaned_med, re.IGNORECASE):
                    freq = "Nightly"

                # Medication name is preceding text before dosage
                if dosage_match:
                    name_part = cleaned_med[:dosage_match.start()].strip(" -:")
                else:
                    name_part = cleaned_med.split("-")[0].strip()

                result["medications"].append({
                    "name": name_part or cleaned_med,
                    "dosage": dosage,
                    "frequency": freq,
                    "route": route,
                    "duration": duration
                })
            
        # 3. Lab results heuristic extraction: handle tabular CBC, chemistry and discharge narrative
        lab_names = [
            "Hemoglobin", "WBC", "Platelets", "Fasting Blood Glucose", 
            "HbA1c", "Serum Creatinine", "Troponin", "TSH"
        ]
        for lab in lab_names:
            # Match tabular: TestName      val      ref_range   unit
            m_tab = re.search(rf"{lab}\s+([0-9.]+)\s+([^0-9\n\r]+?)\s+([^\s\n\r]+)", text)
            # Match narrative: TestName was recorded at val unit (Ref: ref)
            m_narr = re.search(rf"{lab}\s+was recorded at\s+([0-9.]+)\s+([^\s\n\r]+)\s+\(Ref:\s*([^)]+)\)", text, re.IGNORECASE)
            
            if m_tab:
                raw_val = m_tab.group(1)
                val = float(raw_val) if "." in raw_val else int(raw_val)
                result["lab_results"].append({
                    "name": lab,
                    "value": val,
                    "unit": m_tab.group(3).strip(),
                    "reference_range": m_tab.group(2).strip(),
                    "interpretation": "NORMAL"
                })
            elif m_narr:
                raw_val = m_narr.group(1)
                val = float(raw_val) if "." in raw_val else int(raw_val)
                result["lab_results"].append({
                    "name": lab,
                    "value": val,
                    "unit": m_narr.group(2).strip(),
                    "reference_range": m_narr.group(3).strip(),
                    "interpretation": "NORMAL"
                })

        # 4. Clinical Findings / Narrative Summary
        findings_match = re.search(
            r"(?:Hospital Course|Advice|Clinical Findings|Notes):\s*\n*(.+?)(?=\n\s*[A-Z0-9 -]+:|\n---|\Z)",
            text,
            re.IGNORECASE | re.DOTALL
        )
        if findings_match:
            result["clinical_findings"] = findings_match.group(1).strip()
        else:
            diag_str = ", ".join([d["description"] for d in result["diagnoses"]])
            if diag_str:
                result["clinical_findings"] = f"Clinical encounter confirming {diag_str}."
            else:
                result["clinical_findings"] = f"Routine {result['report_type']} report evaluation."

        return result
