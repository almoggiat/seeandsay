function MicTest() {
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const audioRef = React.useRef(null);

  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const timerRef = React.useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = []; // reset chunks
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setAudioUrl(url);
        setIsRecording(false);

        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(() => {
            console.log("Autoplay blocked — tap replay to listen.");
          });
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 5000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Microphone access failed. Please allow mic permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearTimeout(timerRef.current);
    }
  };

  const replayRecording = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return (
    <div className="mic-test-container">
      <h2 className="mic-test-title">🎙️ בדיקת מיקרופון</h2>

      <div className="mic-test-controls">
        <button
          id="start-btn"
          className="mic-btn start-btn"
          onClick={startRecording}
          disabled={isRecording}
        >
          {isRecording ? "⏺️ מקליט..." : "🎙️ התחל הקלטה"}
        </button>

        {isRecording && (
          <button
            id="stop-btn"
            className="mic-btn stop-btn"
            onClick={stopRecording}
          >
            ⏹️ עצור מוקדם
          </button>
        )}
      </div>

      <div className="mic-test-playback">
        <audio id="audio-player" ref={audioRef} src={audioUrl || ""} controls />
        {audioUrl && (
          <button id="replay-btn" className="mic-btn replay-btn" onClick={replayRecording}>
            🔁 השמע שוב
          </button>
        )}
      </div>
    </div>
  );
}
