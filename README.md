
# __See&Say__
קובץ מפרט לפרויקט.


## FrontEnd



## BackEnd

.env file && accounts passwords will be sent privately.

### server.py
* contains POST functions. --> main Render backend file.
* user creation, test adding, verification of speaker at the start of the test.
* server.py uses: `MongoDB.py` & `AI_Models_API.py`

### AI_Models_API.py
הקוד מכיל את הפונקציות שאותם הסרבר מריץ מאחורי הקלעים.

*Starts from **speaker_verification** --> **decode_base64_to_bytes** --> **speechmatics_runner_from_bytes** --> **speaker_recognition**
When:
* **speaker_verification** --> Wrapper Function
* **decode_base64_to_bytes** --> Takes the base64 audio file from Frontend and converts to bytes. Returns the bytes.
* **speechmatics_runner_from_bytes** --> Gets the bytes, stores on temp file, runs the transcription model. Returns the transcription.
* **speaker_recognition** --> Gets the transcription, recognizes the SPEAK :S(i) who said the starting statement, marks him as "parent".
                            The other SPEAKER:S is marked as "child". (Only if 2 speakers were recognized.). Returns dict.
`
result["success"], result["parent_speaker"], result["updated_transcription"]
result["success"] --> True if found the statement and less than 2 speakers.
result["parent_speaker"] --> SPEAKER:S of parent
result["updated_transcription"] --> Transcription with parent and child.
`

* The speaker's recognition sensitivity can be change at `speechmatics_runner_from_bytes`, **0.3 works well**.

### MongoDB.py
* Basic database operations codes.
* Functions in use:
* create_storage, connect, add_user, add_test_to_use.
* **Being used in server.py** for example:
`storage = SeeSayMongoStorage(mongodb_url, database_name)
success = storage.add_user(
        user_id=user.userId,
        user_name=user.userName
    )`


### TTS_Google.py
* Was used as behind the scenes code.
* Using Google TTS API to create audio for question.
* Before using Google's TTS, we manually created "Nikud" for each question:
https://nakdan.dicta.org.il/

* Steps:
1. Copy Questions to "Nikud". --> Look for possible Nikud mistakes.
2. Copy the results from web and paste at new column at CVS(the XL file) named "query_nikud"
3. Copy the PATH of CVS file -> paste in main.
4. Run --> The results will be stored at `"frontend_demo/resources/questions_audio"`


