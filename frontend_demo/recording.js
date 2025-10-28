// =============================================================================
// CONTINUOUS SESSION RECORDING MODULE
// Records from session start until completion
// =============================================================================

const SessionRecorder = (function() {
  let mediaRecorder = null;
  let audioChunks = [];
  let stream = null;
  let isRecording = false;

  // Get browser-supported audio mime type
  function getSupportedMimeType() {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg"
    ];
    
    for (let i = 0; i < candidates.length; i++) {
      if (MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidates[i])) {
        return candidates[i];
      }
    }
    return "";
  }

  // Start continuous session recording
  async function startContinuousRecording() {
    try {
      // Request microphone access
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = userStream;

      // Get preferred mime type
      const preferredMime = getSupportedMimeType();
      const recorderOptions = preferredMime ? { mimeType: preferredMime } : undefined;

      // Create MediaRecorder
      const recorder = new MediaRecorder(userStream, recorderOptions);
      mediaRecorder = recorder;
      audioChunks = [];

      // Handle data available
      recorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          // Note: We save to localStorage only on stop to avoid performance issues
        }
      };

      // Handle recording stop
      recorder.onstop = function() {
        const blobType = preferredMime || (audioChunks[0] && audioChunks[0].type) || "audio/webm";
        const blob = new Blob(audioChunks, { type: blobType });
        const url = URL.createObjectURL(blob);
        
        // Save final recording to localStorage for persistence through page refresh
        const reader = new FileReader();
        reader.onloadend = function() {
          try {
            const base64data = reader.result;
            localStorage.setItem("sessionRecordingFinal", JSON.stringify({
              audio: base64data,
              mimeType: blobType,
              timestamp: Date.now()
            }));
            console.log("✅ Saved recording to localStorage");
          } catch (e) {
            console.warn("Failed to save final recording:", e);
          }
        };
        
        reader.onerror = function() {
          console.warn("Error reading recording blob");
        };
        
        reader.readAsDataURL(blob);
        
        localStorage.setItem("sessionRecordingUrl", url);
        console.log("✅ Session recording completed, length:", audioChunks.length);
      };

      // Start recording
      recorder.start(10000); // Collect data every 10 seconds
      isRecording = true;
      
      // Store in localStorage
      localStorage.setItem("sessionRecordingActive", "true");

      console.log("🎙️ Started continuous session recording");
      return true;
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      return false;
    }
  }

  // Stop continuous recording
  function stopContinuousRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      isRecording = false;
      localStorage.removeItem("sessionRecordingActive");
      
      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
        stream = null;
      }
      
      console.log("🛑 Stopped continuous session recording");
      return true;
    }
    return false;
  }

  // Get final recording URL
  function getFinalRecordingUrl() {
    const stored = localStorage.getItem("sessionRecordingUrl");
    if (stored) {
      return stored;
    }
    
    // Try to reconstruct from localStorage data
    const finalData = localStorage.getItem("sessionRecordingFinal");
    if (finalData) {
      try {
        const data = JSON.parse(finalData);
        const blob = dataURLtoBlob(data.audio);
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error("Failed to reconstruct recording:", e);
      }
    }
    
    return null;
  }

  // Helper to convert data URL to Blob
  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Get final recording data for upload
  async function getFinalRecordingData() {
    const finalData = localStorage.getItem("sessionRecordingFinal");
    if (finalData) {
      try {
        return JSON.parse(finalData);
      } catch (e) {
        console.error("Failed to parse final recording data:", e);
      }
    }
    return null;
  }

  // Check if recording is active
  function isRecordingActive() {
    return isRecording || localStorage.getItem("sessionRecordingActive") === "true";
  }

  // Clean up on session end
  function cleanup() {
    stopContinuousRecording();
    localStorage.removeItem("sessionRecordingActive");
    localStorage.removeItem("sessionRecordingUrl");
    localStorage.removeItem("sessionRecordingFinal");
    localStorage.removeItem("sessionRecordingChunks");
    console.log("🧹 Cleaned up session recording");
  }

  // Public API
  return {
    startContinuousRecording: startContinuousRecording,
    stopContinuousRecording: stopContinuousRecording,
    getFinalRecordingUrl: getFinalRecordingUrl,
    getFinalRecordingData: getFinalRecordingData,
    isRecordingActive: isRecordingActive,
    cleanup: cleanup
  };
})();

