
from openai import OpenAI

from speechmatics.models import ConnectionSettings
from speechmatics.batch_client import BatchClient
from httpx import HTTPStatusError

import os
from dotenv import load_dotenv
import logging
import re

from server import *


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



def speechmatics_runner(audioFilePath):
    LANGUAGE = "he"
    settings = ConnectionSettings(
        url="https://asr.api.speechmatics.com/v2",
        auth_token=SPEECHMATICS_API_KEY,
    )
    conf = {"type": "transcription",
            "transcription_config": {"language": LANGUAGE,
                                     "operating_point": "enhanced",
                                     "diarization": "speaker",
                                     "enable_entities": False}}

    with BatchClient(settings) as client:
        try:
            job_id = client.submit_job(
                audio=audioFilePath,
                transcription_config=conf,
            )
            print(f"job {job_id} submitted successfully, waiting for transcript")

            # Note that in production, you should set up notifications instead of polling.
            # Notifications are described here: https://docs.speechmatics.com/speech-to-text/batch/notifications
            transcript = client.wait_for_completion(job_id, transcription_format="txt")
            print(f"This is the transcription:\n{transcript}")
            transcript_full = client.wait_for_completion(job_id, transcription_format="txt")
            print(f"This is full data:\n{transcript_full}")

        except HTTPStatusError as e:
            if e.response.status_code == 401:
                print("Invalid API key - Check your API_KEY at the top of the code!")
            elif e.response.status_code == 400:
                print(e.response.json()["detail"])
            else:
                raise e

    return transcript


def speaker_recognition(transcription):
    """
    Identify the speaker - parent or child
    """
    KEY_WORDS = ["בואו נתחיל את המשחק", "וננסה לענות", "באופן נכון"]

    # Extract segments
    pattern = r"(SPEAKER:\s*S[12])(.*?)(?=SPEAKER:\s*S[12]|$)"
    blocks = re.findall(pattern, transcription, flags=re.DOTALL)
    # FOR EXAMPLE:
    # ("SPEAKER: S1", " Hello, how are you today?\n")
    # ("SPEAKER: S2", " I’m worried because my son has been coughing.\n")

    parent_speaker = None
    # Find which speaker contains any keyword
    for speaker, text in blocks:
        text_lower = text.lower()
        if any(k.lower() in text_lower for k in KEY_WORDS):
            parent_speaker = speaker  # e.g., "SPEAKER: S1"
            break

    # If no keyword found - do nothing
    if parent_speaker is None:
        return transcription

    # The other speaker becomes child
    child_speaker = "SPEAKER: S1" if parent_speaker == "SPEAKER: S2" else "SPEAKER: S2"

    # Replace in full transcription
    updated = transcription.replace(parent_speaker, "parent:")
    updated = updated.replace(child_speaker, "child:")

    print(updated)
    return updated


if __name__ == "__main__":
    print("This is main function of AI_Models_API")

    audio_file_path = "backend/output_audio.mp3"
    trans = speechmatics_runner(audio_file_path)
    with open("backend/transcription.txt", "w") as f:
        f.write(trans)
    f.close()

    trans_updated = speaker_recognition(trans)
    with open("backend/transcription_updated.txt", "w") as f:
        f.write(trans_updated)
    f.close()

    # test_prompt = """
    # You clever teaching assistant, give me 2 questions in {user_input}:
    # """
    #
    # print(openai_llm_runner(test_prompt, "gpt-4o-mini", "Math"))

