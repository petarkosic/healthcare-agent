import uuid
from typing import List

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

VECTOR_DB_PATH = "./chroma_db"

class RAGService:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        self.vectorstore = Chroma(
            persist_directory=VECTOR_DB_PATH,
            embedding_function=self.embeddings
        )

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=100
        )

    def upsert_patient_note(
        self,
        patient_id: str,
        note_summary: str
    ):
        chunks = self.splitter.split_text(note_summary)

        ids = [
            f"{patient_id}_{uuid.uuid4()}"
            for _ in chunks
        ]

        self.vectorstore.add_texts(
            texts=chunks,
            metadatas=[{"patient_id": patient_id}] * len(chunks),
            ids=ids
        )

        self.vectorstore.persist()

    def get_patient_overview(
        self,
        patient_id: str,
        k: int = 6
    ) -> List[str]:
        docs = self.vectorstore.similarity_search(
            query="patient medical overview",
            filter={"patient_id": patient_id},
            k=k
        )

        return [doc.page_content for doc in docs]
