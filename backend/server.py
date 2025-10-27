"""
FastAPI backend server for See&Say Application
Uses external MongoDB manager from storage_manager.py
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging
import os
from dotenv import load_dotenv

# ✅ Import your existing storage manager
from MongoDB import SeeSayMongoStorage


from fastapi.middleware.cors import CORSMiddleware




# ------------------------------------------------------
# Setup
# ------------------------------------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongodb_url = os.environ.get("MONGODB_URL")
database_name = os.environ.get("DATABASE_NAME")

# Initialize MongoDB storage manager
storage = SeeSayMongoStorage(mongodb_url, database_name)

# FastAPI setup
app = FastAPI(title="See&Say Backend")

# Allow all origins (for testing; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # or ["https://yourfrontend.com"]
    allow_credentials=True,
    allow_methods=["*"],       # GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)


# Request Models
class CreateUserRequest(BaseModel):
    userId: str
    userName: Optional[str] = None
    ageYears: int
    ageMonths: int

class AddTestRequest(BaseModel):
    userId: str
    correct: Optional[int] = None
    partly: Optional[int] = None
    errors: Optional[int] = None
    audioFile: str
    finalEvaluation: str




# Routes
@app.get("/")
def home():
    return {"message": "✅ Hello from See&Say FastAPI backend"}

@app.post("/api/createUser")
def create_user(user: CreateUserRequest):
    success = storage.add_user(
        user_id=user.userId,
        user_name=user.userName,
        age_years=user.ageYears,
        age_months = user.ageMonths
    )

    if not success:
        raise HTTPException(status_code=400, detail="User already exists or could not be added")
    user = storage.get_user_config(user.userId)
    return {"success": True, "user": user}

@app.post("/api/addTestToUser")
def add_test(test: AddTestRequest):
    success = storage.add_test_to_user(
        user_id=test.userId,
        correct=test.correct,
        partly=test.partly,
        errors=test.errors,
        audio_file=test.audioFile,
        final_evaluation=test.finalEvaluation
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found or exam not added")
    user = storage.get_user_config(test.userId)
    return {"success": True, "user": user}

@app.get("/api/getUser/{user_id}")
def get_user(user_id: str):
    user = storage.get_user_config(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": user}
