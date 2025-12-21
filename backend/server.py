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


# def base64_to_audio_file(base64_string: str, output_dir: str = "recordings", user_id: Optional[int] = None) -> str:
#     """
#     Converts a base64-encoded audio string to a playable MP3 file.
#
#     Args:
#         base64_string: The base64 string (e.g., "data:audio/mpeg;base64,UklGRi...")
#         output_dir: Directory to save the audio file (default: "recordings")
#         user_id: Optional user ID to include in filename
#
#     Returns:
#         str: Full path to the saved audio file
#
#     Raises:
#         ValueError: If base64_string is invalid
#         IOError: If file cannot be written
#     """
#     try:
#         # Split the data URL to get just the base64 part
#         if "," in base64_string:
#             header, encoded = base64_string.split(",", 1)
#         else:
#             encoded = base64_string
#
#         # Decode base64 string to bytes
#         audio_bytes = base64.b64decode(encoded)
#
#         # Create output directory if it doesn't exist
#         os.makedirs(output_dir, exist_ok=True)
#
#         # Generate unique filename with timestamp
#         timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
#         user_part = f"{user_id}_" if user_id else ""
#         filename = f"recording_{user_part}{timestamp}.mp3"
#         file_path = os.path.join(output_dir, filename)
#
#         # Write bytes to file
#         with open(file_path, "wb") as f:
#             f.write(audio_bytes)
#
#         print(f"✅ Audio file saved: {file_path} ({len(audio_bytes):,} bytes)")
#         return file_path
#
#     except Exception as e:
#         raise ValueError(f"Failed to convert base64 to audio file: {e}")



# Request Models
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




@app.post("/api/VerifySpeaker")
def verify_speaker(data: SpeakerVerificationRequest):
    logger.warning(f"Received speaker verification request for user: {data.userId}")

    verification_result= speaker_verification(data.audioFile64)


    if not verification_result["success"]:
        raise HTTPException(
            status_code=404,
            detail="Unable to run backend verification"
        )
    return {
        "success": True,
        "parent_speaker": verification_result["parent_speaker"]
    }



# # ADD TO apiToMongo.js --> after Almog makes clean project.
# async function verifySpeaker(userId, audioFile64) {
#   const url = "https://seeandsay-backend.onrender.com/api/VerifySpeaker";
#
#   try {
#     const response = await fetch(url, {
#       method: "POST",
#       headers: { "Content-Type": "application/json" },
#       body: JSON.stringify({
#         userId: userId,
#         audioFile64: audioFile64
#       }),
#     });
#
#     // Backend returned an error → verification failed
#     if (!response.ok) {
#       const errorText = await response.text();
#       throw new Error(`Verification failed (${response.status}): ${errorText}`);
#     }
#
#     // Wait for backend JSON response
#     const result = await response.json();
#
#     if (result.success === true) {
#       console.log("✅ Speaker verification successful");
#       console.log("👤 Parent speaker:", result.parent_speaker);
#       return {
#         success: true,
#         parentSpeaker: result.parent_speaker
#       };
#     } else {
#       console.warn("⚠️ Verification returned success=false");
#       return { success: false };
#     }
#
#   } catch (err) {
#     console.error("❌ Speaker verification error:", err);
#     return { success: false, error: err.message };
#   }
# }



# Not In Use
# @app.get("/api/getUser/{user_id}")
# def get_user(user_id: str):
#     user = storage.get_user_config(user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return {"success": True, "user": user}


