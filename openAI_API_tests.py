
from openai import OpenAI

import os
from dotenv import load_dotenv
import logging

load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_KEY")

openAI_client = OpenAI(api_key= OPENAI_API_KEY)
audio_file= open("/home/tom/PycharmProjects/seeandsay/q1_whyHappy.mp3", "rb")

transcription = openAI_client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file
)

print(transcription.text)