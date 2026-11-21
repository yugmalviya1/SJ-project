"""
MedSecure AI: Authorization-Scoped RAG Engine (M6)
Security Rule:
    User -> Authorization Check -> Filter Authorized Documents -> Dense Vector Retrieval -> Grounded Generation
Prevents Cross-Patient and Unauthorized Information Leakage.
"""

import re
import hashlib
from typing import List, Dict, Any, Optional
import numpy as np

class ScopedMedicalRAG:
    """
    Simulates a secure vector store indexing chunked medical documents with strict metadata filters.
    """
    def __init__(self):
        # In-memory document chunks: {chunk_id, patient_mrn, document_id, text, embedding}
        self.knowledge_store: List[Dict[str, Any]] = []

    def _generate_dense_embedding(self, text: str) -> np.ndarray:
        """
        Lightweight deterministic semantic representation for clinical terms.
        Uses deterministic md5 feature hashing with stopword filtration.
        """
        stopwords = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "with", "was", "is", "were", "it", "what", "how", "when", "where", "why", "who"}
        vec = np.zeros(384, dtype=np.float32)
        words = [w for w in re.findall(r"\b\w+\b", text.lower()) if w not in stopwords]
        if not words:
            words = re.findall(r"\b\w+\b", text.lower())
        for w in words:
            digest = hashlib.md5(w.encode("utf-8")).hexdigest()
            idx = int(digest[:8], 16) % 384
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def index_document(self, patient_mrn: str, document_id: str, text: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Chunks and indexes document content under a strict patient_mrn partition.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text]

        for idx, para in enumerate(paragraphs):
            embedding = self._generate_dense_embedding(para)
            self.knowledge_store.append({
                "chunk_id": f"{document_id}_chk_{idx}",
                "patient_mrn": patient_mrn,
                "document_id": document_id,
                "text": para,
                "metadata": metadata or {},
                "embedding": embedding
            })

    def query(self, query_text: str, authorized_mrns: List[str], top_k: int = 3) -> Dict[str, Any]:
        """
        Crucial Security Property:
        Retrieval happens ONLY on records whose patient_mrn is inside `authorized_mrns`.
        """
        query_vec = self._generate_dense_embedding(query_text)

        # 1. Enforce Authorization Partition Filtering FIRST
        authorized_chunks = [
            chunk for chunk in self.knowledge_store
            if chunk["patient_mrn"] in authorized_mrns
        ]

        if not authorized_chunks:
            return {
                "answer": "No authorized clinical documentation available for the specified query and permissions.",
                "citations": [],
                "authorized_mrns_checked": authorized_mrns
            }

        # 2. Similarity scoring over authorized subset
        scored_chunks = []
        for chunk in authorized_chunks:
            sim = float(np.dot(query_vec, chunk["embedding"]))
            if sim > 0.05:  # Relevance threshold
                scored_chunks.append((sim, chunk))

        if not scored_chunks:
            return {
                "query": query_text,
                "answer": "No authorized clinical documentation available for the specified query and permissions.",
                "citations": [],
                "retrieval_status": "NO_RELEVANT_MATCHES"
            }

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = scored_chunks[:top_k]

        citations = []
        context_snippets = []
        for sim, chunk in top_chunks:
            snippet_text = chunk["text"] if len(chunk["text"]) <= 280 else chunk["text"][:280] + "..."
            citations.append({
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "patient_mrn": chunk["patient_mrn"],
                "score": round(sim, 4),
                "snippet": snippet_text
            })
            context_snippets.append(chunk["text"])

        # 3. Grounded Clinical Response Formulation
        synthesis = f"Based on authorized clinical records: " + " ".join(context_snippets)

        return {
            "query": query_text,
            "answer": synthesis,
            "citations": citations,
            "retrieval_status": "AUTHORIZED_ACCESS_GRANTED"
        }

if __name__ == "__main__":
    rag = ScopedMedicalRAG()
    # Patient A records
    rag.index_document("MRN-101", "DOC-001", "Patient diagnosed with Type 2 Diabetes. Started Metformin 500mg BID.")
    # Patient B records
    rag.index_document("MRN-202", "DOC-002", "Patient diagnosed with Hypertension. Blood pressure 145/92 mmHg.")

    # Doctor authorized for Patient A queries
    res_a = rag.query("What is the diabetes treatment plan?", authorized_mrns=["MRN-101"])
    print("Doctor query on Patient A:")
    print(" - Answer:", res_a["answer"][:80], "...")
    print(" - Citations count:", len(res_a["citations"]))

    # Doctor attempts to query Patient B's diagnosis without authorization
    res_unauth = rag.query("What is the blood pressure history?", authorized_mrns=["MRN-101"])
    print("\nDoctor query without Patient B authorization:")
    print(" - Citations returned:", len(res_unauth["citations"]))
    print(" - Status:", res_unauth.get("retrieval_status", "BLOCKED"))
