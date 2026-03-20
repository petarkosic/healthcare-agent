from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import patients
from routers import agents
from utils.langfuse_client import langfuse


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    langfuse.flush()


origins = [
    "http://localhost:8080",
    "http://localhost:3000",
]

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router, prefix="/api")
app.include_router(agents.router, prefix="/api")