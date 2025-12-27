function Test({ allQuestions }) {
  // ============================================================================
  // STATE DECLARATIONS
  // ============================================================================

  const [questions, setQuestions] = React.useState([]);

  // Persistent states
  const [ageYears, setAgeYears] = usePersistentState("ageYears", "");
  const [ageMonths, setAgeMonths] = usePersistentState("ageMonths", "");
  const [idDigits, setId] = usePersistentState("idDigits", "")
  const [ageConfirmed, setAgeConfirmed] = usePersistentState("ageConfirmed", false);
  const [ageInvalid, setAgeInvalid] = usePersistentState("ageInvalid", false);
  const [currentIndex, setCurrentIndex] = usePersistentState("currentIndex", 0);
  const [correctAnswers, setCorrectAnswers] = usePersistentState("correctAnswers", 0);
  const [partialAnswers, setPartialAnswers] = usePersistentState("partialAnswers", 0);
  const [wrongAnswers, setWrongAnswers] = usePersistentState("wrongAnswers", 0);
  const [devMode, setDevMode] = usePersistentState("devMode", false)
  
  // Track full array of question results: [{questionNumber, result}, ...]
  const [questionResults, setQuestionResults] = usePersistentState("questionResults", []);

  // Microphone persistent
  const [permission, setPermission] = usePersistentState("permission", false);
  const [microphoneSkipped, setMicrophoneSkipped] = usePersistentState("microphoneSkipped", false);
  const [voiceIdentifierConfirmed, setVoiceIdentifierConfirmed] = usePersistentState("voiceIdentifierConfirmed", false);
  
  // Reading validation states
  const [readingValidated, setReadingValidated] = usePersistentState("readingValidated", false);
  const [readingValidationResult, setReadingValidationResult] = usePersistentState("readingValidationResult", null); // null = no connection, true = valid, false = invalid
  const [readingRecordingBlob, setReadingRecordingBlob] = usePersistentState("readingRecordingBlob", null);
  const [readingValidationInProgress, setReadingValidationInProgress] = React.useState(false);
  


  // Session-only states
  const [images, setImages] = React.useState([]);
  const [target, setTarget] = React.useState("");
  const [showContinue, setShowContinue] = React.useState(false);
  const [clickedCorrect, setClickedCorrect] = React.useState(false);
  const [sessionCompleted, setSessionCompleted] = usePersistentState("sessionCompleted", false);
  const [questionType, setQuestionType] = React.useState("C");
  
  // Two-row layout states
  const [isTwoRow, setIsTwoRow] = React.useState(false);
  const [topRowCount, setTopRowCount] = React.useState(0);
  const [topRowBigger, setTopRowBigger] = React.useState(false);
  const [nonClickableImage, setNonClickableImage] = React.useState(null);
  
  // Hint states
  const [showHint, setShowHint] = React.useState(false);
  const [hintText, setHintText] = React.useState("");
  const [commentText, setCommentText] = React.useState("");
  
  // Multi-answer and ordered answer states
  const [answerType, setAnswerType] = React.useState("single"); // "single", "multi", "ordered", "mask"
  const [multiAnswers, setMultiAnswers] = React.useState([]); // Array of correct answer indices
  const [clickedMultiAnswers, setClickedMultiAnswers] = React.useState([]); // Array of clicked correct answers
  const [orderedAnswers, setOrderedAnswers] = React.useState([]); // Array of answer indices in order
  const [orderedClickSequence, setOrderedClickSequence] = React.useState([]); // Sequence of clicks
  
  // Mask answer states
  const [maskImage, setMaskImage] = React.useState(null); // HTMLImageElement for the mask
  const [maskCanvas, setMaskCanvas] = React.useState(null); // Canvas for pixel detection


  
  // Continuous recording state (persistent so it survives refresh)
  const [sessionRecordingStarted, setSessionRecordingStarted] = usePersistentState("sessionRecordingStarted", false);

  // Pause state (persistent)
  const [isPaused, setIsPaused] = usePersistentState("testPaused", false);
  
  // AFK timer states
  const [afkTimerActive, setAfkTimerActive] = React.useState(false);
  const [showAfkWarning, setShowAfkWarning] = React.useState(false);
  const afkTimerRef = React.useRef(null);
  const afkWarningTimerRef = React.useRef(null);

  // Image loading state
  const [currentQuestionImagesLoaded, setCurrentQuestionImagesLoaded] = React.useState(false);

  const isMountedRef = React.useRef(true);

  React.useEffect(function cleanupMount() {
    return function() {
      isMountedRef.current = false;
    };
  }, []);

  //question audio states
const [questionAudio, setQuestionAudio] = React.useState(null);
const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);




  // =============================================================================
  // DEVELOPER MODE FUNCTIONS
  // ================ =============================================================

React.useEffect(() => {
    function handleKeyDown(event) {
      // Check if Control (or Command on Mac) + Q are pressed together
      if ((event.ctrlKey || event.metaKey) && event.key === "q") {
        event.preventDefault(); // Prevents default browser action
        setDevMode(prevDevMode => !prevDevMode);
        return;
      }

      // Handle arrow keys in dev mode
      if (devMode) {
        if (event.key === "ArrowRight") {
          updateCurrentQuestionIndex(prevIdx => {
            if (prevIdx < questions.length - 1) {
              return prevIdx + 1;
            }
            return prevIdx;
          });
        } else if (event.key === "ArrowLeft") {
          updateCurrentQuestionIndex(prevIdx => {
            if (prevIdx > 0) {
              return prevIdx - 1;
            }
            return prevIdx;
          });
        } else if (event.key === "Enter") {
          event.preventDefault();
          const inputElement = document.querySelector('.dev-mode-input');
          if (inputElement) {
            const value = Number(inputElement.value) - 1;
            if (value >= 0 && value < questions.length){
              updateCurrentQuestionIndex(value);
            }
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [devMode]); 



  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  function totalMonths() {
    const y = parseInt(ageYears, 10) || 0;
    const m = parseInt(ageMonths, 10) || 0;
    return y * 12 + m;
  }


  function getCurrentQuestionIndex() {
    return currentIndex;
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  function confirmAge() {
    const y = parseInt(ageYears, 10);
    const m = parseInt(ageMonths, 10);
    const id = idDigits
    if (isNaN(y) || isNaN(m) || m < 0 || m > 11) {
      alert("Please enter a valid age (months 0–11).");
      return;
    }
    const months = totalMonths();
    if (months < 24 || months >= 72) {
      setAgeInvalid(true);
      return;
    }
    if (id.length != 9)
    {
      alert("please enter a valid ID number")
      return
    }
    // Simply confirm age and start with all questions
    setAgeConfirmed(true);
    createUser(idDigits, 'SomeUserName') //MongoDB
  }

  const getMicrophonePermission = async function() {
    if ("MediaRecorder" in window) {
      try {
        // Just request microphone access without starting recording yet
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the test stream immediately - we'll start recording on voice identifier
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
        setPermission(true);
        console.log("✅ Microphone permission granted");
      } catch (err) {
        alert(err.message);
      }
    } else alert("The MediaRecorder API is not supported in your browser.");
  };

  const skipMicrophone = function() {
    // Even if skipping recording, mark that user interacted with microphone prompt
    setMicrophoneSkipped(true);
    // sessionRecordingStarted will be set by the useEffect when voice identifier screen appears
  };

  const confirmVoiceIdentifier = async function() {
    // Stop the reading recording
    if (permission && sessionRecordingStarted) {
      SessionRecorder.stopContinuousRecording();
      console.log("🛑 Stopped reading recording, preparing for validation...");

      // Wait for recording to be processed and converted to MP3
      // Poll until recording is ready (similar to completeSession)
      var pollAttempts = 0;
      var maxAttempts = 50; // Max 5 seconds (50 * 100ms)

      var checkRecordingReady = async function() {
        pollAttempts++;

        try {
          // Get the original blob BEFORE MP3 conversion for merging later
          const originalVerificationBlob = await SessionRecorder.getOriginalRecordingBlob();
          
          // Also get the MP3 version for backend validation
          const recordingData = await SessionRecorder.getRecordingAndText();
          if (recordingData && recordingData.recordingBlob) {
            console.log("✅ Reading recording ready after " + pollAttempts + " attempts");
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = async function() {
              const audioBase64 = reader.result;
              setReadingRecordingBlob(audioBase64);
              
              // Calculate verification recording duration
              // Use the original blob for duration calculation (more accurate)
              const blobForDuration = originalVerificationBlob || recordingData.recordingBlob;
              let verificationDuration = 0;
              
              try {
                // Calculate duration from the audio blob
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = await blobForDuration.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                verificationDuration = Math.floor(audioBuffer.duration * 1000); // Convert to milliseconds
                console.log("📏 Verification recording duration:", verificationDuration, "ms");
              } catch (err) {
                console.warn("⚠️ Could not calculate verification duration:", err);
                // Estimate duration from blob size (rough approximation)
                verificationDuration = Math.floor((blobForDuration.size / 16000) * 1000); // Rough estimate
              }
              
              // Show loading screen while waiting for backend
              setReadingValidationInProgress(true);

              // Send to backend for validation
              const validationResult = await verifySpeaker(idDigits,audioBase64);
              
              // Hide loading screen
              setReadingValidationInProgress(false);
              
              // verifySpeaker can return:
              // - null: no backend connection (for testing)
              // - {success: true, parentSpeaker: ...}: valid
              // - {success: false, error: ...}: invalid
              // Convert to boolean/null format expected by the UI
              if (validationResult === null) {
                // No connection - show options
                setReadingValidationResult(null);
                setReadingValidated(false);
              } else if (validationResult && validationResult.success === true) {
                // Validation succeeded - store the ORIGINAL verification recording blob for merging
                // (not the MP3 version, so it can be properly merged with test recording)
                if (originalVerificationBlob) {
                  SessionRecorder.setVerificationRecording(originalVerificationBlob, verificationDuration);
                } else {
                  console.warn("⚠️ Could not get original verification blob, using MP3 version");
                  SessionRecorder.setVerificationRecording(recordingData.recordingBlob, verificationDuration);
                }
                setReadingValidationResult(true);
                setReadingValidated(true);
              } else if (validationResult && validationResult.success === false) {
                // Validation failed - discard this verification recording
                // (Only the last successful one will be kept)
                setReadingValidationResult(false);
                setReadingValidated(false);
              } else {
                // Fallback: treat as no connection
                setReadingValidationResult(null);
                setReadingValidated(false);
              }
            };
            reader.readAsDataURL(recordingData.recordingBlob);
          } else if (pollAttempts < maxAttempts) {
            // Not ready yet, check again in 100ms
            setTimeout(checkRecordingReady, 100);
          } else {
            // Timeout - treat as no connection
            console.warn("⚠️ Reading recording conversion timeout");
            setReadingValidationResult(null);
            setReadingValidated(false);
          }
        } catch (err) {
          console.error("Error getting reading recording:", err);
          if (pollAttempts < maxAttempts) {
            setTimeout(checkRecordingReady, 100);
          } else {
            setReadingValidationResult(null);
            setReadingValidated(false);
          }
        }
      };

      // Start polling after a small initial delay
      setTimeout(checkRecordingReady, 200);
    } else {
      // No recording, skip validation
      setReadingValidationResult(null);
      setReadingValidated(true);
    }
  };
  
  const handleReadingValidationContinue = async function() {
    // Restart recording for the actual test
    if (permission) {
      // Don't call cleanup() here - it would clear the verification recording we just stored
      // Just stop the current recording and reset timestamps
      SessionRecorder.stopContinuousRecording();
      
      // Reset timestamps so they count from question 1 (but will be offset by verification duration)
      SessionRecorder.resetTimestamps();
      
      // Start new recording for the test (verification recording will be merged automatically)
      const started = await SessionRecorder.startContinuousRecording();
      if (started) {
        setSessionRecordingStarted(true);
        console.log("✅ Started test recording");
        
        // Mark question 1 start timestamp after a brief delay to ensure recording is active
        setTimeout(function() {
          if (questions.length > 0) {
            const firstQuestion = questions[0];
            if (firstQuestion) {
              SessionRecorder.markQuestionStart(firstQuestion.query_number);
              console.log("📝 Marked question 1 start at test start");
            }
          }
        }, 100);
      }
    } else {
      // Even without recording, mark question 1 if microphone was skipped
      if (questions.length > 0 && microphoneSkipped) {
        const firstQuestion = questions[0];
        if (firstQuestion) {
          SessionRecorder.markQuestionStart(firstQuestion.query_number);
          console.log("📝 Marked question 1 start at test start (no recording)");
        }
      }
    }
    
    setVoiceIdentifierConfirmed(true);
    setReadingValidated(true);
    playQuestionOne();
  };
  
  const handleReadingValidationRetry = async function() {
    // Reset states and restart recording
    // This discards the previous verification attempt (only last successful one is kept)
    setReadingValidated(false);
    setReadingValidationResult(null);
    setReadingRecordingBlob(null);
    
    // Restart recording - clear verification recording since we're retrying
    if (permission) {
      SessionRecorder.cleanup(true); // true = clear verification recording
      SessionRecorder.resetTimestamps();
      const started = await SessionRecorder.startContinuousRecording();
      if (started) {
        setSessionRecordingStarted(true);
        console.log("🔄 Restarted reading recording (previous verification discarded)");
      }
    }
  };

  // Auto-start recording when voice identifier screen appears (only if not validated yet)
  React.useEffect(function() {
    if ((permission || microphoneSkipped) && !voiceIdentifierConfirmed && !sessionRecordingStarted && !readingValidated) {
      if (permission) {
        // Start recording when the voice identifier screen appears
        async function startRecording() {
          try {
            const started = await SessionRecorder.startContinuousRecording();
            if (started) {
              setSessionRecordingStarted(true);
              console.log("✅ Continuous recording started on voice identifier screen");
            }
          } catch (err) {
            console.error("Failed to start recording:", err);
            alert("Failed to start recording: " + err.message);
          }
        }
        startRecording();
      } else if (microphoneSkipped) {
        // Mark as started even if no recording
        setSessionRecordingStarted(true);
      }
    }
  }, [permission, microphoneSkipped, voiceIdentifierConfirmed, sessionRecordingStarted, readingValidated]);

  // Start AFK timer when test begins
  React.useEffect(function() {
    if (voiceIdentifierConfirmed && !isPaused && !sessionCompleted) {
      resetAfkTimer();
    }
    
    // Cleanup timers on unmount
    return function() {
      stopAfkTimer();
    };
  }, [voiceIdentifierConfirmed]);

  // Reset AFK timer when loading a new question
  React.useEffect(function() {
    if (voiceIdentifierConfirmed && !isPaused && !sessionCompleted) {
      resetAfkTimer();
    }
  }, [currentIndex]);

  // Stop AFK timer when paused or completed
  React.useEffect(function() {
    if (isPaused || sessionCompleted) {
      stopAfkTimer();
    }
  }, [isPaused, sessionCompleted]);


const playQuestionAudio = function() {
  if (questionAudio) {
    questionAudio.currentTime = 0;
    questionAudio.play();
    setIsAudioPlaying(true);
  }
};

const replayQuestionAudio = function() {
  playQuestionAudio();
};

// =============================================================================
// PAUSE/RESUME AND AFK TIMER FUNCTIONS
// =============================================================================

// Pause test
const pauseTest = function() {
  if (isPaused) return;
  
  setIsPaused(true);
  
  // Pause recording if active
  if (permission && sessionRecordingStarted) {
    SessionRecorder.pauseRecording();
  }
  
  // Stop AFK timers
  stopAfkTimer();
  
  console.log("⏸️ Test paused");
};

// Resume test
const resumeTest = async function() {
  if (!isPaused) return;
  
  // Resume recording if active (do this BEFORE setting isPaused to false)
  if (permission && sessionRecordingStarted) {
    await SessionRecorder.resumeRecording();
  }
  
  // Now set isPaused to false
  setIsPaused(false);
  
  // Restart AFK timer
  resetAfkTimer();
  
  console.log("▶️ Test resumed");
};

// Reset AFK timer (called on user activity)
const resetAfkTimer = function() {
  if (isPaused || sessionCompleted || !voiceIdentifierConfirmed) return;
  
  // Clear existing timers
  if (afkTimerRef.current) {
    clearTimeout(afkTimerRef.current);
  }
  if (afkWarningTimerRef.current) {
    clearTimeout(afkWarningTimerRef.current);
  }
  
  // Hide warning if showing
  setShowAfkWarning(false);
  
  // Set 5-minute timer for warning
  afkTimerRef.current = setTimeout(function() {
    setShowAfkWarning(true);
    console.log("⚠️ AFK warning shown");
    
    // Set 1-minute timer to auto-pause
    afkWarningTimerRef.current = setTimeout(function() {
      console.log("⏸️ Auto-pausing due to inactivity");
      pauseTest();
      setShowAfkWarning(false);
    }, 60000); // 1 minute
  }, 300000); // 5 minutes
};

// Stop AFK timer
const stopAfkTimer = function() {
  if (afkTimerRef.current) {
    clearTimeout(afkTimerRef.current);
    afkTimerRef.current = null;
  }
  if (afkWarningTimerRef.current) {
    clearTimeout(afkWarningTimerRef.current);
    afkWarningTimerRef.current = null;
  }
  setShowAfkWarning(false);
};

// Handle "Are you still there?" response
const handleAfkResponse = function() {
  setShowAfkWarning(false);
  resetAfkTimer();
  console.log("✅ User confirmed presence");
};



const playQuestionOne = function()  {
   // Load and play question audio
    const audioUrl = "resources/questions_audio/audio_1.mp3";
    const audio = new Audio(audioUrl);
    audio.onended = function() {
      setIsAudioPlaying(false);
    };
    audio.onerror = function() {
      console.warn('Audio file not found for question:', q.query_number);
    };
    setQuestionAudio(audio);
    // Play audio automatically when question loads
    setTimeout(function() {
      audio.play().catch(function(err) {
        console.warn('Audio autoplay failed:', err);
      });
      setIsAudioPlaying(true);
    }, 100);}
    
  



  const handleClick = function(img, event) {
    // Reset AFK timer on user interaction
    resetAfkTimer();
    
    if (questionType === "C") {
      // Get the image index (1-based)
      const imgIndex = images.indexOf(img) + 1;
      
      // Check if this image is non-clickable
      if (nonClickableImage && imgIndex === nonClickableImage) {
        return; // Don't process click on non-clickable image
      }
      
      if (answerType === "single") {
        // Original single-answer behavior
        const correct = img === target;
        if (correct) setClickedCorrect(true);
        setShowContinue(true);
      } else if (answerType === "multi") {
        // Multi-answer: check if this is a correct answer
        // CHANGE B: Always show continue when any image is clicked
        setShowContinue(true);
        
        if (multiAnswers.includes(imgIndex)) {
          // Add to clicked answers if not already clicked
          if (!clickedMultiAnswers.includes(imgIndex)) {
            const newClicked = [...clickedMultiAnswers, imgIndex];
            setClickedMultiAnswers(newClicked);
            
            // Check if all correct answers have been clicked
            if (newClicked.length === multiAnswers.length) {
              setClickedCorrect(true);
            }
          }
        }
      } else if (answerType === "ordered") {
        // Ordered answer: check if this matches the next expected answer

        if (orderedClickSequence.length > 0 && orderedClickSequence.at(-1) != imgIndex){
          const newSequence = [orderedClickSequence.at(-1), imgIndex]
          setOrderedClickSequence(newSequence)
          setShowContinue(true);
          if (newSequence[0] === 2 && newSequence[1] === 1) {
            setClickedCorrect(true);
          }
        }
        else{
          const newSequence = [imgIndex] 
          setOrderedClickSequence(newSequence)
        } 
      } else if (answerType === "mask") {
        // CHANGE A: Fixed mask detection
        // Mask-based answer: check if click is on green pixel
        if (maskCanvas) {
          const isGreen = checkMaskClick(event);
          if (isGreen) {
            setClickedCorrect(true);
          }
        }
        setShowContinue(true);
      }
    }
  };

  function checkMaskClick(event) {
    if (!maskCanvas) return false;
    
    const imgElement = event.target;
    const rect = imgElement.getBoundingClientRect();
    
    // Get click position relative to image
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale to canvas coordinates
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);
    
    // Ensure coordinates are within bounds
    if (canvasX < 0 || canvasX >= maskCanvas.width || canvasY < 0 || canvasY >= maskCanvas.height) {
      return false;
    }
    
    // Get pixel data from canvas
    const ctx = maskCanvas.getContext('2d');
    const pixelData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    
    // Check if pixel is green (R < 50, G > 200, B < 50)
    const isGreen = pixelData[0] < 50 && pixelData[1] > 200 && pixelData[2] < 50;
    
    console.log('Mask click at:', canvasX, canvasY, 'RGB:', pixelData[0], pixelData[1], pixelData[2], 'isGreen:', isGreen);
    
    return isGreen;
  }

  const handleContinue = function(result) {
    // Reset AFK timer on user interaction
    resetAfkTimer();
    
    const currentIdx = getCurrentQuestionIndex();
    const currentQuestion = questions[currentIdx];
    
    // Track traffic light responses
    if (result === "success") {
      setCorrectAnswers(correctAnswers + 1);
    } else if (result === "partial") {
      setPartialAnswers(partialAnswers + 1);
    } else if (result === "failure") {
      setWrongAnswers(wrongAnswers + 1);
    }
    
    // Track question result in full array
    if (currentQuestion) {
      const questionNumber = currentQuestion.query_number;
      // Map result to string format
      let resultString = "";
      if (result === "success") {
        resultString = "correct";
      } else if (result === "partial") {
        resultString = "partly";
      } else if (result === "failure") {
        resultString = "wrong";
      }
      
      // Add to question results array
      setQuestionResults([...questionResults, {
        questionNumber: questionNumber,
        result: resultString
      }]);
    }
    
    // Simply move to next question or complete session
    if (currentIdx < questions.length - 1) {
      updateCurrentQuestionIndex(currentIdx + 1);
    } else {
      completeSession();
    }
  };

  

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  // Format question results as Python tuple format: [(1,"correct"),(2,"partly"),(3,"wrong")]
  function formatQuestionResultsArray() {
    if (questionResults.length === 0) {
      return "[]";
    }

    const formattedTuples = questionResults.map(function(item) {
      const questionNum = parseInt(item.questionNumber, 10);
      return "(" + questionNum + ",\"" + item.result + "\")";
    });

    return "[" + formattedTuples.join(",") + "]";
  }
  // Test to convert for a real Array
//  function formatQuestionResultsArray() {
//    return questionResults.map(item => {
//        return [parseInt(item.questionNumber, 10), item.result];
//  });
//}


  function loadAllQuestions() {
    const ageGroupOrder = ["2:00-2:06", "2:07-3:00", "3:00-4:00", "4:00-5:00", "5:00-6:00"];
    
    const filtered = allQuestions
      .filter(function(q) {
        return q && q.query && q.query_type && q.age_group;
      })
      .map(function(q) {
        return {
          ...q,
          query_type: q.query_type.trim().normalize("NFC"),
          age_group: q.age_group.trim().normalize("NFC"),
          query: (q.query || "").trim(),
          comments: (q.comments || "").trim(), // Preserve comments field
        };
      });
    
    // Sort by age group first (using predefined order), then by question number
    const sorted = filtered.sort(function(a, b) {
      const ageGroupA = ageGroupOrder.indexOf(a.age_group);
      const ageGroupB = ageGroupOrder.indexOf(b.age_group);
      
      if (ageGroupA !== ageGroupB) {
        return ageGroupA - ageGroupB;
      }
      
      // Within same age group, sort by query_number
      const numA = parseInt(a.query_number, 10) || 0;
      const numB = parseInt(b.query_number, 10) || 0;
      return numA - numB;
    });
    
    setQuestions(sorted);
  }

  function updateCurrentQuestionIndex(newIndex) {
    setCurrentIndex(newIndex);
  }

  function loadQuestion(index) {
    const q = questions[index];
    if (!q) return;

    // Mark question start timestamp for recording
    // Skip question 1 here as it will be marked when test starts
    if ((permission || microphoneSkipped) && voiceIdentifierConfirmed && index > 0) {
      SessionRecorder.markQuestionStart(q.query_number);
    }

    setShowContinue(false);
    setClickedCorrect(false);
    setClickedMultiAnswers([]);
    setOrderedClickSequence([]);
    setMaskImage(null);
    setMaskCanvas(null);

    // Handle n|m format for two-row layout
    let imgCount, isTwoRow = false, topRowCount = 0, topRowBigger = false;
    if (q.image_count.includes('|')) {
      const parts = q.image_count.split('|');
      topRowCount = parseInt(parts[0], 10);
      imgCount = parseInt(parts[1], 10);
      isTwoRow = true;
      topRowBigger = topRowCount < (imgCount / 2);
    } else {
      imgCount = parseInt(q.image_count, 10) || 1;
    }

    const imgs = [];
    for (let i = 1; i <= imgCount; i++) {
      imgs.push(ImageLoader.getImageUrl(q.query_number, i));
    }

    // Parse answer field to determine answer type
    const answerStr = (q.answer || "").trim();
    
    if (answerStr === "A") {
      // Mask answer type: load A.webp as mask
      setAnswerType("mask");
      const maskUrl = "resources/test_assets/" + q.query_number + "/A.webp";
      
      // Load mask image and draw to canvas for pixel detection
      const mask = new Image();
      mask.crossOrigin = "anonymous";
      mask.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = mask.width;
        canvas.height = mask.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(mask, 0, 0);
        setMaskCanvas(canvas);
        setMaskImage(mask);
      };
      mask.onerror = function() {
        console.error('Failed to load mask image:', maskUrl);
      };
      mask.src = maskUrl;
      
      setTarget("");
      setMultiAnswers([]);
      setOrderedAnswers([]);
    } else if (answerStr.startsWith("x") && answerStr.includes("|")) {
      // Non-clickable image format: "xn|m" where n is non-clickable, m is correct
      setAnswerType("single");
      const parts = answerStr.substring(1).split("|");
      const nonClickableNum = parseInt(parts[0], 10);
      const correctNum = parseInt(parts[1], 10);
      setNonClickableImage(nonClickableNum);
      const targetPath = ImageLoader.getImageUrl(q.query_number, correctNum);
      setTarget(targetPath);
      setMultiAnswers([]);
      setOrderedAnswers([]);
    } else if (answerStr.includes(",")) {
      // Multi-answer type: "1,2,3,4,10"
      setAnswerType("multi");
      const answers = answerStr.split(",").map(function(a) {
        return parseInt(a.trim(), 10);
      });
      setMultiAnswers(answers);
      setTarget(""); // Not used for multi-answer
    } else if (answerStr.includes("->")) {
      // Ordered answer type: "2->1"
      setAnswerType("ordered");
      const answers = answerStr.split("->").map(function(a) {
        return parseInt(a.trim(), 10);
      });
      setOrderedAnswers(answers);
      setTarget(""); // Not used for ordered answer
    } else {
      // Single answer type (original behavior)
      setAnswerType("single");
      const answerNum = parseInt(answerStr, 10) || 1;
      const targetPath = ImageLoader.getImageUrl(q.query_number, answerNum);
      setTarget(targetPath);
      setMultiAnswers([]);
      setOrderedAnswers([]);
    }

    setImages(imgs);
    setQuestionType(q.query_type === "הבנה" ? "C" : "E");
 if (permission || microphoneSkipped){ //check if the microphone permission stage is over
    //play the audio

    // Load and play question audio
    const audioUrl = "resources/questions_audio/audio_" + q.query_number + ".mp3";
    const audio = new Audio(audioUrl);
    audio.onended = function() {
      setIsAudioPlaying(false);
    };
    audio.onerror = function() {
      console.warn('Audio file not found for question:', q.query_number);
    };
    setQuestionAudio(audio);
    // Play audio automatically when question loads
    setTimeout(function() {
      audio.play().catch(function(err) {
        console.warn('Audio autoplay failed:', err);
      });
      setIsAudioPlaying(true);
    }, 100);}
    
    // Set two-row layout states
    setIsTwoRow(isTwoRow);
    setTopRowCount(topRowCount);
    setTopRowBigger(topRowBigger);
    
    // Set hint states
    setShowHint(false);
    setHintText(q.hint || "");
    
    // Set comment states - ensure we get the comment from the question object
    const comment = (q.comments && q.comments.trim()) || "";
    setCommentText(comment);
    
    // Reset non-clickable image
    setNonClickableImage(null);

    // Start countdown for expression questions
    if (q.query_type !== "הבנה") {
      setShowContinue(true);
    }
  }

  function handleLevelCompletion() {
    // Simplified: just complete the session
    completeSession();
  }

function completeSession() {
  setSessionCompleted(true);
  setImages([]);
  
  // If test is paused, unpause it first
  if (isPaused) {
    setIsPaused(false);
  }

  // Stop continuous session recording and send data to backend
  if (sessionRecordingStarted && permission) {
    SessionRecorder.stopContinuousRecording();
    console.log("🛑 Stopped session recording, waiting for MP3 conversion...");
    
    // Poll until recording is ready, then send to backend
    var pollAttempts = 0;
    var maxAttempts = 50; // Max 5 seconds (50 * 100ms)
    
    var checkRecordingReady = function() {
      pollAttempts++;
      
      SessionRecorder.getRecordingAndText().then(function(data) {
        if (data && data.recordingBlob) {
          console.log("✅ Recording ready after "+pollAttempts+" attempts= "+ (pollAttempts * 100) + "ms");
          const reader = new FileReader();
          reader.onloadend = function() {
            const fullArray = formatQuestionResultsArray();
            updateUserTests(idDigits, ageYears, ageMonths, fullArray, correctAnswers, partialAnswers, wrongAnswers,
                            reader.result, data.timestampText); //MongoDB
          };
          reader.readAsDataURL(data.recordingBlob);
        } else if (pollAttempts < maxAttempts) {
          // Not ready yet, check again in 100ms
          setTimeout(checkRecordingReady, 100);
        } else {
          // Timeout - send without recording
          console.warn("⚠️ Recording conversion timeout after "+maxAttempts+" attempts= " + (maxAttempts * 100) + "ms");
          const fullArray = formatQuestionResultsArray();
          updateUserTests(idDigits, ageYears, ageMonths, fullArray, correctAnswers, partialAnswers, wrongAnswers,
                          null, null); //MongoDB
        }
      }).catch(function(err) {
        console.error("❌ Error checking recording:", err);
        const fullArray = formatQuestionResultsArray();
        updateUserTests(idDigits, ageYears, ageMonths, fullArray, correctAnswers, partialAnswers, wrongAnswers,
                        null, null); //MongoDB
      });
    };
    
    // Start polling after a small initial delay
    setTimeout(checkRecordingReady, 200);
  } else {
    // No recording, send immediately
    const fullArray = formatQuestionResultsArray();
    updateUserTests(idDigits, ageYears, ageMonths, fullArray, correctAnswers, partialAnswers, wrongAnswers,
                    null, null); //MongoDB
  }
}


  function checkCurrentQuestionImages() {
    const q = questions[getCurrentQuestionIndex()];
    if (!q) {
      setCurrentQuestionImagesLoaded(false);
      return;
    }
    
    const loaded = ImageLoader.areImagesLoaded(q.query_number, q.image_count);
    setCurrentQuestionImagesLoaded(loaded);
  }

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Update priority when age is confirmed - load all questions in order
  React.useEffect(function updateLoadingPriority() {
    if (!ageConfirmed || allQuestions.length === 0) return;

    // Load all age groups in order of priority
    const labels = ["2:00-2:06", "2:07-3:00", "3:00-4:00", "4:00-5:00", "5:00-6:00"];
    ImageLoader.updatePriority(labels);
  }, [ageConfirmed, allQuestions]);

  // Load all questions in order
  React.useEffect(
    function loadAllQuestionsEffect() {
      if (allQuestions.length > 0 && ageConfirmed) {
        loadAllQuestions();
      }
    },
    [allQuestions, ageConfirmed]
  );

  // Load current question
  React.useEffect(
    function loadCurrentQuestion() {
      if (ageConfirmed && questions.length > 0 && !sessionCompleted) {
        const idx = getCurrentQuestionIndex();
        loadQuestion(idx);
        checkCurrentQuestionImages();
      }
    },
    [ageConfirmed, questions, currentIndex, sessionCompleted]
  );

  // Monitor if current question images are loaded
  React.useEffect(function monitorImageLoading() {
    if (!ageConfirmed || questions.length === 0 || sessionCompleted) {
      return;
    }

    const interval = setInterval(checkCurrentQuestionImages, 100);
    return function() {
      clearInterval(interval);
    };
  }, [ageConfirmed, questions, currentIndex, sessionCompleted]);

 
  // =============================================================================
  // RENDER
  // =============================================================================

  function ProgressBar() {
    const currentIdx = getCurrentQuestionIndex();
    const totalQuestions = questions.length;
    const progressPercentage = totalQuestions > 0 ? (currentIdx / totalQuestions) * 100 : 0;
    
    return React.createElement(
      "div",
      { className: "progress-bar-container" },
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "15px", width: "100%" } },
        // Pause/Resume button on the left (only show during active test)
        voiceIdentifierConfirmed && !sessionCompleted
          ? React.createElement(
              "button",
              {
                className: "pause-button",
                onClick: isPaused ? resumeTest : pauseTest,
                style: {
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: isPaused ? "#4CAF50" : "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  flexShrink: 0,
                  minWidth: "100px"
                }
              },
              isPaused ? "▶️ Resume" : "⏸️ Pause"
            )
          : null,
        // Progress bar and text in the remaining space
        React.createElement(
          "div",
          { style: { flex: 1 } },
          React.createElement(
            "div",
            { className: "progress-bar" },
            React.createElement(
              "div",
              { 
                className: "progress-fill",
                style: { width: progressPercentage + "%" }
              }
            )
          ),
          React.createElement(
            "div",
            { className: "progress-text" },
            currentIdx + " / " + totalQuestions + " questions answered"
          )
        )
      )
    );
  }
  

  if (!ageConfirmed && !ageInvalid) {
    return React.createElement(
      "div",
      { className: "age-screen" },
      React.createElement("h2", null, "Please enter your age and id"),
      React.createElement("input", {
        type: "number",
        placeholder: "Years",
        value: ageYears,
        onChange: function(e) {
          setAgeYears(e.target.value.replace(/\D/g, ""));
        },
      }),
      React.createElement("input", {
        type: "number",
        placeholder: "Months",
        value: ageMonths,
        onChange: function(e) {
          setAgeMonths(e.target.value.replace(/\D/g, ""));
        },
      }),
      React.createElement("input", {
        type: "number",
        placeholder: "id",
        value: idDigits,
        onChange: function(e) {
          setId(e.target.value.replace(/\D/g, ""));
        },
      }),
      React.createElement(
        "button",
        { onClick: confirmAge },
        "Continue"
      )
    );
  }

  if (ageInvalid) {
    return React.createElement("div", { className: "age-invalid" }, "Sorry, this age does not fit.");
  }

  if (!permission && !microphoneSkipped) {
    return React.createElement(
      "div",
      { className: "microphone-permission-screen" },
      React.createElement("h2", null, "Microphone Permission"),
      React.createElement("p", null, "This test includes recording questions. Please allow microphone access."),
      React.createElement(
        "button",
        { className : "allowMic",
          onClick: getMicrophonePermission },
        "Allow Microphone"
      ),
      React.createElement(
        "button",
        { className : "skipMic",
          onClick: skipMicrophone,
        },
        "Skip (No Recording)"
      )
    );
  }

  if ((permission || microphoneSkipped) && !voiceIdentifierConfirmed) {
    // Show loading screen while validating
    if (readingValidationInProgress) {
      return React.createElement(
        "div",
        { className: "voice-identifier-screen" },
        React.createElement("h2", null, "Validating Reading..."),
        React.createElement("p", { style: { fontSize: "18px", color: "#666", margin: "30px 0" } }, 
          "Please wait while we verify your reading."
        ),
        React.createElement(
          "div",
          { 
            style: {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px"
            }
          },
          React.createElement(
            "div",
            {
              style: {
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #4CAF50",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }
            }
          )
        )
      );
    }
    
    // Show validation result screen if validation has been attempted
    if (readingValidationResult !== null || readingRecordingBlob !== null) {
      if (readingValidationResult === true) {
        // Valid - show continue button
        return React.createElement(
          "div",
          { className: "voice-identifier-screen" },
          React.createElement("h2", null, "Reading Validated"),
          React.createElement("p", { style: { fontSize: "18px", color: "#4CAF50", margin: "20px 0" } }, 
            "✅ Your reading has been validated successfully!"
          ),
          React.createElement(
            "button",
            { 
              className: "continue-button",
              onClick: handleReadingValidationContinue,
              style: {
                padding: "12px 24px",
                fontSize: "18px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                marginTop: "20px"
              }
            },
            "Continue to Test"
          )
        );
      } else if (readingValidationResult === false) {
        // Invalid - show retry message
        return React.createElement(
          "div",
          { className: "voice-identifier-screen" },
          React.createElement("h2", null, "Reading Not Valid"),
          React.createElement("p", { style: { fontSize: "18px", color: "#c62828", margin: "20px 0" } }, 
            "❌ Please try reading the sentence again."
          ),
          React.createElement(
            "div",
            { style: { display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" } },
            React.createElement(
              "button",
              { 
                className: "continue-button",
                onClick: handleReadingValidationRetry,
                style: {
                  padding: "12px 24px",
                  fontSize: "18px",
                  backgroundColor: "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }
              },
              "Try Again"
            ),
            // Show skip button in developer mode only
            devMode
              ? React.createElement(
                  "button",
                  { 
                    className: "continue-button",
                    onClick: handleReadingValidationContinue,
                    style: {
                      padding: "12px 24px",
                      fontSize: "18px",
                      backgroundColor: "#9E9E9E",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }
                  },
                  "Skip (Dev Mode)"
                )
              : null
          )
        );
      } else {
        // No connection - show options
        return React.createElement(
          "div",
          { className: "voice-identifier-screen" },
          React.createElement("h2", null, "No Backend Connection"),
          React.createElement("p", { style: { fontSize: "16px", color: "#666", margin: "20px 0" } }, 
            "Unable to connect to the backend for validation."
          ),
          React.createElement(
            "div",
            { style: { display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" } },
            React.createElement(
              "button",
              { 
                className: "continue-button",
                onClick: handleReadingValidationContinue,
                style: {
                  padding: "12px 24px",
                  fontSize: "18px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }
              },
              "Continue Without Backend"
            ),
            React.createElement(
              "button",
              { 
                className: "continue-button",
                onClick: handleReadingValidationRetry,
                style: {
                  padding: "12px 24px",
                  fontSize: "18px",
                  backgroundColor: "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }
              },
              "Try Reading Again"
            )
          )
        );
      }
    }
    
    // Show reading instruction screen
    return React.createElement(
      "div",
      { className: "voice-identifier-screen" },
      React.createElement("h2", null, "Voice Identifier"),
      permission && sessionRecordingStarted
        ? React.createElement(
            "div",
            { 
              style: {
                backgroundColor: "#ffebee",
                padding: "10px 20px",
                borderRadius: "8px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }
            },
            React.createElement("span", { style: { fontSize: "20px" } }, "🔴"),
            React.createElement("span", { style: { fontWeight: "bold", color: "#c62828" } }, "Recording in Progress")
          )
        : null,
      React.createElement("p", null, "Please read the following sentence out loud:"),
      React.createElement(
        "div",
        { 
          className: "hebrew-text",
          style: {
            fontSize: "24px",
            fontWeight: "bold",
            margin: "30px 0",
            padding: "20px",
            backgroundColor: "#f0f0f0",
            borderRadius: "8px",
            direction: "rtl"
          }
        },
        "בואו נתחיל את המשחק, וננסה לענות על תשובות באופן נכון"
      ),
      React.createElement("p", { style: { fontSize: "14px", color: "#666", fontStyle: "italic" } }, 
        "After reading the sentence, click Continue to validate your reading"
      ),
      React.createElement(
        "button",
        { 
          className: "continue-button",
          onClick: confirmVoiceIdentifier,
          style: {
            padding: "12px 24px",
            fontSize: "18px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginTop: "20px"
          }
        },
        "Continue"
      )
    );
  }

  if (sessionCompleted) {
    const totalAnswered = correctAnswers + partialAnswers + wrongAnswers;
    
    // Download recording function
    const downloadRecording = function() {
      // Use synchronous version since we're in a synchronous context
      const recordingUrl = SessionRecorder.getFinalRecordingUrlSync();
      if (recordingUrl) {
        const a = document.createElement("a");
        a.href = recordingUrl;
        // Get the file extension (.mp3)
        const fileExt = SessionRecorder.getCurrentFileExtension();
        a.download = "session_recording_" + idDigits + "_" + Date.now() + fileExt;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("📥 Downloaded session recording as MP3");
      } else {
        alert("No recording available to download");
      }
    };
    
    // Download timestamp file function
    const downloadTimestamps = function() {
      SessionRecorder.downloadTimestampFile(idDigits);
    };
    
    // Download both files function
    const downloadBoth = function() {
      // Download recording first
      const recordingUrl = SessionRecorder.getFinalRecordingUrlSync();
      if (recordingUrl) {
        const a = document.createElement("a");
        a.href = recordingUrl;
        const fileExt = SessionRecorder.getCurrentFileExtension();
        a.download = "session_recording_" + idDigits + "_" + Date.now() + fileExt;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("📥 Downloaded session recording as MP3");
      }
      
      // Download timestamps after a short delay to avoid browser blocking
      setTimeout(function() {
        SessionRecorder.downloadTimestampFile(idDigits);
      }, 500);
    };
    
    return React.createElement(
      "div",
      { className: "session-complete" },
      React.createElement("h2", null, "Congratulations!"),
      React.createElement("p", null, 
        "Your child got " + correctAnswers + " correct by themselves, " +
        partialAnswers + " correct with your help, " +
        "and " + wrongAnswers + " wrong."
      ),
      React.createElement("p", null, 
        "Total questions answered: " + totalAnswered + " / " + questions.length
      ),
      // Download buttons container
      React.createElement(
        "div",
        { style: { marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" } },
        // Download both button (main action) - show if recording exists
        sessionRecordingStarted
          ? React.createElement(
              "button",
              {
                style: {
                  padding: "12px 24px",
                  fontSize: "18px",
                  backgroundColor: "#FF6B35",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                },
                onClick: downloadBoth
              },
              "📦 Download Both (MP3 + Timestamps)"
            )
          : null,
        // Download button for recording only - show if recording exists
        sessionRecordingStarted
          ? React.createElement(
              "button",
              {
                style: {
                  padding: "10px 20px",
                  fontSize: "16px",
                  backgroundColor: "#42ABC7",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                },
                onClick: downloadRecording
              },
              "📥 Recording Only (MP3)"
            )
          : null,
        // Download button for timestamps only - always show on completion screen
        React.createElement(
          "button",
          {
            style: {
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            },
            onClick: downloadTimestamps
          },
          "📄 Timestamps Only"
        )
      )
    );
  }


  if (questions.length === 0) {
    return React.createElement("div", null, "No questions found for current level");
  }

  // Show loading screen ONLY if current question images aren't ready
  if (!currentQuestionImagesLoaded) {
    return React.createElement(
      "div",
      { className: "question-loading-screen" },
      React.createElement("h2", null, "Loading question..."),
      React.createElement("p", null, "Please wait while images load")
    );
  }

  const currentIdx = getCurrentQuestionIndex();
  const currentQuestion = questions[currentIdx];
  const currentQuestionAgeGroup = currentQuestion ? currentQuestion.age_group : "";

 // Main UI
  return React.createElement(
    "div",
    { 
      className: "app-container",
      style: devMode ? { backgroundColor: "#808080" } : {}
    },
    devMode
      ? React.createElement(
          "div",
          { className: "dev-mode-indicator", style: { padding: "10px", textAlign: "center" } },
          React.createElement("button", {
            style: {
              backgroundColor: "#ff6b6b",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold"
            },
            onClick: function() {
              setDevMode(false)
            }
          }, "TURN OFF DEV MODE"),  // <-- Added comma here
          React.createElement("input", {
            type: "number", 
            className: "dev-mode-input"  

          })
        )
        
      : null,
    // Paused overlay
    isPaused
      ? React.createElement(
          "div",
          {
            className: "paused-overlay",
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999
            }
          },
          React.createElement("h1", { style: { color: "white", fontSize: "48px", marginBottom: "20px" } }, "⏸️ PAUSED"),
          React.createElement("p", { style: { color: "white", fontSize: "20px", marginBottom: "30px" } }, 
            "Test is paused. Recording stopped."
          ),
          React.createElement(
            "button",
            {
              onClick: resumeTest,
              style: {
                padding: "15px 40px",
                fontSize: "20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold"
              }
            },
            "▶️ Resume Test"
          )
        )
      : null,
    // AFK Warning popup
    showAfkWarning && !isPaused
      ? React.createElement(
          "div",
          {
            className: "afk-warning-overlay",
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9998
            }
          },
          React.createElement(
            "div",
            {
              style: {
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
                maxWidth: "400px"
              }
            },
            React.createElement("h2", { style: { marginBottom: "20px", fontSize: "28px" } }, "⚠️ Are you still there?"),
            React.createElement("p", { style: { marginBottom: "30px", fontSize: "18px", color: "#666" } }, 
              "We haven't detected any activity for 5 minutes. The test will pause automatically in 1 minute if you don't respond."
            ),
            React.createElement(
              "button",
              {
                onClick: handleAfkResponse,
                style: {
                  padding: "12px 30px",
                  fontSize: "18px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }
              },
              "Yes, I'm here!"
            )
          )
        )
      : null,
    React.createElement(ProgressBar),
    questionAudio
    ? React.createElement(
        "button",
        {
          className: "replay-audio-btn",
          onClick: replayQuestionAudio,
          disabled: isAudioPlaying
        },
        isAudioPlaying ? "🔊 Playing..." : "🔊 Replay Audio"
      )
    : null,
    React.createElement(
      "div",
      { className: "test-info" },
      React.createElement("p", null, "Question " + (currentIdx + 1) + " of " + questions.length)
    ),

    React.createElement(
      "div",
      { className: "question-row" },
      React.createElement("h2", { className: "query-text" }, (questions[currentIdx] && questions[currentIdx].query) || ""),
      showContinue
        ? React.createElement(
            "div",
            { className: "traffic-light" },
            React.createElement("button", {
              className: "light green",
              onClick: function() { handleContinue("success"); },
            }),
            React.createElement("button", {
              className: "light orange",
              onClick: function() { handleContinue("partial"); },
            }),
            React.createElement("button", {
              className: "light red",
              onClick: function() { handleContinue("failure"); },
            })
          )
        : null
    ),

    questionType === "C"
      ? React.createElement(
          "div",
          { className: "images-container" },
          isTwoRow
            ? React.createElement(
                "div",
                { className: "two-row-layout" },
                // Top row
                React.createElement(
                  "div",
                  { className: "image-row top-row" },
                  images.slice(0, topRowCount).map(function(img, i) {
                    const imgIndex = i + 1;
                    const isCorrectMulti = answerType === "multi" && clickedMultiAnswers.includes(imgIndex);
                    const isTargetSingle = answerType === "single" && img === target && clickedCorrect;
                    const showFireworks = (isTargetSingle || (answerType === "multi" && clickedCorrect) || (answerType === "mask" && clickedCorrect)) || 
                                          (answerType === "ordered" && clickedCorrect && orderedAnswers[orderedAnswers.length - 1] === imgIndex);
                    const isNonClickable = nonClickableImage && imgIndex === nonClickableImage;
                    
                    return React.createElement(
                      "div",
                      { 
                        key: i, 
                        style: { 
                          position: "relative",
                          border: isCorrectMulti ? "4px solid #00ff00" : "none",
                          borderRadius: isCorrectMulti ? "8px" : "0",
                          boxShadow: isCorrectMulti ? "0 0 15px rgba(0,255,0,0.6)" : "none",
                          opacity: isNonClickable ? 0.5 : 1,  
                          cursor: isNonClickable ? "not-allowed" : "pointer"
                        } 
                      },
                      showFireworks
                        ? React.createElement("img", {
                            src: "resources/test_assets/general/fireworks.webp",
                            className: "fireworks",
                            alt: "celebration",
                          })
                        : null,
                      React.createElement("img", {
                        src: img,
                        alt: "option " + (i + 1),
                        className: topRowBigger ? "image top-row-big" : "image",
                        onClick: function(e) { handleClick(img, e); },
                      })
                    );
                  })
                ),
                // Bottom row
                React.createElement(
                  "div",
                  { className: "image-row bottom-row" },
                  images.slice(topRowCount).map(function(img, i) {
                    const imgIndex = topRowCount + i + 1;
                    const isCorrectMulti = answerType === "multi" && clickedMultiAnswers.includes(imgIndex);
                    const isTargetSingle = answerType === "single" && img === target && clickedCorrect;
                    const showFireworks = (isTargetSingle || (answerType === "multi" && clickedCorrect) || (answerType === "mask" && clickedCorrect)) || 
                                          (answerType === "ordered" && clickedCorrect && orderedAnswers[orderedAnswers.length - 1] === imgIndex);
                    const isNonClickable = nonClickableImage && imgIndex === nonClickableImage;
                    
                    return React.createElement(
                      "div",
                      { 
                        key: topRowCount + i, 
                        style: { 
                          position: "relative",
                          border: isCorrectMulti ? "4px solid #00ff00" : "none",
                          borderRadius: isCorrectMulti ? "8px" : "0",
                          boxShadow: isCorrectMulti ? "0 0 15px rgba(0,255,0,0.6)" : "none",
                          opacity: isNonClickable ? 0.5 : 1,
                          cursor: isNonClickable ? "not-allowed" : "pointer"
                        } 
                      },
                      showFireworks
                        ? React.createElement("img", {
                            src: "resources/test_assets/general/fireworks.webp",
                            className: "fireworks",
                            alt: "celebration",
                          })
                        : null,
                      React.createElement("img", {
                        src: img,
                        alt: "option " + (topRowCount + i + 1),
                        className: "image",
                        onClick: function(e) { handleClick(img, e); },
                      })
                    );
                  })
                )
              )
            : // Single row layout (original)
              images.map(function(img, i) {
                const imgIndex = i + 1;
                const isCorrectMulti = answerType === "multi" && clickedMultiAnswers.includes(imgIndex);
                const isTargetSingle = answerType === "single" && img === target && clickedCorrect;
                const showFireworks = (isTargetSingle || (answerType === "multi" && clickedCorrect) || (answerType === "mask" && clickedCorrect)) || 
                                      (answerType === "ordered" && clickedCorrect && orderedAnswers[orderedAnswers.length - 1] === imgIndex);
                const isNonClickable = nonClickableImage && imgIndex === nonClickableImage;
                
                return React.createElement(
                  "div",
                  { 
                    key: i, 
                    style: { 
                      position: "relative",
                      border: isCorrectMulti ? "4px solid #00ff00" : "none",
                      borderRadius: isCorrectMulti ? "8px" : "0",
                      boxShadow: isCorrectMulti ? "0 0 15px rgba(0,255,0,0.6)" : "none",
                      opacity: isNonClickable ? 0.5 : 1,
                      cursor: isNonClickable ? "not-allowed" : "pointer"
                    } 
                  },
                  showFireworks
                    ? React.createElement("img", {
                        src: "resources/test_assets/general/fireworks.webp",
                        className: "fireworks",
                        alt: "celebration",
                      })
                    : null,
                  React.createElement("img", {
                    src: img,
                    alt: "option " + (i + 1),
                    className: "image",
                    onClick: function(e) { handleClick(img, e); },
                  })
                );
              }),
          // Hint chest (if hint text exists)
          hintText && hintText.trim() !== ""
            ? React.createElement(
                "div",
                { className: "hint-container" },
                React.createElement("img", {
                  src: "resources/test_assets/general/chest.webp",
                  className: "hint-chest",
                  alt: "hint",
                  onClick: function() { setShowHint(!showHint); },
                }),
                showHint
                  ? React.createElement(
                      "div",
                      { className: "hint-text" },
                      hintText
                    )
                  : null
              )
            : null,
        )
      : null,

    questionType === "E"
      
      ? React.createElement(
          "div",
          { className: "expression-container" },
          // !microphoneSkipped && countdown > 0
          //   ? React.createElement("h3", null, "Recording starts in " + countdown + "...")
          //   : null,
          // !microphoneSkipped && recording
          //   ? React.createElement(
          //       "div",
          //       { className: "rec-controls" },
          //       !recPaused
          //         ? React.createElement("button", { className: "rec-btn pause", onClick: pauseRecording }, "Pause")
          //         : React.createElement("button", { className: "rec-btn resume", onClick: pauseRecording }, "Resume"),
          //       React.createElement("button", { className: "rec-btn stop", onClick: stopRecording }, "Stop")
          //     )
          //   : null,
          // !microphoneSkipped && recordingStopped
          //   ? React.createElement(
          //       "div",
          //       { className: "audio-replay" },
          //       React.createElement("audio", { src: audioUrl, controls: true }),
          //       React.createElement("div", { className: "rec-controls" },
          //         React.createElement("button", { className: "rec-btn redo", onClick: redoRecording }, "Redo recording")
          //       )
          //     )
          //   : null,
          // microphoneSkipped
          //   ? React.createElement("p", { className : "skippedText" }, "Recording skipped - please evaluate the response")
          //   : null,
          React.createElement(
            "div",
            { className: "images-container" },
            images.map(function(img, i) {
              return React.createElement(
                "div",
                { key: i },
                React.createElement("img", { src: img, alt: "option " + (i + 1), className: "image" })
              );
            })
          )
        )
      : null,
    // Comments display (if comment text exists) - shown for both comprehension and expression questions
    commentText && commentText.trim() !== ""
      ? React.createElement(
          "div",
          {
            style: {
              padding: "8px 12px",
              backgroundColor: "#f0f8ff",
              border: "1px solid #b0d4ff",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#333",
              maxWidth: "90%",
              margin: "10px auto 0",
              textAlign: "center",
              lineHeight: "1.4"
            }
          },
          commentText
        )
      : null
  );
}