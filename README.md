
# __See&Say__
קובץ מפרט לפרויקט.

## DashBoard
DashBoard

* The Dashboard is a standalone desktop application used for managing all educational content in the See&Say project.
* Designed for educators and content creators, it allows full control over questions and media without requiring coding knowledge.

Purpose
* Serves as the content management layer of See&Say.
* Enables editing of questions and answers.
* Allows management of question order and numbering.
* Supports uploading and processing images.
* Synchronizes all changes with the "seeandsay-resources" GitHub repository: https://github.com/almoggiat/seeandsay-resources


Running the Dashboard
* Executable: Run the bundled application (e.g. dashboard.exe on Windows).
* From source: Run python dashboard.py (requires Python with tkinter and PIL).

Basic Workflow
* Load Questions
  * All questions are automatically loaded from the local CSV database.
* Edit Content
  * Select a question from the left panel.
  * Modify question text, correct answer, hint, comments, or question type.
  * Toggle Hebrew text with or without ניקוד.
  * Upload, remove, or reorder images.
* Save Changes
  * Use "שמור שינויים" to save the selected question.
  * Changes are saved locally and automatically pushed to GitHub.

Advanced Features

* Question Number Management (ניהול מספרי שאלות)
  * Reorder, add, or delete questions.
  * Associated image folders are automatically renamed to match updated question numbers.
  * Data integrity is preserved during renumbering operations.

* Batch Upload (שמור הכל ל-GitHub)
  * Uploads the entire local seeandsay-resources folder to GitHub.
  * Intended for initial setup or after large-scale content changes.

* Image Processing
  * All uploaded images are automatically resized to 300x300 pixels.
  * Images are converted to WebP format for optimal frontend performance.
  * Transparency is preserved when available.

Integration with the Main Project

* After making changes in the Dashboard:
  * Navigate to the seeandsay-resources folder located next to the Dashboard executable.
  * Copy all contents, including the CSV database and the test_assets image folders.
  * Paste them into frontend-demo/resources in the main project directory.

* Verification
  * Run the frontend application.
  * Confirm that updated questions load correctly.
  * Ensure images appear properly during the test.

Technical Overview

* Architecture
  * Standalone Tkinter application.
  * Interacts with:
    * Local CSV database (question metadata).
    * Local image folders organized by question number.
    * GitHub repository for collaboration and version control.

* Key Features
  * Dual storage model: local editing with GitHub synchronization.
  * Full Hebrew right-to-left interface support.
  * Automatic image optimization pipeline.
  * Robust error recovery during question renumbering.
  * Supports both script execution and packaged executable usage.

* Data Flow
  * User edits in Dashboard -> Local CSV updated -> GitHub synchronization ->
    Frontend resources updated -> Students see updated content in the test interface.

Security Considerations

* GitHub token is hardcoded for simplicity in an educational context.
* No sensitive student data is handled; only educational content is managed.
* All changes are version-controlled via GitHub.

Summary

* The Dashboard bridges content creation and deployment.
* Allows non-technical users to maintain and update the See&Say educational platform.
* Remains fully integrated with the development and deployment workflow.

## FrontEnd
### app.js
* Main React application component with routing and state management.
* Loads questions from CSV (`resources/query_database.csv`) using PapaParse.
* Manages page navigation (home, test, help) and persistent state via localStorage.
* Handles language switching (Hebrew/English) and image preloading.

### test.js
* Main test interface component - handles the entire exam flow.
* Manages UI states: age input, microphone permission, voice verification, question navigation.
* **Key functions:**
  * `confirmVoiceIdentifier()` - Validates speaker with backend, creates snapshot of verification recording.
  * `handleContinue(result)` - Records question results ("correct", "partly", "wrong") and moves to next question.
  * `completeSession()` - Stops recording, converts to MP3, sends test data to backend via `updateUserTests()`.
  * `formatQuestionResultsArray()` - Formats results as Python tuple string: `[(1,"correct"),(2,"partly"),(3,"wrong")]`.
* Tracks question timestamps, handles pause/resume, AFK detection, and developer mode features.

### recording.js
* Continuous audio recording module (SessionRecorder).
* **Key functions:**
  * `startContinuousRecording()` - Starts recording from verification screen, continues through entire test.
  * `markQuestionStart(questionNumber)` - Records timestamp when each question begins.
  * `getCurrentRecordingBlob()` - Creates snapshot of current recording for backend validation (without stopping).
  * `generateTimestampText()` - Generates Python tuple format: `[(1,0),(2,65),(3,127)]` where timestamps are in seconds, question 1 = 0.
  * `convertToMP3()` - Converts WebM/MP4 audio to MP3 using lamejs before sending to backend.
* Handles pause/resume tracking, stores recording in localStorage for persistence.

### apiToMongo.js
* Sends POST requests to the Backend.
* Being used at user creation, adding test (at end of exam), verification of speaker.
* Being called from `test.js`


## BackEnd

.env file && accounts passwords will be sent privately.

### server.py
* contains POST handle functions. --> main Render backend file.
* user creation, test adding, verification of speaker at the start of the test.
* server.py uses: `MongoDB.py` & `AI_Models_API.py`

### AI_Models_API.py
הקוד מכיל את הפונקציות שאותם הסרבר מריץ מאחורי הקלעים.

* Starts from **speaker_verification** --> **decode_base64_to_bytes** --> **speechmatics_runner_from_bytes** --> **speaker_recognition**
* When:
1. **speaker_verification** --> Wrapper Function
2. **decode_base64_to_bytes** --> Takes the base64 audio file from Frontend and converts to bytes. Returns the bytes.
3. **speechmatics_runner_from_bytes** --> Gets the bytes, stores on temp file, runs the transcription model. Returns the transcription.
4. **speaker_recognition** --> Gets the transcription, recognizes the SPEAK :S(i) who said the starting statement, marks him as "parent".
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
