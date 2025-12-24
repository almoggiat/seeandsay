"""
FastAPI backend server for See&Say Application
Uses external MongoDB manager from storage_manager.py
"""

from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import logging
import os
from dotenv import load_dotenv

# ✅ Import your existing storage manager
from MongoDB import SeeSayMongoStorage


from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks

from typing import Optional

from AI_Models_API import * ## NEW LINE

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



class CreateUserRequest(BaseModel):
    userId: int
    userName: Optional[str] = None


class AddTestRequest(BaseModel):
    userId: int
    ageYears: int
    ageMonths: int
    fullArray: list # Can be changed to List[int]
    correct: Optional[int] = None
    partly: Optional[int] = None
    wrong: Optional[int] = None
    audioFile64: str
    timestamps: list

class SpeakerVerificationRequest(BaseModel):
    userId: int
    audioFile64:str
    # returns {"success": True, "parent_speaker": parent_speaker}





# Routes
@app.get("/")
def home():
    return {"message": "✅ Hello from See&Say FastAPI backend"}

@app.post("/api/createUser")
def create_user(user: CreateUserRequest):
    logger.warning(f"Received user creation: {user.dict()}")
    success = storage.add_user(
        user_id=user.userId,
        user_name=user.userName
    )

    if not success:
        raise HTTPException(status_code=400, detail="User already exists or could not be added")
    user = storage.get_user_config(user.userId)
    return {"success": True, "user": user}

@app.post("/api/addTestToUser")
def add_test(test: AddTestRequest):
    logger.warning(f"Received user test: {test.userId}")

    updated_transcription = speaker_verification(test.audioFile64)

    success = storage.add_test_to_user(
        user_id=test.userId,
        age_years=test.ageYears,
        age_months=test.ageMonths,
        full_array=test.fullArray,
        correct=test.correct,
        partly=test.partly,
        wrong=test.wrong,
        audio_file_base64=test.audioFile64,
        updated_transcription=updated_transcription,
        timestamps=test.timestamps
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found or exam not added")
    user = storage.get_user_config(test.userId)
    return {"success": True, "user": user}




## SPEAKER VALIDATION

# -------------------------------
# Speaker Verification Background Task
# -------------------------------
def run_speaker_verification(user_id: int, audio_base64: str):
    """Run verification and update MongoDB with final True/False."""
    collection = storage.db["speaker_verification_results"]

    # Insert placeholder with 'processing'
    doc_id = collection.insert_one({
        "userId": user_id,
        "success": "processing",  # <-- 3-state: processing / True / False
        "parent_speaker": None,
        "updated_transcription": None
    }).inserted_id

    try:
        res = speaker_verification(audio_base64)
        collection.update_one(
            {"_id": doc_id},
            {"$set": {
                "success": res["success"],  # True / False after completion
                "parent_speaker": res["parent_speaker"],
                "updated_transcription": res["updated_transcription"]
            }}
        )
    except Exception as e:
        logger.error(f"Speaker verification failed: {e}")
        collection.update_one({"_id": doc_id}, {"$set": {"success": False}})


# -------------------------------
# POST /api/VerifySpeaker ---> Receives New Requests
# -------------------------------
@app.post("/api/VerifySpeaker")
def verify_speaker_endpoint(data: SpeakerVerificationRequest, background_tasks: BackgroundTasks):
    """
    Immediately return processing.
    Background task will update MongoDB with True/False later.
    """
    logger.warning(f"Received speaker verification request for user: {data.userId}")
    background_tasks.add_task(run_speaker_verification, data.userId, data.audioFile64)
    return {"success": "processing", "parent_speaker": None}

# -------------------------------
# GET verification result
# -------------------------------
@app.get("/api/VerifySpeaker/{user_id}")
def get_verification_result(user_id: int):
    """
    Frontend can poll this endpoint to get:
    - success = "processing" → still running
    - success = True / False → task completed
    """
    collection = storage.db["speaker_verification_results"]
    doc = collection.find_one({"userId": user_id}, sort=[("_id", -1)])
    if not doc:
        raise HTTPException(status_code=404, detail="No verification found for this user")

    return {
        "success": doc.get("success", "processing"),
        "parent_speaker": doc.get("parent_speaker"),
        "updated_transcription": doc.get("updated_transcription", "")
    }


