from gtts import gTTS
from pydub import AudioSegment
from pydub.playback import play
import os
import csv
from gtts import gTTS





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


def Question_TTS_Maker():
    CSV_FILE_NAME = 'query_database.csv'
    CVS_FILE_PATH = "/home/tom/PycharmProjects/seeandsay/frontend/resources/query_database.csv"

    TEXT_COLUMN_HEADER = 'query_nikud'

    # Folder to save the resulting MP3 files
    OUTPUT_DIR = "/home/tom/PycharmProjects/seeandsay/frontend/questions_audio"

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    file_counter = 1

    try:
        with open(CVS_FILE_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            if TEXT_COLUMN_HEADER not in reader.fieldnames:
                print(f"Error: Column header '{TEXT_COLUMN_HEADER}' not found in the CSV file.")
                return

            print(f"Processing data from column: '{TEXT_COLUMN_HEADER}'...")
            print(f"Audio files will be saved in: '{OUTPUT_DIR}'")

            for row in reader:
                text_to_speak = row[TEXT_COLUMN_HEADER]

                if not text_to_speak or text_to_speak.isspace():
                    print(f"Skipping empty text in row {file_counter}...")
                    continue

                # 2. Generate the full save path (e.g., frontend/questions_audio/audio_1.mp3)
                save_path = os.path.join(OUTPUT_DIR, f'audio_{file_counter}.mp3')

                try:
                    # 3. Create the gTTS object and save the audio
                    tts = gTTS(text=text_to_speak, lang="iw")
                    tts.save(save_path)
                    print(f"Successfully created: {save_path}")

                except Exception as e:
                    # Handle any TTS or saving errors
                    print(f"Error processing row {file_counter} ('{text_to_speak}'): {e}")

                file_counter += 1

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
    Question_TTS_Maker()



