from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import patients
from routers import agents

origins = [
    "http://localhost:8080",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router, prefix="/api")
app.include_router(agents.router, prefix="/api")