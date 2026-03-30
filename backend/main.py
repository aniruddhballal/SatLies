import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import orbit, mission, ground

app = FastAPI(title="SatLies API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orbit.router, prefix="/api/orbit", tags=["orbit"])
app.include_router(mission.router, prefix="/api/mission", tags=["mission"])
app.include_router(ground.router, prefix="/api/ground", tags=["ground"])


@app.get("/")
def root():
    return {"status": "SatLies API is running"}