import os

from dotenv import load_dotenv
from langfuse.openai import OpenAI

load_dotenv()

LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "gemini-3.1-flash-lite")

openai_client = OpenAI(
    api_key=os.getenv("API_KEY"),
    base_url=os.getenv("BASE_URL"),
    timeout=30.0,
    max_retries=1,
)
