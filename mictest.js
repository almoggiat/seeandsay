const AudioRecorder = () => {
    const [permission, setPermission] = React.useState(false);
    const [stream, setStream] = React.useState(null);
    const [recording, setRecording] = React.useState(false);
    const [mediaRecorder, setMediaRecorder] = React.useState(null);
    const [audioChunks, setAudioChunks] = React.useState([]);
    const [audioUrl, setAudioUrl] = React.useState(null);

    const getMicrophonePermission = async () => {
        if ("MediaRecorder" in window) {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                setPermission(true);
                setStream(streamData);
            } catch (err) {
                alert(err.message);
            }
        } else {
            alert("The MediaRecorder API is not supported in your browser.");
        }
    };

    const startRecording = () => {
        setRecording(true);
        // Clear previous recording
        setAudioUrl(null);
        
        const media = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        setMediaRecorder(media);

        media.start();
        
        const localAudioChunks = [];
        media.ondataavailable = (event) => {
            if (event.data.size > 0) {
                localAudioChunks.push(event.data);
            }
        };
        setAudioChunks(localAudioChunks);
    };

    const stopRecording = () => {
        setRecording(false);
        mediaRecorder.stop();
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            
            // Reset for next recording
            setAudioChunks([]);
        };
    };

    return (
        <div>
            <h2>Audio Recorder</h2>
            <main>
                <div className="audio-controls">
                    {!permission ? (
                        <button onClick={getMicrophonePermission} type="button">
                            Get Microphone
                        </button>
                    ) : null}
                    
                    {permission && !recording ? (
                        <button onClick={startRecording} type="button">
                            Start Recording
                        </button>
                    ) : null}
                    
                    {recording ? (
                        <button onClick={stopRecording} type="button">
                            Stop Recording
                        </button>
                    ) : null}
                </div>

                {audioUrl && (
                    <div className="audio-playback">
                        <h3>Recording:</h3>
                        <audio controls src={audioUrl}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
            </main>
        </div>
    );
};