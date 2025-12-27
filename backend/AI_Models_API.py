
from openai import OpenAI

from speechmatics.models import ConnectionSettings
from speechmatics.batch_client import BatchClient
from httpx import HTTPStatusError

import os
from dotenv import load_dotenv
import tempfile
import logging
import re
import base64

#from server import *


load_dotenv()
# OPENAI_API_KEY = os.environ.get("OPENAI_KEY")
OPENAI_LINKCARRING_API_KEY = os.environ.get("OPENAI_LINKCARRING_KEY")
SPEECHMATICS_API_KEY= os.environ.get("SPEECHMATICS_API_KEY")


openAI_client = OpenAI(api_key= OPENAI_LINKCARRING_API_KEY)




# NOT IN USE
# def openai_whisper_runner(audioFilePath):
#     audio_file = open(audioFilePath, "rb")
#
#     transcription = openAI_client.audio.transcriptions.create(
#         model="whisper-1",
#         file=audio_file
#     )
#
#     print(transcription.text)
#     return transcription.text

#  NOT IN USE
# def openai_llm_runner(prompt, model, user_input):
#     # Format the prompt dynamically
#     full_prompt = prompt.format(user_input=user_input)
#
#     result = openAI_client.responses.create(
#         model=model,
#         input=full_prompt,
#     ).output_text
#
#     return result

def decode_base64_to_bytes(base64_audio):
    if not base64_audio:
        raise ValueError(f"No 'base64_audio' (base64) found.")

    # Decode base64 to bytes
    try:
        audio_bytes = base64.b64decode(base64_audio)
    except Exception as e:
        raise ValueError(f"Error decoding base64 audio: {e}")

    # # Save the file
    # with open(output_path, "wb") as f:
    #     f.write(audio_bytes)
    # f.close()

    return audio_bytes



def speechmatics_runner_from_bytes(audio_bytes, suffix=".wav"):
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

    # Temporary file exists ONLY during this function
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(audio_bytes)
        tmp.flush()  # ensure data is written

        with BatchClient(settings) as client:
            job_id = client.submit_job(
                audio=tmp.name,
                transcription_config=conf,
            )

            transcript = client.wait_for_completion(
                job_id, transcription_format="txt"
            )

    # temp file is already deleted here
    return transcript



def speaker_recognition(transcription):
    """
    Identify the speaker - parent or child.

    Returns a dict:
        {
            "updated_transcription": str,
            "two_speakers": bool,
            "success": bool,
            "parent_speaker": str | None
        }
    """

    import re

    KEY_WORDS = ["בואו נתחיל את המשחק", "וננסה לענות", "באופן נכון"]

    # Extract segments (speaker + text)
    pattern = r"(SPEAKER:\s*S[0-9]+)(.*?)(?=SPEAKER:\s*S[0-9]+|$)"
    blocks = re.findall(pattern, transcription, flags=re.DOTALL)

    speakers = list({speaker for speaker, _ in blocks})

    result = {
        "updated_transcription": transcription,
        "two_speakers": False,
        "success": False,
        "parent_speaker": "None"
    }

    # More than two speakers
    if len(speakers) > 2:
        return result

    # Exactly two speakers
    result["two_speakers"] = True

    # Identify parent
    for speaker, text in blocks:
        text_lower = text.lower()
        if any(k.lower() in text_lower for k in KEY_WORDS):
            result["parent_speaker"] = speaker
            break

    # No keyword → failed recognition
    if result["parent_speaker"] is "None":
        return result

    result["success"] = True

    # Identify child
    child_speaker = next(
        s for s in speakers if s != result["parent_speaker"]
    )

    # Replace labels
    updated = transcription
    updated = updated.replace(result["parent_speaker"], "parent:")
    updated = updated.replace(child_speaker, "child:")

    result["updated_transcription"] = updated

    return result




def speaker_verification(base64_audio):
    audio_bytes = decode_base64_to_bytes(base64_audio)
    transcription = speechmatics_runner_from_bytes(audio_bytes)
    result = speaker_recognition(transcription)

    return result



if __name__ == "__main__":
    print("This is main function of AI_Models_API")

    # audio_file_path = "backend/audio_tom.mp3"
    # trans = speechmatics_runner(audio_file_path)
    # with open("backend/transcription.txt", "w") as f:
    #     f.write(trans)
    # f.close()
    #
    # trans_updated,MORE_THEN_TWO_SPEAKERS = speaker_recognition(trans)
    # with open("backend/transcription_updated.txt", "w") as f:
    #     f.write(trans_updated)
    # f.close()

    # test_prompt = """
    # You clever teaching assistant, give me 2 questions in {user_input}:
    # """
    #
    # print(openai_llm_runner(test_prompt, "gpt-4o-mini", "Math"))

