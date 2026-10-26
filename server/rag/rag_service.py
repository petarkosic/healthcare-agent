import os
from typing import List

import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langfuse import observe

VECTOR_DB_PATH = "./chroma_db"

CHROMA_HOST = os.getenv("CHROMA_HOST")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))


class RAGService:
    def __init__(
        self,
        collection_name: str = "patient_notes",
        persist_directory: str = VECTOR_DB_PATH,
    ):
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        if CHROMA_HOST:
            chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
            self.vectorstore = Chroma(
                client=chroma_client,
                collection_name=collection_name,
                embedding_function=embeddings,
            )
        else:
            self.vectorstore = Chroma(
                collection_name=collection_name,
                persist_directory=persist_directory,
                embedding_function=embeddings,
            )

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

        self._reranker = None  # lazy-loaded - see _get_reranker

    def _get_reranker(self):
        """Loaded on first use, not at import/startup, to keep baseline memory low
        on small instances."""
        if self._reranker is None:
            from sentence_transformers import CrossEncoder
            self._reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")
            
        return self._reranker

    @observe(as_type="span")
    def add_patient_note(
        self, patient_serial: str, note_id: str, note_summary: str, record_date: str
    ) -> List[str]:
        """Insert-only: chunk ids are deterministic (patient+note+chunk index), so
        re-saving the same note_id overwrites only that note's own chunks."""
        chunks = self.splitter.split_text(note_summary)

        if not chunks:
            print(f"Warning: Note for patient {patient_serial} resulted in no chunks.")
            return []

        ids = [f"{patient_serial}_{note_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "patient_serial": patient_serial,
                "source_type": "note",
                "note_id": note_id,
                "record_date": record_date,
            }
            for _ in chunks
        ]

        self.vectorstore.add_texts(texts=chunks, metadatas=metadatas, ids=ids)

        print(f"Indexed {len(chunks)} chunks for patient {patient_serial}, note {note_id}.")

        return ids

    @observe(as_type="span")
    def add_chief_complaint(
        self, patient_serial: str, visit_id: str, chief_complaint: str, record_date: str
    ) -> List[str]:
        if not chief_complaint or not chief_complaint.strip():
            return []

        ids = [f"{patient_serial}_{visit_id}_cc"]
        metadatas = [{
            "patient_serial": patient_serial,
            "source_type": "chief_complaint",
            "note_id": visit_id,
            "record_date": record_date,
        }]

        self.vectorstore.add_texts(texts=[chief_complaint], metadatas=metadatas, ids=ids)

        return ids

    @observe(as_type="retriever")
    def get_latest_note_chunks(self, patient_serial: str) -> List[str]:
        """Explicit metadata filter + sort - not a similarity search - so 'latest'
        is a deliberate query, not an accident of the store only holding one note."""
        results = self.vectorstore._collection.get(
            where={"$and": [{"patient_serial": patient_serial}, {"source_type": "note"}]},
            include=["documents", "metadatas"],
        )

        if not results["ids"]:
            return []

        paired = list(zip(results["documents"], results["metadatas"]))
        latest_note_id = max(paired, key=lambda p: p[1]["record_date"])[1]["note_id"]

        return [doc for doc, meta in paired if meta["note_id"] == latest_note_id]

    @observe(as_type="retriever")
    def search_notes(self, patient_serial: str, query: str, k: int = 10) -> List[dict]:
        docs = self.vectorstore.similarity_search(
            query=query,
            filter={"$and": [{"patient_serial": patient_serial}, {"source_type": {"$in": ["note", "chief_complaint"]}}]},
            k=k,
        )

        if not docs:
            return []

        reranker = self._get_reranker()
        pairs = [[query, doc.page_content] for doc in docs]
        scores = reranker.predict(pairs)

        ranked = sorted(zip(docs, scores), key=lambda pair: pair[1], reverse=True)[:4]

        results = [
            {"content": doc.page_content, "record_date": doc.metadata["record_date"]}
            for doc, _ in ranked
        ]

        return sorted(results, key=lambda r: r["record_date"])


rag_service = RAGService()
