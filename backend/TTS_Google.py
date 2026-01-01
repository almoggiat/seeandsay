from gtts import gTTS
from pydub import AudioSegment
from pydub.playback import play
import os
import csv
from gtts import gTTS

from pathlib import Path


# Generates Audio using Googles TTS
def Generate_TTS(text,save_path):
    # text = "ילַד הוֹלֵךְ לְבֵית הַסָּפֶר"

    gTTS(text=text, lang='iw').save(save_path)


# Plays the Audio from path
def Play_Audio(audio_file_path):
    try:
        audio = AudioSegment.from_mp3(audio_file_path)
        play(audio)
        print(f"Audio file '{audio_file_path}' played successfully.")
    except Exception as e:
        print(f"Error playing audio with pydub: {e}")
        print("Make sure ffmpeg is installed and accessible in your system's PATH.")


def Question_TTS_Maker(path, TEXT_COLUMN_HEADER, QUERY_COLUMN_HEADER):
    CVS_FILE_PATH = path

    # Folder to save the resulting MP3 files

    PROJECT_ROOT = Path(__file__).resolve().parents[1]  # seesay
    OUTPUT_DIR = PROJECT_ROOT / "frontend_demo" / "resources_temp" / "questions_audio"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        with open(CVS_FILE_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            # Validate required columns
            if TEXT_COLUMN_HEADER not in reader.fieldnames:
                print(f"Error: Column header '{TEXT_COLUMN_HEADER}' not found in the CSV file.")
                return

            if QUERY_COLUMN_HEADER not in reader.fieldnames:
                print(f"Error: Column header '{QUERY_COLUMN_HEADER}' not found in the CSV file.")
                return

            print(f"Processing data from column: '{TEXT_COLUMN_HEADER}'")
            print(f"Audio files will be saved in: '{OUTPUT_DIR}'")

            for row in reader:
                text_to_speak = row[TEXT_COLUMN_HEADER]
                query_number = row[QUERY_COLUMN_HEADER]

                if not text_to_speak or text_to_speak.isspace():
                    print(f"Skipping empty text for query {query_number}...")
                    continue

                if not query_number or query_number.isspace():
                    print("Skipping row with missing query number...")
                    continue

                # Use query number for filename
                save_path = os.path.join(
                    OUTPUT_DIR, f"audio_{query_number}.mp3"
                )

                try:
                    tts = gTTS(text=text_to_speak, lang="iw")
                    tts.save(save_path)
                    print(f"Successfully created: {save_path}")

                except Exception as e:
                    print(
                        f"Error processing query {query_number} "
                        f"('{text_to_speak}'): {e}"
                    )

    except FileNotFoundError:
        print(f"Error: The file '{CVS_FILE_PATH}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    return None



if __name__ == "__main__":
    # text = 'קוֹרְאִים לִי רוֹבּוֹ-שָׁאוּל וַאֲנִי מַכִּיר בָּנוֹת מֵאַרְגֶּנְטִינָה וּבָנִים מִבְּרָזִיל.'
    # text = "הוּא קִבֵּל גְּלִידָה"
    #
    # audio_path = "google_audio1.mp3"
    # Generate_TTS(text,audio_path)
    # Play_Audio(audio_path)
    TEXT_COLUMN_HEADER = 'query_nikud'
    QUERY_COLUMN_HEADER = "query_number"

    PROJECT_ROOT = Path(__file__).resolve().parents[1]  # seesay
    path = PROJECT_ROOT / "frontend_demo" / "resources_temp" / "query_database.csv"

    Question_TTS_Maker( path =path,
                        TEXT_COLUMN_HEADER=TEXT_COLUMN_HEADER,
                        QUERY_COLUMN_HEADER=QUERY_COLUMN_HEADER)

    # txt1 = "מָה מְשֻׁתָּף לֶחָתוּל פָּרָה וְצָב? כֻּלָּם חַיּוֹת? צַעֲצוּעִים אוֹ בְּגָדִים?"
    # text1_file_path = "/home/tom/PycharmProjects/seeandsay/frontend_demo/resources_temp/questions_audio/audio_33.mp3"
    # Generate_TTS(txt1,text1_file_path)