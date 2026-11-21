"""
MedSecure AI: Cryptographic Ledger & Tamper-Evident Integrity Tests (M5)
Validates:
- Genesis block construction
- Canonical deterministic hashing of JSON records
- Cryptographic hash-chain continuity
- Detection of out-of-band record tampering
"""

import json
from blockchain.ledger import MedicalLedger, ImmutableLedgerBlock

def test_ledger_genesis_and_chain():
    ledger = MedicalLedger()
    assert len(ledger.chain) == 1
    assert ledger.chain[0].record_id == "GENESIS"
    assert ledger.verify_chain_integrity() is True

def test_canonical_hash_invariance_to_key_ordering():
    data1 = {"mrn": "MRN-101", "name": "Alice", "hba1c": 6.8}
    data2 = {"name": "Alice", "hba1c": 6.8, "mrn": "MRN-101"}
    h1 = MedicalLedger.canonical_hash(data1)
    h2 = MedicalLedger.canonical_hash(data2)
    assert h1 == h2

def test_ledger_tamper_detection():
    ledger = MedicalLedger()
    clean_record = {
        "mrn": "MRN-550",
        "diagnosis": "Atrial Fibrillation",
        "medication": "Warfarin 5mg"
    }
    block = ledger.commit_record(record_id="MRN-550", version=1, record_data=clean_record)
    assert block.index == 1
    assert ledger.verify_chain_integrity() is True

    # 1. Verification of untouched record passes
    res_clean = ledger.verify_record_integrity("MRN-550", clean_record)
    assert res_clean["verified"] is True
    assert res_clean["status"] == "VERIFIED"

    # 2. Unauthorized modification triggers TAMPER_DETECTED
    tampered_record = dict(clean_record)
    tampered_record["medication"] = "Warfarin 100mg" # Malicious dosage alteration
    res_tampered = ledger.verify_record_integrity("MRN-550", tampered_record)
    assert res_tampered["verified"] is False
    assert res_tampered["status"] == "TAMPER_DETECTED"
    assert "actual_hash" in res_tampered
    assert "expected_hash" in res_tampered
    assert res_tampered["actual_hash"] != res_tampered["expected_hash"]

def test_blockchain_corrupted_link():
    ledger = MedicalLedger()
    ledger.commit_record("REC-1", 1, {"data": "A"})
    ledger.commit_record("REC-2", 1, {"data": "B"})
    assert ledger.verify_chain_integrity() is True

    # Corrupt block hash directly
    ledger.chain[1].record_hash = "corrupted_hash_value"
    assert ledger.verify_chain_integrity() is False
