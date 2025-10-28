// =============================================================================
// CONTINUOUS SESSION RECORDING MODULE
// Records from session start until completion
// =============================================================================

const SessionRecorder = (function() {
  let mediaRecorder = null;
  let audioChunks = [];
  let stream = null;
  let isRecording = false;

  // Get browser-supported audio mime type (prioritize MP4/AAC for MP3-compatible output)
  function getSupportedMimeType() {
    // Prioritize MP4/AAC format for better compatibility (closer to MP3)
    const candidates = [
      "audio/mp4;codecs=mp4a.40.2",  // AAC in MP4 container (MP3-compatible)
      "audio/mp4",                   // MP4 container
      "audio/webm;codecs=opus",      // Fallback: webm with opus
      "audio/webm",                  // Fallback: webm
      "audio/ogg;codecs=opus",       // Fallback: ogg with opus
      "audio/ogg"                    // Fallback: ogg
    ];
    
    for (let i = 0; i < candidates.length; i++) {
      if (MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidates[i])) {
        return candidates[i];
      }
    }
    return "audio/webm"; // Default fallback
  }

  // Get file extension based on mime type
  function getFileExtension(mimeType) {
    // Always return .mp3 since we'll convert everything to MP3
    return ".mp3";
  }

  // Convert audio blob to MP3
  async function convertToMP3(blob) {
    return new Promise(function(resolve, reject) {
      try {
        // Create audio context to decode the audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
          audioContext.decodeAudioData(fileReader.result)
            .then(function(audioBuffer) {
              // Convert AudioBuffer to PCM data
              const samples = audioBuffer.getChannelData(0); // Mono
              const sampleRate = audioBuffer.sampleRate;
              
              // Use lamejs to encode to MP3
              const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // Mono, sampleRate, bitrate
              const sampleBlockSize = 1152;
              const mp3Data = [];
              
              for (let i = 0; i < samples.length; i += sampleBlockSize) {
                const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                  mp3Data.push(mp3buf);
                }
              }
              
              // Finalize
              const mp3buf = mp3encoder.flush();
              if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
              }
              
              // Create MP3 blob
              const mp3Blob = new Blob(mp3Data, { type: "audio/mpeg" });
              resolve(mp3Blob);
            })
            .catch(function(err) {
              console.error("Failed to decode audio:", err);
              resolve(blob); // Fallback to original blob
            });
        };
        
        fileReader.onerror = function() {
          console.error("Failed to read audio file");
          resolve(blob); // Fallback to original blob
        };
        
        fileReader.readAsArrayBuffer(blob);
      } catch (err) {
        console.error("Error converting to MP3:", err);
        resolve(blob); // Fallback to original blob
      }
    });
  }

  // Store the mime type globally
  let currentMimeType = "";

  // Get current mime type
  function getCurrentMimeType() {
    return currentMimeType;
  }

  // Get current file extension
  function getCurrentFileExtension() {
    return getFileExtension(currentMimeType);
  }

  // Start continuous session recording
  async function startContinuousRecording() {
    try {
      // Request microphone access
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = userStream;

      // Get preferred mime type (prioritize MP4/AAC for MP3 compatibility)
      const preferredMime = getSupportedMimeType();
      currentMimeType = preferredMime; // Store for later use
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
      recorder.onstop = async function() {
        const blobType = preferredMime || currentMimeType || (audioChunks[0] && audioChunks[0].type) || "audio/webm";
        const originalBlob = new Blob(audioChunks, { type: blobType });
        
        // Convert to MP3
        console.log("🎵 Converting recording to MP3...");
        const mp3Blob = await convertToMP3(originalBlob);
        const url = URL.createObjectURL(mp3Blob);
        
        // Save final MP3 recording to localStorage for persistence through page refresh
        const reader = new FileReader();
        reader.onloadend = function() {
          try {
            const base64data = reader.result;
            localStorage.setItem("sessionRecordingFinal", JSON.stringify({
              audio: base64data,
              mimeType: "audio/mpeg", // MP3 mime type
              timestamp: Date.now()
            }));
            console.log("✅ Saved MP3 recording to localStorage");
          } catch (e) {
            console.warn("Failed to save final recording:", e);
          }
        };
        
        reader.onerror = function() {
          console.warn("Error reading recording blob");
        };
        
        reader.readAsDataURL(mp3Blob);
        
        localStorage.setItem("sessionRecordingUrl", url);
        console.log("✅ Session recording completed and converted to MP3, length:", audioChunks.length);
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
  async function getFinalRecordingUrl() {
    const stored = localStorage.getItem("sessionRecordingUrl");
    if (stored) {
      return stored;
    }
    
    // Try to reconstruct from localStorage data
    const finalData = localStorage.getItem("sessionRecordingFinal");
    if (finalData) {
      try {
        const data = JSON.parse(finalData);
        currentMimeType = data.mimeType || currentMimeType; // Update mime type
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

  // Get final recording URL (synchronous version for immediate use)
  function getFinalRecordingUrlSync() {
    const stored = localStorage.getItem("sessionRecordingUrl");
    if (stored) {
      return stored;
    }
    return null;
  }

  // Public API
  return {
    startContinuousRecording: startContinuousRecording,
    stopContinuousRecording: stopContinuousRecording,
    getFinalRecordingUrl: getFinalRecordingUrl,
    getFinalRecordingUrlSync: getFinalRecordingUrlSync, // Add synchronous version
    getFinalRecordingData: getFinalRecordingData,
    getCurrentMimeType: getCurrentMimeType,
    getCurrentFileExtension: getCurrentFileExtension,
    isRecordingActive: isRecordingActive,
    cleanup: cleanup
  };
})();

