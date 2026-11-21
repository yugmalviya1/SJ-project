"""
MedSecure AI: Database Seeder Script (Enterprise Healthcare Architecture)
Initializes SQLite database with standard demo users, hospitals, doctors, patient clinical charts,
case sheets, accident/police emergency records, consent grants, cryptographic ledger anchors, and audit logs.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.models import (
    Base, engine, SessionLocal, User, Hospital, Doctor, HospitalDoctor,
    Patient, ConsentGrant, Encounter, CaseSheet, AccidentRecord, EmergencyAccessLog,
    RecordVersion, Diagnosis, Medication, LabResult, Document, AuditLog
)
from security.auth import hash_password
from blockchain.ledger import MedicalLedger

LEDGER_FILE = Path(__file__).resolve().parent / "ledger_chain.json"

def seed(force=False):
    print("[MedSecure Seeder] Initializing schema...")
    if force:
        if LEDGER_FILE.exists():
            LEDGER_FILE.unlink()
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded with extended entities
        if not force and db.query(Hospital).count() > 0:
            print("[MedSecure Seeder] Database already populated with enterprise records. Skipping re-seed.")
            return

        print("[MedSecure Seeder] Seeding Demo Hospitals...")
        hosp1 = Hospital(
            id="HOSP-001",
            name="Apollo Multispecialty Hospital",
            address="Plot 14, Health City, Sector 62, New Delhi",
            contact="+91-11-2890-4400",
            departments=["Cardiology", "Internal Medicine", "Endocrinology", "Emergency & Trauma"],
            status="ACTIVE"
        )
        hosp2 = Hospital(
            id="HOSP-002",
            name="AIIMS Apex Trauma & General Center",
            address="Ansari Nagar East, Ring Road, New Delhi",
            contact="+91-11-2658-8500",
            departments=["Trauma Care", "Neurology", "General Surgery", "Emergency Medicine"],
            status="ACTIVE"
        )
        db.add_all([hosp1, hosp2])
        db.commit()

        print("[MedSecure Seeder] Seeding Demo Doctors...")
        doc1 = Doctor(
            id="DR-1001",
            user_id="USR-DOC-1",
            full_name="Dr. Robert Smith, MD",
            specialization="Cardiology & Internal Medicine",
            qualifications="MBBS, MD, DM (Cardiology)",
            registration_no="MCI-DEL-2012-44910",
            departments=["Cardiology", "Internal Medicine"],
            status="ACTIVE"
        )
        doc2 = Doctor(
            id="DR-1002",
            user_id="USR-DOC-2",
            full_name="Dr. Ananya Ray, MS",
            specialization="Emergency & Trauma Surgery",
            qualifications="MBBS, MS (General Surgery), Trauma Fellow",
            registration_no="MCI-DEL-2015-88231",
            departments=["Emergency & Trauma", "Trauma Care"],
            status="ACTIVE"
        )
        db.add_all([doc1, doc2])
        db.commit()

        print("[MedSecure Seeder] Seeding Doctor-Hospital Affiliations (Multi-Hospital Doctors)...")
        affil1 = HospitalDoctor(
            hospital_id="HOSP-001",
            doctor_id="DR-1001",
            department="Internal Medicine",
            role_designation="Senior Attending Consultant",
            joined_date="2020-03-15"
        )
        affil2 = HospitalDoctor(
            hospital_id="HOSP-002",
            doctor_id="DR-1001",
            department="Cardiology",
            role_designation="Visiting Chief Cardiologist",
            joined_date="2022-01-10"
        )
        affil3 = HospitalDoctor(
            hospital_id="HOSP-002",
            doctor_id="DR-1002",
            department="Trauma Care",
            role_designation="Head of Emergency Surgery",
            joined_date="2021-06-01"
        )
        db.add_all([affil1, affil2, affil3])
        db.commit()

        print("[MedSecure Seeder] Seeding Demo Users...")
        # Check existing users or update them
        existing_users = {u.id: u for u in db.query(User).all()}
        users_to_add = [
            User(
                id="USR-DOC-1",
                username="dr_smith",
                hashed_password=hash_password("password123"),
                full_name="Dr. Robert Smith, MD",
                role="Doctor",
                doctor_id="DR-1001",
                patient_mrn=None,
                hospital_id="HOSP-001",
                is_active=True
            ),
            User(
                id="USR-DOC-2",
                username="dr_ananya",
                hashed_password=hash_password("password123"),
                full_name="Dr. Ananya Ray, MS",
                role="Doctor",
                doctor_id="DR-1002",
                patient_mrn=None,
                hospital_id="HOSP-002",
                is_active=True
            ),
            User(
                id="USR-PAT-1",
                username="pat_rahul",
                hashed_password=hash_password("password123"),
                full_name="Rahul Sharma",
                role="Patient",
                patient_mrn="MRN-1002",
                hospital_id=None,
                is_active=True
            ),
            User(
                id="USR-PAT-2",
                username="pat_priya",
                hashed_password=hash_password("password123"),
                full_name="Priya Patel",
                role="Patient",
                patient_mrn="MRN-2004",
                hospital_id=None,
                is_active=True
            ),
            User(
                id="USR-ADM-1",
                username="admin_sarah",
                hashed_password=hash_password("password123"),
                full_name="Sarah Jenkins",
                role="HospitalAdmin",
                hospital_id="HOSP-001",
                patient_mrn=None,
                is_active=True
            ),
            User(
                id="USR-AUD-1",
                username="auditor_alex",
                hashed_password=hash_password("password123"),
                full_name="Alex Rivera",
                role="Auditor",
                patient_mrn=None,
                hospital_id=None,
                is_active=True
            ),
            User(
                id="USR-POL-1",
                username="officer_kumar",
                hashed_password=hash_password("password123"),
                full_name="Sub-Inspector Rajesh Kumar",
                role="PoliceEmergency",
                patient_mrn=None,
                hospital_id=None,
                is_active=True
            )
        ]
        for u in users_to_add:
            if u.id not in existing_users:
                db.add(u)
            else:
                existing_users[u.id].doctor_id = u.doctor_id
                existing_users[u.id].hospital_id = u.hospital_id
        db.commit()

        print("[MedSecure Seeder] Seeding Patients with Global Health IDs...")
        patients_data = [
            ("MRN-1002", "PAT-00000001", "Rahul Sharma", "Male", 34, "O+", "+91-98110-23451", "USR-DOC-1", "HOSP-001"),
            ("MRN-2004", "PAT-00000002", "Priya Patel", "Female", 42, "B+", "+91-98220-45672", "USR-DOC-1", "HOSP-001"),
            ("MRN-3008", "PAT-00000003", "Vikram Malhotra", "Male", 58, "AB+", "+91-98330-89123", "USR-DOC-2", "HOSP-002")
        ]
        for mrn, gid, name, gender, age, bg, em_contact, doc_id, hosp_id in patients_data:
            existing_p = db.query(Patient).filter(Patient.mrn == mrn).first()
            if not existing_p:
                p = Patient(
                    mrn=mrn,
                    global_id=gid,
                    full_name=name,
                    gender=gender,
                    age=age,
                    blood_group=bg,
                    emergency_contact=em_contact,
                    assigned_doctor_id=doc_id,
                    assigned_hospital_id=hosp_id,
                    identity_verified=True,
                    identity_provider="Prototype Identity Service (Mock Aadhaar & Face OK)"
                )
                db.add(p)
            else:
                existing_p.global_id = gid
                existing_p.blood_group = bg
                existing_p.emergency_contact = em_contact
                existing_p.assigned_hospital_id = hosp_id
                existing_p.identity_verified = True
        db.commit()

        print("[MedSecure Seeder] Seeding Consent & Data Sharing Grants...")
        if db.query(ConsentGrant).count() == 0:
            c1 = ConsentGrant(
                id="CSN-001",
                patient_mrn="MRN-1002",
                granted_to_type="DOCTOR",
                granted_to_id="DR-1001",
                granted_to_name="Dr. Robert Smith, MD",
                scope="FULL",
                status="ACTIVE",
                reason="Primary diabetes management and outpatient routine care",
                expires_at="2027-01-01"
            )
            c2 = ConsentGrant(
                id="CSN-002",
                patient_mrn="MRN-1002",
                granted_to_type="HOSPITAL",
                granted_to_id="HOSP-001",
                granted_to_name="Apollo Multispecialty Hospital",
                scope="FULL",
                status="ACTIVE",
                reason="Hospital institutional care and laboratory records",
                expires_at="2027-01-01"
            )
            c3 = ConsentGrant(
                id="CSN-003",
                patient_mrn="MRN-2004",
                granted_to_type="DOCTOR",
                granted_to_id="DR-1001",
                granted_to_name="Dr. Robert Smith, MD",
                scope="FULL",
                status="ACTIVE",
                reason="Endocrine follow-up consult",
                expires_at="2026-12-31"
            )
            db.add_all([c1, c2, c3])
            db.commit()

        print("[MedSecure Seeder] Seeding Clinical Case Sheets...")
        if db.query(CaseSheet).count() == 0:
            cs1 = CaseSheet(
                id="CS-1001",
                patient_mrn="MRN-1002",
                doctor_id="DR-1001",
                hospital_id="HOSP-001",
                status="FINALIZED",
                version=1,
                chief_complaint="Routine evaluation for elevated fasting plasma glucose and mild polydipsia.",
                history_present_illness="Patient reports 6 months of increased thirst and evening fatigue. No episodes of syncope, chest pain, or dyspnea.",
                past_medical_history="Diagnosed with mild hypertension 2 years ago. No prior diabetic ketoacidosis.",
                past_surgical_history="Appendectomy at age 18. Uneventful recovery.",
                family_history="Father had Type 2 Diabetes; Mother has hypertension.",
                social_lifestyle_history="Non-smoker, occasional alcohol on weekends. Sedentary IT desk job.",
                allergies=["Penicillin (cutaneous rash)"],
                vitals={"blood_pressure": "134/86 mmHg", "heart_rate": "74 bpm", "temperature": "98.4 F", "spo2": "99%", "weight": "78 kg", "bmi": "25.8"},
                physical_examination="Alert, oriented. Cardiovascular: S1/S2 heard, no murmurs. Respiratory: Clear vesicular breath sounds bilaterally. Abdomen soft, non-tender.",
                provisional_diagnosis="Type 2 Diabetes Mellitus without acute complications (ICD-10: E11.9); Essential Hypertension (ICD-10: I10).",
                treatment_plan="Initiate Metformin 500mg BID with meals. Continue Lisinopril 10mg daily. Recommend 30-minute daily brisk walking and diabetic diet.",
                procedures="None indicated at present visit.",
                doctor_notes="Patient educated on recognizing hypoglycemia signs. Fasting blood sugar log advised.",
                follow_up_instructions="Repeat HbA1c in 90 days. Return if fasting sugar exceeds 180 mg/dL consistently."
            )
            db.add(cs1)
            db.commit()

        print("[MedSecure Seeder] Seeding Accident & Police Emergency Record (Vikram Malhotra)...")
        if db.query(AccidentRecord).count() == 0:
            acc1 = AccidentRecord(
                id="ACC-001",
                patient_mrn="MRN-3008",
                encounter_id="ENC-3001",
                accident_type="High-Speed Road Traffic Accident (Vehicular Collision)",
                accident_time="2026-02-15 02:45 AM",
                location="Intersection NH-48 near Mahipalpur Flyover, New Delhi",
                police_station="Vasant Kunj North Police Station",
                police_report_ref="FIR-2026/089-VKN",
                investigating_officer="Inspector M. S. Hooda (Badge #7421)",
                injury_details="Blunt force trauma to anterior chest wall against steering wheel, laceration over left temporal region (4 cm), multiple superficial abrasions.",
                bleeding_status="Active temporal venous bleeding controlled via compression & suturing in ER.",
                emergency_observations="Patient brought in semi-conscious by PCR Van 12. GCS 13/15. Marked retrosternal chest pain with ST-segment elevation. Emergency ECG & Troponin ordered immediately.",
                treatment_administered="Emergency wound debridement & closure (4-0 Prolene). Dual antiplatelet loading (Aspirin 325mg + Clopidogrel 300mg). IV Heparin infusion initiated.",
                imaging_findings="Chest X-Ray: Sternal contusion, no rib fractures, no pneumothorax. Non-contrast CT Head: No intracranial hemorrhage.",
                discharge_status="Transferred to Cardiac Intensive Care Unit for emergency percutaneous intervention."
            )
            db.add(acc1)
            db.commit()

        print("[MedSecure Seeder] Seeding Emergency Break-Glass Log...")
        if db.query(EmergencyAccessLog).count() == 0:
            em_log = EmergencyAccessLog(
                id="BRK-001",
                doctor_id="DR-1002",
                doctor_name="Dr. Ananya Ray, MS",
                hospital_id="HOSP-002",
                patient_mrn="MRN-3008",
                reason="Unconscious trauma admission from severe highway vehicular collision under FIR-2026/089-VKN. Emergency cardiac resuscitation required.",
                access_scope="ACCIDENT_EMERGENCY_ONLY",
                status="AUTHORIZED_BREAK_GLASS"
            )
            db.add(em_log)
            db.commit()

        print("[MedSecure Seeder] Seeding Record Versions...")
        if db.query(RecordVersion).count() == 0:
            rv1 = RecordVersion(
                id="VER-001",
                record_type="CASE_SHEET",
                record_id="CS-1001",
                version_number=1,
                snapshot_data={
                    "patient_mrn": "MRN-1002",
                    "diagnosis": "Type 2 Diabetes Mellitus without complications",
                    "medications": ["Metformin 500mg BID", "Lisinopril 10mg OD"],
                    "vitals": {"bp": "134/86", "hr": "74"}
                },
                canonical_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                created_by="DR-1001",
                change_summary="Initial comprehensive outpatient case sheet creation"
            )
            db.add(rv1)
            db.commit()

        print("[MedSecure Seeder] Updating Clinical Encounters...")
        # Check encounters
        enc1 = db.query(Encounter).filter(Encounter.id == "ENC-1001").first()
        if not enc1:
            enc1 = Encounter(
                id="ENC-1001",
                patient_mrn="MRN-1002",
                doctor_id="USR-DOC-1",
                hospital_id="HOSP-001",
                encounter_type="OPD",
                encounter_date="2026-01-20",
                status="FINISHED",
                notes="Routine follow-up for diabetes management. Patient adheres to lifestyle regimen."
            )
            db.add(enc1)
            db.commit()

            diag1_1 = Diagnosis(encounter_id="ENC-1001", code="E11.9", description="Type 2 Diabetes Mellitus without complications", status="CONFIRMED")
            diag1_2 = Diagnosis(encounter_id="ENC-1001", code="I10", description="Essential primary hypertension", status="CONFIRMED")
            db.add_all([diag1_1, diag1_2])

            med1_1 = Medication(encounter_id="ENC-1001", name="Metformin Hydrochloride", dosage="500 mg", frequency="Twice daily with meals", route="Oral", duration="90 days")
            med1_2 = Medication(encounter_id="ENC-1001", name="Lisinopril", dosage="10 mg", frequency="Once daily in the morning", route="Oral", duration="90 days")
            db.add_all([med1_1, med1_2])

            lab1_1 = LabResult(encounter_id="ENC-1001", test_type="Laboratory", test_name="Fasting Blood Glucose", value=138.0, unit="mg/dL", reference_range="70 - 99", interpretation="HIGH")
            lab1_2 = LabResult(encounter_id="ENC-1001", test_type="Laboratory", test_name="HbA1c", value=7.2, unit="%", reference_range="4.0 - 5.6", interpretation="HIGH")
            lab1_3 = LabResult(encounter_id="ENC-1001", test_type="Laboratory", test_name="Hemoglobin", value=14.5, unit="g/dL", reference_range="13.0 - 17.0", interpretation="NORMAL")
            db.add_all([lab1_1, lab1_2, lab1_3])
            db.commit()

        # Seed Document DOC-101 if not exists
        doc1 = db.query(Document).filter(Document.id == "DOC-101").first()
        if not doc1:
            doc1 = Document(
                id="DOC-101",
                patient_mrn="MRN-1002",
                uploader_id="USR-DOC-1",
                filename="rahul_cbc_pathology_report.txt",
                file_path="uploads/rahul_cbc_pathology_report.txt",
                document_type="CBC",
                extraction_status="APPROVED",
                extracted_data={
                    "report_type": "CBC",
                    "patient_info": {"name": "Rahul Sharma", "age": 34, "gender": "Male", "mrn": "MRN-1002"},
                    "encounter_date": "2026-01-20",
                    "diagnoses": [{"code": "E11.9", "description": "Type 2 Diabetes Mellitus without complications", "status": "CONFIRMED"}],
                    "medications": [{"name": "Metformin Hydrochloride", "dosage": "500 mg", "frequency": "Twice daily", "route": "Oral", "duration": "90 days"}],
                    "lab_results": [
                        {"name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "reference_range": "13.0 - 17.0", "interpretation": "NORMAL"},
                        {"name": "WBC", "value": 6800, "unit": "/µL", "reference_range": "4500 - 11000", "interpretation": "NORMAL"},
                        {"name": "Platelets", "value": 245000, "unit": "/µL", "reference_range": "150000 - 450000", "interpretation": "NORMAL"}
                    ],
                    "clinical_findings": "Complete Blood Count within normal physiological parameters. Blood glucose slightly elevated."
                },
                approved_by="Dr. Robert Smith, MD"
            )
            db.add(doc1)
            db.commit()

        print("[MedSecure Seeder] Seeding Enterprise Audit Trail...")
        audit_events = [
            AuditLog(
                user_id="USR-ADM-1",
                action="SYSTEM_INIT",
                patient_mrn=None,
                hospital_id="HOSP-001",
                resource_id="SYSTEM",
                status="SUCCESS",
                details={"event": "MedSecure AI Enterprise Clinical Platform initialized with cryptographic anchors."}
            ),
            AuditLog(
                user_id="USR-PAT-1",
                action="CONSENT_GRANTED",
                patient_mrn="MRN-1002",
                hospital_id="HOSP-001",
                resource_id="DR-1001",
                status="SUCCESS",
                details={"scope": "FULL", "reason": "Authorized Dr. Robert Smith for outpatient diabetic management"}
            ),
            AuditLog(
                user_id="USR-DOC-2",
                action="EMERGENCY_ACCESS",
                patient_mrn="MRN-3008",
                hospital_id="HOSP-002",
                resource_id="BRK-001",
                status="AUTHORIZED_BREAK_GLASS",
                details={"reason": "Emergency resuscitation following highway collision FIR-2026/089-VKN"}
            )
        ]
        db.add_all(audit_events)
        db.commit()

        # Seed Cryptographic Ledger Anchors
        print("[MedSecure Seeder] Initializing Cryptographic Ledger Anchors...")
        ledger = MedicalLedger(storage_path=str(LEDGER_FILE))
        
        # Verify or commit anchors
        rec_data_1002 = {
            "mrn": "MRN-1002",
            "full_name": "Rahul Sharma",
            "diagnoses": ["E11.9: Type 2 Diabetes Mellitus without complications", "I10: Essential primary hypertension"],
            "medications": ["Metformin Hydrochloride 500 mg", "Lisinopril 10 mg"],
            "latest_hba1c": 7.2
        }
        if not any(b.record_id == "MRN-1002" for b in ledger.chain):
            b1 = ledger.commit_record(record_id="MRN-1002", version=1, record_data=rec_data_1002)
            print(f" - Anchored MRN-1002 Block #{b1.index}")

        print("[MedSecure Seeder] Enterprise database & ledger setup completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"[MedSecure Seeder] Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    force_run = "--force" in sys.argv
    seed(force=force_run)
