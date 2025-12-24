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
# Speaker Verification Background Task (2)
# -------------------------------
def submit_speechmatics_job(user_id: int, audio_base64: str):
    """
    Submit the audio to Speechmatics without blocking.
    Store MongoDB doc with 'processing' status and job_id.
    """
    collection = storage.db["speaker_verification_results"]
    audio_bytes = decode_base64_to_bytes(audio_base64)

    # Submit job (non-blocking)
    from speechmatics.models import ConnectionSettings
    from speechmatics.batch_client import BatchClient
    import os

    SPEECHMATICS_API_KEY = os.environ.get("SPEECHMATICS_API_KEY")
    LANGUAGE = "he"

    settings = ConnectionSettings(
        url="https://asr.api.speechmatics.com/v2",
        auth_token=SPEECHMATICS_API_KEY,
    )

    conf = {
        "type": "transcription",
        "transcription_config": {
            "language": LANGUAGE,
            "operating_point": "enhanced",
            "diarization": "speaker",
            "speaker_diarization_config": {
                "speaker_sensitivity": 0.3,
                "prefer_current_speaker": True,
                "get_speakers": True,
            },
            "enable_entities": False,
        },
    }

    with BatchClient(settings) as client:
        job_id = client.submit_job(audio_bytes, transcription_config=conf)

    # Insert placeholder in MongoDB
    doc_id = collection.insert_one({
        "userId": user_id,
        "success": "processing",   # <-- 3-state: processing / True / False
        "parent_speaker": None,
        "updated_transcription": None,
        "job_id": job_id
    }).inserted_id

    # Start polling in background (non-blocking)
    poll_speechmatics_job.delay(user_id, doc_id, job_id)  # Using async / separate thread

def poll_speechmatics_job(user_id: int, doc_id, job_id):
    """
    Poll Speechmatics job asynchronously without blocking FastAPI.
    Update MongoDB when done.
    """
    import time
    from speechmatics.batch_client import BatchClient
    from speechmatics.models import ConnectionSettings
    SPEECHMATICS_API_KEY = os.environ.get("SPEECHMATICS_API_KEY")
    LANGUAGE = "he"

    settings = ConnectionSettings(
        url="https://asr.api.speechmatics.com/v2",
        auth_token=SPEECHMATICS_API_KEY,
    )

    with BatchClient(settings) as client:
        while True:
            job_status = client.get_job_status(job_id)
            if job_status == "done":
                transcript = client.get_transcription(job_id, transcription_format="txt")
                result = speaker_recognition(transcript)

                # Update MongoDB
                storage.db["speaker_verification_results"].update_one(
                    {"_id": doc_id},
                    {"$set": {
                        "success": result["success"],
                        "parent_speaker": result["parent_speaker"],
                        "updated_transcription": result["updated_transcription"]
                    }}
                )
                break
            elif job_status == "failed":
                storage.db["speaker_verification_results"].update_one(
                    {"_id": doc_id},
                    {"$set": {"success": False}}
                )
                break
            else:
                # still processing, wait before next poll
                time.sleep(15)

# -------------------------------
# POST /api/VerifySpeaker
# -------------------------------
@app.post("/api/VerifySpeaker")
def verify_speaker_endpoint(data: SpeakerVerificationRequest, background_tasks: BackgroundTasks):
    """
    Immediately return 'processing'.
    Background task will submit Speechmatics job and poll asynchronously.
    """
    logger.warning(f"Received speaker verification request for user: {data.userId}")
    collection = storage.db["speaker_verification_results"]

    # Insert placeholder immediately
    doc_id = collection.insert_one({
        "userId": data.userId,
        "success": "processing",
        "parent_speaker": None,
        "updated_transcription": None
    }).inserted_id

    background_tasks.add_task(submit_speechmatics_job, data.userId, data.audioFile64)
    return {"success": "processing", "parent_speaker": None}

# -------------------------------
# GET /api/VerifySpeaker/{user_id}
# -------------------------------
@app.get("/api/VerifySpeaker/{user_id}")
def get_verification_result(user_id: int):
    """
    Frontend can poll this endpoint to get:
    - success = 'processing' → still running
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