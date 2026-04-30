import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import agents, auth, patients
from utils.langfuse_client import langfuse


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    langfuse.flush()


origins = [
    "http://localhost:8080",
    "http://localhost:3000",
]

extra = os.getenv("ALLOWED_ORIGINS", "")

if extra:
    origins.extend(o.strip() for o in extra.split(",") if o.strip())

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
app.include_router(auth.router, prefix="/api")