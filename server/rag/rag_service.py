import uuid
from typing import List

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

VECTOR_DB_PATH = "./chroma_db"

class RAGService:
    def __init__(
            self,
            collection_name: str = "patient_notes",
            persist_directory: str = VECTOR_DB_PATH,
            hf_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        self.embeddings = HuggingFaceEmbeddings(
            model_name=hf_model_name
        )

        self.vectorstore = Chroma(
            collection_name=collection_name,
            persist_directory=persist_directory,
            embedding_function=self.embeddings
        )

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def upsert_patient_note(
        self,
        patient_serial: str,
        note_summary: str
    ):
        print(f"Upserting patient note for patient {patient_serial}...")

        self.delete_patient_note(patient_serial=patient_serial)

        return self.add_patient_note(patient_serial=patient_serial, note_summary=note_summary)

    def get_patient_overview(
        self,
        patient_serial: str,
        k: int = 6
    ) -> List[str]:
        query = f"patient medical overview for patient {patient_serial}"

        docs = self.vectorstore.similarity_search(
            query=query,
            filter={"patient_serial": patient_serial},
            k=k,
        )

        return [doc.page_content for doc in docs]
    
    def add_patient_note(
        self,
        patient_serial: str,
        note_summary: str
    ) -> List[str]:
        chunks = self.splitter.split_text(note_summary)

        if not chunks:
            print(f"Warning: Note for patient {patient_serial} resulted in no chunks.")
            return []

        ids = [f"{patient_serial}_{uuid.uuid4()}" for _ in chunks]

        self.vectorstore.add_texts(
            texts=chunks,
            metadatas=[{"patient_serial": patient_serial}] * len(chunks),
            ids=ids
        )

        print(f"Successfully added {len(chunks)} chunks for patient {patient_serial}.")

        return ids

    def delete_patient_note(self, patient_serial: str) -> bool:    
        try:
            result = self.vectorstore.delete(
                where={"patient_serial": patient_serial}
            )

            print(f"Deletion result for patient {patient_serial}: {result}")
            
            return True
        except Exception as e:
            print(f"Error deleting data for patient {patient_serial}: {e}")

            return False
