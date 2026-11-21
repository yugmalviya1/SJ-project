"""
MedSecure AI: FHIR-Inspired Relational Database Models (M3 Extended)
Engine: SQLAlchemy 2.0 ORM with PostgreSQL compatibility (and SQLite local fallback)
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean, Table, create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import os
from pathlib import Path

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False)  # Patient, Doctor, HospitalAdmin, Auditor, PoliceEmergency
    patient_mrn = Column(String(64), nullable=True)  # Populated if role == 'Patient'
    doctor_id = Column(String(64), nullable=True)    # e.g. DR-1001 if role == 'Doctor'
    hospital_id = Column(String(64), nullable=True)  # e.g. HOSP-001 if role == 'HospitalAdmin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(64), primary_key=True)  # e.g. HOSP-001
    name = Column(String(128), nullable=False)
    address = Column(String(255), nullable=False)
    contact = Column(String(64), nullable=False)
    departments = Column(JSON, default=list)  # ["Cardiology", "Endocrinology", "Emergency"]
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    doctors = relationship("HospitalDoctor", back_populates="hospital")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(64), primary_key=True)  # e.g. DR-1001 (Professional ID)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    full_name = Column(String(128), nullable=False)
    specialization = Column(String(128), nullable=False)
    qualifications = Column(String(128), nullable=False)
    registration_no = Column(String(64), nullable=False)
    departments = Column(JSON, default=list)
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    hospital_affiliations = relationship("HospitalDoctor", back_populates="doctor")

class HospitalDoctor(Base):
    __tablename__ = "hospital_doctors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=False)
    doctor_id = Column(String(64), ForeignKey("doctors.id"), nullable=False)
    department = Column(String(64), nullable=False)
    role_designation = Column(String(64), default="Attending Consultant")
    joined_date = Column(String(32), nullable=True)

    hospital = relationship("Hospital", back_populates="doctors")
    doctor = relationship("Doctor", back_populates="hospital_affiliations")

class Patient(Base):
    __tablename__ = "patients"

    mrn = Column(String(64), primary_key=True, index=True)  # Local/Existing Identifier e.g. MRN-1002
    global_id = Column(String(64), unique=True, index=True, nullable=True)  # Global Health ID e.g. PAT-0001
    full_name = Column(String(128), nullable=False)
    gender = Column(String(16), nullable=False)
    age = Column(Integer, nullable=False)
    blood_group = Column(String(8), nullable=True, default="O+")
    emergency_contact = Column(String(64), nullable=True)
    assigned_doctor_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    assigned_hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=True)
    identity_verified = Column(Boolean, default=True)
    identity_provider = Column(String(64), default="Prototype Identity Service")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")
    consent_grants = relationship("ConsentGrant", back_populates="patient", cascade="all, delete-orphan")
    case_sheets = relationship("CaseSheet", back_populates="patient", cascade="all, delete-orphan")
    accident_records = relationship("AccidentRecord", back_populates="patient", cascade="all, delete-orphan")

class ConsentGrant(Base):
    __tablename__ = "consent_grants"

    id = Column(String(64), primary_key=True)  # e.g. CSN-001
    patient_mrn = Column(String(64), ForeignKey("patients.mrn"), nullable=False)
    granted_to_type = Column(String(32), nullable=False)  # 'DOCTOR' or 'HOSPITAL'
    granted_to_id = Column(String(64), nullable=False)    # DR-1001 or HOSP-001
    granted_to_name = Column(String(128), nullable=False)
    scope = Column(String(64), default="FULL")            # FULL, SUMMARY_ONLY, ACCIDENT_ONLY
    status = Column(String(32), default="ACTIVE")         # ACTIVE, EXPIRED, REVOKED
    reason = Column(String(255), nullable=True)
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(String(32), nullable=True)        # ISO date or 'INDEFINITE'

    patient = relationship("Patient", back_populates="consent_grants")

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(64), primary_key=True)
    patient_mrn = Column(String(64), ForeignKey("patients.mrn"), nullable=False, index=True)
    doctor_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    hospital_id = Column(String(64), nullable=True)
    encounter_type = Column(String(64), nullable=False)  # OPD, Emergency, Inpatient
    encounter_date = Column(String(32), nullable=False)
    status = Column(String(32), default="FINISHED")  # PLANNED, IN_PROGRESS, FINISHED
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="encounters")
    diagnoses = relationship("Diagnosis", back_populates="encounter", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="encounter", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="encounter", cascade="all, delete-orphan")

class CaseSheet(Base):
    __tablename__ = "case_sheets"

    id = Column(String(64), primary_key=True)  # e.g. CS-1001
    patient_mrn = Column(String(64), ForeignKey("patients.mrn"), nullable=False)
    doctor_id = Column(String(64), nullable=False)
    hospital_id = Column(String(64), nullable=True)
    status = Column(String(32), default="DRAFT")  # DRAFT, FINALIZED
    version = Column(Integer, default=1)
    
    # Sections stored as structured JSON
    chief_complaint = Column(Text, nullable=True)
    history_present_illness = Column(Text, nullable=True)
    past_medical_history = Column(Text, nullable=True)
    past_surgical_history = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    social_lifestyle_history = Column(Text, nullable=True)
    allergies = Column(JSON, default=list)
    vitals = Column(JSON, default=dict)  # bp, heart_rate, temp, spo2, respiratory_rate
    physical_examination = Column(Text, nullable=True)
    provisional_diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    procedures = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    finalized_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="case_sheets")

class AccidentRecord(Base):
    __tablename__ = "accident_records"

    id = Column(String(64), primary_key=True)  # e.g. ACC-001
    patient_mrn = Column(String(64), ForeignKey("patients.mrn"), nullable=False)
    encounter_id = Column(String(64), nullable=True)
    accident_type = Column(String(64), nullable=False)  # Road Traffic Accident, Workplace Injury, Fall
    accident_time = Column(String(32), nullable=False)
    location = Column(String(255), nullable=False)
    police_station = Column(String(128), nullable=True)
    police_report_ref = Column(String(64), nullable=False)  # FIR / GD Entry Number
    investigating_officer = Column(String(128), nullable=True)
    injury_details = Column(Text, nullable=False)
    bleeding_status = Column(String(64), nullable=True)
    emergency_observations = Column(Text, nullable=True)
    treatment_administered = Column(Text, nullable=True)
    imaging_findings = Column(Text, nullable=True)
    discharge_status = Column(String(64), default="Admitted for Observation")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="accident_records")

class EmergencyAccessLog(Base):
    __tablename__ = "emergency_access_logs"

    id = Column(String(64), primary_key=True)  # e.g. BRK-001
    doctor_id = Column(String(64), nullable=False)
    doctor_name = Column(String(128), nullable=False)
    hospital_id = Column(String(64), nullable=False)
    patient_mrn = Column(String(64), nullable=False)
    reason = Column(Text, nullable=False)
    access_scope = Column(String(64), default="ACCIDENT_EMERGENCY_ONLY")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(32), default="AUTHORIZED_BREAK_GLASS")

class RecordVersion(Base):
    __tablename__ = "record_versions"

    id = Column(String(64), primary_key=True)  # e.g. VER-001
    record_type = Column(String(64), nullable=False)  # EHR_CHART, CASE_SHEET, ACCIDENT_RECORD
    record_id = Column(String(64), nullable=False)    # e.g. MRN-1002, CS-1001
    version_number = Column(Integer, nullable=False)
    snapshot_data = Column(JSON, nullable=False)
    canonical_hash = Column(String(64), nullable=False)
    created_by = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    change_summary = Column(String(255), nullable=False)

class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    code = Column(String(32), nullable=False)  # ICD-10 Code
    description = Column(String(255), nullable=False)
    status = Column(String(32), default="CONFIRMED")  # CONFIRMED, SUSPECTED, RESOLVED

    encounter = relationship("Encounter", back_populates="diagnoses")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    name = Column(String(128), nullable=False)
    dosage = Column(String(64), nullable=False)
    frequency = Column(String(128), nullable=False)
    route = Column(String(64), default="Oral")
    duration = Column(String(64), nullable=True)

    encounter = relationship("Encounter", back_populates="medications")

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    encounter_id = Column(String(64), ForeignKey("encounters.id"), nullable=False)
    test_type = Column(String(64), default="Laboratory")  # Laboratory, Imaging, Pathology, TumorMarker
    test_name = Column(String(128), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)
    reference_range = Column(String(64), nullable=False)
    interpretation = Column(String(32), default="NORMAL")  # NORMAL, HIGH, LOW, CRITICAL
    report_attachment = Column(String(255), nullable=True)

    encounter = relationship("Encounter", back_populates="lab_results")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True)
    patient_mrn = Column(String(64), ForeignKey("patients.mrn"), nullable=False)
    uploader_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    document_type = Column(String(64), nullable=False)  # CBC, Prescription, DischargeSummary, Radiology, AccidentDoc
    extraction_status = Column(String(32), default="PENDING")  # PENDING, EXTRACTED, APPROVED
    extracted_data = Column(JSON, nullable=True)
    approved_by = Column(String(64), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="documents")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False)
    patient_mrn = Column(String(64), nullable=True, index=True)
    hospital_id = Column(String(64), nullable=True)
    resource_id = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False)  # SUCCESS, DENIED, ERROR
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    details = Column(JSON, nullable=True)

# Database Session Setup
DEFAULT_DB_PATH = Path(__file__).resolve().parent / "medsecure.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    print("MedSecure Database initialized successfully with extended enterprise clinical tables.")

if __name__ == "__main__":
    init_db()
