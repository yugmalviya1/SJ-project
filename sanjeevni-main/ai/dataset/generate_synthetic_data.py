import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pathlib import Path

# Fix seed for reproducible scientific synthetic generation
random.seed(42)

NAMES = [
    ("Rahul Sharma", "Male", 45), ("Priya Patel", "Female", 34),
    ("Ankit Verma", "Male", 29), ("Sneha Kulkarni", "Female", 52),
    ("Vikram Singh", "Male", 61), ("Deepika Rao", "Female", 40),
    ("Arjun Nair", "Male", 38), ("Meera Joshi", "Female", 27),
    ("Rohan Deshmukh", "Male", 50), ("Sunita Gupta", "Female", 68)
]

BLOOD_TESTS = [
    {"name": "Hemoglobin", "min": 8.0, "max": 18.0, "unit": "g/dL", "ref": "12.0 - 16.0"},
    {"name": "WBC", "min": 3000, "max": 18000, "unit": "/µL", "ref": "4,500 - 11,000"},
    {"name": "Platelets", "min": 80000, "max": 450000, "unit": "/µL", "ref": "150,000 - 450,000"},
    {"name": "Fasting Blood Glucose", "min": 65, "max": 280, "unit": "mg/dL", "ref": "70 - 99"},
    {"name": "HbA1c", "min": 4.5, "max": 12.5, "unit": "%", "ref": "< 5.7"},
    {"name": "Serum Creatinine", "min": 0.5, "max": 3.8, "unit": "mg/dL", "ref": "0.7 - 1.3"}
]

MEDICATIONS = [
    {"name": "Metformin", "dosage": "500 mg", "frequency": "Once daily with dinner", "route": "Oral", "duration": "90 days"},
    {"name": "Atorvastatin", "dosage": "20 mg", "frequency": "Once at bedtime", "route": "Oral", "duration": "90 days"},
    {"name": "Amlodipine", "dosage": "5 mg", "frequency": "Once daily morning", "route": "Oral", "duration": "60 days"},
    {"name": "Amoxicillin", "dosage": "500 mg", "frequency": "Every 8 hours", "route": "Oral", "duration": "7 days"},
    {"name": "Azithromycin", "dosage": "250 mg", "frequency": "Once daily", "route": "Oral", "duration": "5 days"},
    {"name": "Pantoprazole", "dosage": "40 mg", "frequency": "Once daily before breakfast", "route": "Oral", "duration": "14 days"}
]

DIAGNOSES = [
    {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications", "status": "CONFIRMED"},
    {"code": "I10", "description": "Essential (primary) hypertension", "status": "CONFIRMED"},
    {"code": "J02.9", "description": "Acute pharyngitis, unspecified", "status": "RESOLVED"},
    {"code": "K21.9", "description": "Gastro-esophageal reflux disease without esophagitis", "status": "ACTIVE"},
    {"code": "D64.9", "description": "Anemia, unspecified", "status": "SUSPECTED"}
]

def generate_cbc_report(patient: tuple, date_str: str) -> Dict[str, Any]:
    name, gender, age = patient
    mrn = f"MRN-{random.randint(10000, 99999)}"
    
    selected_tests = random.sample(BLOOD_TESTS[:3], k=random.randint(2, 3))
    raw_lines = [
        f"METRO LABS & DIAGNOSTICS - CLINICAL REPORT",
        f"Patient: {name}    Age: {age}    Gender: {gender}    MRN: {mrn}",
        f"Collection Date: {date_str}    Report Type: Complete Blood Count (CBC)",
        "----------------------------------------------------------------",
        "TEST NAME                RESULT       REFERENCE RANGE   UNIT"
    ]
    
    results = []
    for test in selected_tests:
        val = round(random.uniform(test["min"], test["max"]), 1) if "g/dL" in test["unit"] or "%" in test["unit"] else random.randint(int(test["min"]), int(test["max"]))
        interp = "NORMAL"
        if "Hemoglobin" in test["name"] and val < 12.0:
            interp = "LOW"
        elif "WBC" in test["name"] and val > 11000:
            interp = "HIGH"
        
        raw_lines.append(f"{test['name']:<24} {str(val):<12} {test['ref']:<17} {test['unit']}")
        results.append({
            "name": test["name"],
            "value": val,
            "unit": test["unit"],
            "reference_range": test["ref"],
            "interpretation": interp
        })
        
    raw_text = "\n".join(raw_lines)
    
    output_json = {
        "report_type": "CBC",
        "patient_info": {"name": name, "age": age, "gender": gender, "mrn": mrn},
        "encounter_date": date_str,
        "diagnoses": [],
        "medications": [],
        "lab_results": results,
        "clinical_findings": "Routine CBC panel analysis."
    }
    
    return {
        "instruction": "Extract structured medical entities and return strictly valid JSON according to MedSecure schema.",
        "input": raw_text,
        "output": output_json
    }

def generate_prescription(patient: tuple, date_str: str) -> Dict[str, Any]:
    name, gender, age = patient
    mrn = f"MRN-{random.randint(10000, 99999)}"
    selected_diag = random.choice(DIAGNOSES)
    selected_meds = random.sample(MEDICATIONS, k=random.randint(1, 2))
    
    raw_lines = [
        f"APOLLO CLINIC - OUTPATIENT PRESCRIPTION",
        f"Date: {date_str} | Patient: {name} ({gender}, {age}y) | ID: {mrn}",
        f"Chief Diagnosis: {selected_diag['description']} (ICD: {selected_diag['code']})",
        "Rx Medications:"
    ]
    for i, med in enumerate(selected_meds, 1):
        raw_lines.append(f"{i}. {med['name']} {med['dosage']} - {med['frequency']} - Route: {med['route']} x {med['duration']}")
    
    raw_lines.append("Advice: Maintain low-sodium diet, regular aerobic exercise, and follow-up in 4 weeks.")
    raw_text = "\n".join(raw_lines)
    
    output_json = {
        "report_type": "Prescription",
        "patient_info": {"name": name, "age": age, "gender": gender, "mrn": mrn},
        "encounter_date": date_str,
        "diagnoses": [selected_diag],
        "medications": selected_meds,
        "lab_results": [],
        "clinical_findings": "Outpatient clinical management and prescription."
    }
    
    return {
        "instruction": "Extract structured medical entities and return strictly valid JSON according to MedSecure schema.",
        "input": raw_text,
        "output": output_json
    }

def generate_discharge_summary(patient: tuple, date_str: str) -> Dict[str, Any]:
    name, gender, age = patient
    mrn = f"MRN-{random.randint(10000, 99999)}"
    diag = random.choice(DIAGNOSES)
    med = random.choice(MEDICATIONS)
    lab = random.choice(BLOOD_TESTS)
    lab_val = round(random.uniform(lab["min"], lab["max"]), 1) if "g/dL" in lab["unit"] else random.randint(int(lab["min"]), int(lab["max"]))
    
    raw_lines = [
        "MAX SUPER SPECIALITY HOSPITAL - DISCHARGE SUMMARY",
        f"Patient: {name} | MRN: {mrn} | Age/Sex: {age}/{gender}",
        f"Discharge Date: {date_str}",
        f"Primary Discharge Diagnosis: {diag['description']} [{diag['code']}]",
        f"Hospital Course: Patient admitted with acute presentation. Stabilized with supportive therapy.",
        f"Key Laboratory at Discharge: {lab['name']} was recorded at {lab_val} {lab['unit']} (Ref: {lab['ref']}).",
        f"Discharge Medications: Continue {med['name']} {med['dosage']} {med['frequency']} for {med['duration']}.",
        "Follow-up: Visit OPD in 14 days."
    ]
    raw_text = "\n".join(raw_lines)
    
    output_json = {
        "report_type": "DischargeSummary",
        "patient_info": {"name": name, "age": age, "gender": gender, "mrn": mrn},
        "encounter_date": date_str,
        "diagnoses": [diag],
        "medications": [med],
        "lab_results": [{
            "name": lab["name"],
            "value": lab_val,
            "unit": lab["unit"],
            "reference_range": lab["ref"],
            "interpretation": "NORMAL"
        }],
        "clinical_findings": "Patient stabilized and discharged with maintenance regimen."
    }
    
    return {
        "instruction": "Extract structured medical entities and return strictly valid JSON according to MedSecure schema.",
        "input": raw_text,
        "output": output_json
    }

def build_dataset(total_count: int = 600, output_dir: str = "ai/dataset") -> None:
    dataset = []
    base_date = datetime(2026, 1, 1)
    
    for i in range(total_count):
        patient = random.choice(NAMES)
        date_str = (base_date + timedelta(days=random.randint(0, 240))).strftime("%Y-%m-%d")
        report_choice = i % 3
        
        if report_choice == 0:
            sample = generate_cbc_report(patient, date_str)
        elif report_choice == 1:
            sample = generate_prescription(patient, date_str)
        else:
            sample = generate_discharge_summary(patient, date_str)
            
        dataset.append(sample)
        
    # Stratify by report type to ensure balanced representation across train, val, and test
    random.shuffle(dataset)
    cbc_list = [d for d in dataset if d["output"]["report_type"] == "CBC"]
    rx_list = [d for d in dataset if d["output"]["report_type"] == "Prescription"]
    dc_list = [d for d in dataset if d["output"]["report_type"] == "DischargeSummary"]
    
    train_data, val_data, test_data = [], [], []
    for sublist in [cbc_list, rx_list, dc_list]:
        n = len(sublist)
        n_train = int(0.8 * n)
        n_val = int(0.1 * n)
        train_data.extend(sublist[:n_train])
        val_data.extend(sublist[n_train:n_train + n_val])
        test_data.extend(sublist[n_train + n_val:])
        
    random.shuffle(train_data)
    random.shuffle(val_data)
    random.shuffle(test_data)
    
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    with open(out_path / "train.json", "w", encoding="utf-8") as f:
        json.dump(train_data, f, indent=2)
    with open(out_path / "val.json", "w", encoding="utf-8") as f:
        json.dump(val_data, f, indent=2)
    with open(out_path / "test.json", "w", encoding="utf-8") as f:
        json.dump(test_data, f, indent=2)
        
    print(f"Generated {total_count} medical synthetic samples:")
    print(f" - Train: {len(train_data)} ({out_path / 'train.json'})")
    print(f" - Val:   {len(val_data)} ({out_path / 'val.json'})")
    print(f" - Test:  {len(test_data)} ({out_path / 'test.json'})")

if __name__ == "__main__":
    build_dataset(600)
