import os

from dotenv import load_dotenv
from langfuse.openai import OpenAI

load_dotenv()

openai_client = OpenAI(
    api_key=os.getenv("API_KEY"),
    base_url=os.getenv("BASE_URL"),
)
