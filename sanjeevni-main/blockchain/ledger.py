import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

class ImmutableLedgerBlock:
    """
    Represents a tamper-evident audit entry in the permissioned medical ledger.
    """
    def __init__(self, index: int, record_id: str, version: int, record_hash: str, previous_hash: str, timestamp: Optional[str] = None):
        self.index = index
        self.record_id = record_id
        self.version = version
        self.record_hash = record_hash
        self.previous_hash = previous_hash
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        self.block_hash = self.compute_block_hash()

    def compute_block_hash(self) -> str:
        payload = f"{self.index}:{self.record_id}:{self.version}:{self.record_hash}:{self.previous_hash}:{self.timestamp}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "record_id": self.record_id,
            "version": self.version,
            "record_hash": self.record_hash,
            "previous_hash": self.previous_hash,
            "timestamp": self.timestamp,
            "block_hash": self.block_hash
        }

class MedicalLedger:
    """
    Lightweight, verifiable permissioned ledger for electronic health record integrity.
    Does NOT store raw medical data; anchors cryptographically canonical SHA-256 hashes.
    """
    def __init__(self, storage_path: Optional[str] = None):
        self.chain: List[ImmutableLedgerBlock] = []
        self.storage_path = storage_path
        if self.storage_path and os.path.exists(self.storage_path):
            self._load_from_storage()
        else:
            self._create_genesis_block()
            if self.storage_path:
                self._save_to_storage()

    def _create_genesis_block(self):
        genesis = ImmutableLedgerBlock(
            index=0,
            record_id="GENESIS",
            version=0,
            record_hash="0" * 64,
            previous_hash="0" * 64,
            timestamp="2026-01-01T00:00:00Z"
        )
        self.chain.append(genesis)

    def _save_to_storage(self):
        if not self.storage_path:
            return
        os.makedirs(os.path.dirname(os.path.abspath(self.storage_path)), exist_ok=True)
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump([b.to_dict() for b in self.chain], f, indent=2)

    def _load_from_storage(self):
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            self.chain = []
            for b in raw_data:
                block = ImmutableLedgerBlock(
                    index=b["index"],
                    record_id=b["record_id"],
                    version=b["version"],
                    record_hash=b["record_hash"],
                    previous_hash=b["previous_hash"],
                    timestamp=b.get("timestamp")
                )
                self.chain.append(block)
        except Exception:
            self.chain = []
            self._create_genesis_block()

    @staticmethod
    def canonical_hash(data: Dict[str, Any]) -> str:
        """
        Creates a deterministic SHA-256 digest by normalizing JSON keys alphabetically
        and removing variable whitespace.
        """
        canonical_json = json.dumps(data, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

    def commit_record(self, record_id: str, version: int, record_data: Dict[str, Any]) -> ImmutableLedgerBlock:
        previous_block = self.chain[-1]
        record_hash = self.canonical_hash(record_data)
        new_block = ImmutableLedgerBlock(
            index=len(self.chain),
            record_id=record_id,
            version=version,
            record_hash=record_hash,
            previous_hash=previous_block.block_hash
        )
        self.chain.append(new_block)
        if self.storage_path:
            self._save_to_storage()
        return new_block

    def verify_record_integrity(self, record_id: str, current_record_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verifies whether the current database state of a record matches its ledger anchor.
        """
        # Find latest block for this record
        matching_blocks = [b for b in self.chain if b.record_id == record_id]
        if not matching_blocks:
            return {"status": "NOT_FOUND", "verified": False, "message": "Record has no anchor in the ledger."}

        latest_block = matching_blocks[-1]
        current_hash = self.canonical_hash(current_record_data)

        if current_hash == latest_block.record_hash:
            return {
                "status": "VERIFIED",
                "verified": True,
                "record_id": record_id,
                "version": latest_block.version,
                "hash": current_hash,
                "message": "Integrity confirmed. Data matches cryptographic ledger anchor."
            }
        else:
            return {
                "status": "TAMPER_DETECTED",
                "verified": False,
                "record_id": record_id,
                "version": latest_block.version,
                "expected_hash": latest_block.record_hash,
                "actual_hash": current_hash,
                "message": "WARNING: Cryptographic integrity failure! Record has been modified out-of-band."
            }

    def verify_chain_integrity(self) -> bool:
        """
        Verifies the internal cryptographic continuity of the entire blockchain ledger.
        """
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.previous_hash != prev.block_hash:
                return False
            if curr.block_hash != curr.compute_block_hash():
                return False
        return True

if __name__ == "__main__":
    ledger = MedicalLedger()
    print("Ledger Initialized. Genesis Block Hash:", ledger.chain[0].block_hash)

    # Simulate inserting medical record
    medical_record_v1 = {
        "mrn": "MRN-1002",
        "patient": "Rahul Sharma",
        "diagnosis": "Type 2 diabetes",
        "hba1c": 7.2
    }
    block = ledger.commit_record("REC-401", version=1, record_data=medical_record_v1)
    print(f"Committed Record REC-401 (v1). Block #{block.index}, Hash: {block.record_hash[:16]}...")

    # Legitimate verification
    result = ledger.verify_record_integrity("REC-401", medical_record_v1)
    print(f"Verification 1 (Clean): Status={result['status']}, Verified={result['verified']}")

    # Simulate attack: Unauthorized database modification
    tampered_record = dict(medical_record_v1)
    tampered_record["hba1c"] = 5.4  # attacker tampered with test result
    tamper_result = ledger.verify_record_integrity("REC-401", tampered_record)
    print(f"Verification 2 (Tampered): Status={tamper_result['status']}, Verified={tamper_result['verified']}")
    print(f"Tamper Alert Message: {tamper_result['message']}")
