function Test() {
  // =============================================================================
  // STATE DECLARATIONS
  // =============================================================================
  
  // CSV data and loading states
  const [allQuestions, setAllQuestions] = React.useState([]);
  const [questions, setQuestions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Persistent states
const [ageYears, setAgeYears] = usePersistentState("ageYears", "");
  const [ageMonths, setAgeMonths] = usePersistentState("ageMonths", "");
  const [ageConfirmed, setAgeConfirmed] = usePersistentState("ageConfirmed", false);
  const [ageInvalid, setAgeInvalid] = usePersistentState("ageInvalid", false);
  const [currentIndex, setCurrentIndex] = usePersistentState("currentIndex", [0,0,0,0,0]);
  const [trackProgress, setProgress] = usePersistentState("trackProgress", [0, 0, 0]); // [successes, failures, partials]
  const [currentLevel, setLevel] = usePersistentState("currentLevel", 0); // 0-4 representing "2:00-2:06", "2:07-3:00", "3:00-4:00", "4:00-5:00", "5:00-6:00"
  const [phase, setPhase] = usePersistentState("phase", "initial")
  const [completeMessege, setCompleteMessege] = usePersistentState("completeMessege", "")
  const [questionType, setQuestionType] = usePersistentState("questionType", "C") // "C" - comprehension(הבנה) "E" - expression(הבעה)

  // Microphone persistent
  const [permission, setPermission] = usePersistentState("permission", false);
  const [audioChunks, setAudioChunks] = usePersistentState("audioChunks", []);
  const [audioUrl, setAudioUrl] = usePersistentState("audioUrl", null);
  const [recPaused, setPaused] = usePersistentState("recPaused", false)

  // Session-only states
  const [images, setImages] = React.useState([]);
  const [target, setTarget] = React.useState("");
  const [showContinue, setShowContinue] = React.useState(false);
  const [clickedCorrect, setClickedCorrect] = React.useState(false);
  const [sessionCompleted, setSessionCompleted] = React.useState(false);
  const [showAdvancedChoice, setShowAdvancedChoice] = React.useState(false);

  // Mic session-only
  const [stream, setStream] = React.useState(null);
  const [mediaRecorder, setMediaRecorder] = React.useState(null);
  const [recording, setRecording] = React.useState(false);

  // Countdown + recording control
  const [countdown, setCountdown] = React.useState(0);
  const [recordingStopped, setRecordingStopped] = React.useState(false);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  function totalMonths() {
    const y = parseInt(ageYears, 10) || 0;
    const m = parseInt(ageMonths, 10) || 0;
    return y * 12 + m;
  }
  function userAgeGroup(age) {
    const benchmarks = [24, 30.5, 35.5, 47.5, 59.5];
    let i = 0;
    while (i < benchmarks.length - 1 && age >= benchmarks[i + 1]) i++;
    return i;
  }
  function ageGroupLabel() {
    const labels = ["2:00-2:06","2:07-3:00","3:00-4:00","4:00-5:00","5:00-6:00"];
    return labels[currentLevel];
  }
  function getCurrentQuestionIndex() {
    return currentIndex[currentLevel];
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  function confirmAge() {
    const y = parseInt(ageYears, 10);
    const m = parseInt(ageMonths, 10);
    if (isNaN(y) || isNaN(m) || m < 0 || m > 11) {
      alert("Please enter a valid age (months 0–11).");
      return;
    }
    const months = totalMonths();
    if (months < 24 || months >= 72) {
      setAgeInvalid(true);
      return;
    }
    const userAge = userAgeGroup(months);
    const initialLevel = Math.max(0, userAge - 1);
    if (initialLevel === userAge) setPhase("standard");
    setLevel(initialLevel);
    setAgeConfirmed(true);
  }

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission(true);
        setStream(streamData);
      } catch (err) {
        alert(err.message);
      }
    } else alert("The MediaRecorder API is not supported in your browser.");
  };

  const handleClick = (img) => {
    if (questionType === "C") {
      const correct = img === target;
      if (correct) setClickedCorrect(true);
      setShowContinue(true);
    }
  };

  const handleContinue = (result) => {
    const progress = updateProgress(result);
    const currentIdx = getCurrentQuestionIndex();
    const [successes, failures] = progress;
    let shouldTransition = false;
    switch (phase) {
      case "initial":
        if (successes >= 3) { transitionToNextPhase("standard", currentLevel+1); shouldTransition=true; }
        else if (failures >= 3) {
          if (currentLevel === 0) return completeSession("Try another time");
          transitionToNextPhase("reevaluation", currentLevel-1); shouldTransition=true;
        }
        break;
      case "reevaluation":
        if (successes >= 3) { transitionToNextPhase("easy", currentLevel+1); shouldTransition=true; }
        else if (failures >= 3) return completeSession("Try another time");
        break;
    }
    if (shouldTransition) return;
    if (currentIdx < questions.length-1) updateCurrentQuestionIndex(currentIdx+1);
    else handleLevelCompletion();
  };

  // Recording controls
  const startRecording = () => {
    if (!stream) return;
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setAudioChunks(chunks);
      setRecording(false);
      setRecordingStopped(true);
    };
    recorder.start();
    setRecording(true);
    setRecordingStopped(false);

    // auto-stop after 1 minute
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 60000);
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") 
      {mediaRecorder.pause();
        setPaused(true)
      }
    else if (mediaRecorder && mediaRecorder.state === "paused") 
      {mediaRecorder.resume();
      setPaused(false)}
  };
  const stopRecording = () => { if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop(); };

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================
  function transitionToNextPhase(newPhase, newLevel) {
    const clampedLevel = Math.max(0, Math.min(4,newLevel));
    setPhase(newPhase);
    setLevel(clampedLevel);
    resetProgressForNewLevel();
  }
  function loadQuestionsForLevel(level) {
    const targetAgeGroup = ageGroupLabel();
    const filtered = allQuestions
      .filter(q=>q.query && q.query_type && q.age_group)
      .map(q=>({...q,query_type:q.query_type.trim().normalize("NFC"),age_group:q.age_group.trim().normalize("NFC"),query:q.query.trim()}))
      .filter(q=>q.age_group===targetAgeGroup);
    const sorted = filtered.sort((a,b)=> a.query_type==="הבנה" && b.query_type!=="הבנה" ? -1 : 1 );
    setQuestions(sorted);
  }
  function updateCurrentQuestionIndex(newIndex) {
    const newArr = [...currentIndex]; newArr[currentLevel]=newIndex; setCurrentIndex(newArr);
  }
  function loadQuestion(index) {
    const q=questions[index]; if (!q) return;
    const imgCount=parseInt(q.image_count)||1;
    const imgs=[]; for (let i=1;i<=imgCount;i++) imgs.push(`resources/test_assets/${q.query_number}/image_${i}.png`);
    setImages(imgs);
    const answerNum=q.answer?parseInt(q.answer):1;
    setTarget(`resources/test_assets/${q.query_number}/image_${answerNum}.png`);
    setQuestionType(q.query_type==="הבנה" ? "C" : "E");
    setShowContinue(false); setClickedCorrect(false);

    // If it's E, start countdown
    if (q.query_type !== "הבנה") {
      setCountdown(3);
      setRecordingStopped(false);
    }
  }
  function updateProgress(result) {
    const newP=[...trackProgress];
    if (result==="success") newP[0]++;
    if (result==="partial") { newP[2]++; if (newP[2]>=2){ newP[1]++; newP[2]=0; } }
    if (result==="failure") newP[1]++;
    setProgress(newP);
    return newP;
  }
  function handleLevelCompletion() {
    const [successes,failures]=trackProgress;
    switch(phase){
      case "initial": transitionToNextPhase("standard",currentLevel+1); break;
      case "reevaluation": transitionToNextPhase("easy",currentLevel+1); break;
      case "standard": if (failures>=3) transitionToNextPhase("easy",Math.max(0,currentLevel-1)); else setShowAdvancedChoice(true); break;
      case "easy": completeSession("Well done!"); break;
      case "hard": completeSession("Well done!"); break;
    }
  }
  function resetProgressForNewLevel(){ setProgress([0,0,0]); }
  function completeSession(msg){ setCompleteMessege(msg); setSessionCompleted(true); setImages([]); }

  // =============================================================================
  // EFFECTS
  // =============================================================================
  React.useEffect(()=>{ Papa.parse("resources/query_database.csv",{download:true,header:true,complete:(res)=>{setAllQuestions(res.data);setLoading(false);}});},[]);
  React.useEffect(()=>{ if (allQuestions.length>0 && ageConfirmed) loadQuestionsForLevel(currentLevel);},[currentLevel,allQuestions,ageConfirmed]);
  React.useEffect(()=>{ if (ageConfirmed && questions.length>0 && !sessionCompleted && !showAdvancedChoice){ const idx=getCurrentQuestionIndex(); loadQuestion(idx);}},[ageConfirmed,questions,currentIndex,currentLevel,sessionCompleted,showAdvancedChoice]);

  // Countdown effect
  React.useEffect(()=>{
    if (countdown>0){
      const timer=setTimeout(()=>setCountdown(c=>c-1),1000);
      return ()=>clearTimeout(timer);
    }
    if (countdown===0 && questionType==="E" && !recording && !recordingStopped) startRecording();
  },[countdown,questionType]);
  //continue after recording effect

  React.useEffect(() => {
  if (recordingStopped) {
    setShowContinue(true);
  }
}, [recordingStopped]);

  // =============================================================================
  // RENDER CONDITIONS
  // =============================================================================
  if (loading) return <div>Loading...</div>;
  if (!ageConfirmed && !ageInvalid) return (
    <div className="age-screen">
      <h2>Please enter your age</h2>
      <input type="number" placeholder="Years" value={ageYears} onChange={e=>setAgeYears(e.target.value.replace(/\D/g,""))}/>
      <input type="number" placeholder="Months" value={ageMonths} onChange={e=>setAgeMonths(e.target.value.replace(/\D/g,""))}/>
      <button onClick={confirmAge}>Continue</button>
    </div>);
  if (ageInvalid) return <div className="age-invalid">Sorry, this age does not fit.</div>;
  if (!permission) return <div><button onClick={getMicrophonePermission}>Get Microphone</button></div>;
  if (sessionCompleted) return <div className="session-complete"><h2>Session Complete!</h2><p>{completeMessege}</p></div>;
  if (showAdvancedChoice) return (
    <div className="advanced-choice">
      <h2>Choice: "Try advanced questions?"</h2>
      <button onClick={()=>handleAdvancedChoice(true)}>Yes</button>
      <button onClick={()=>handleAdvancedChoice(false)}>No</button>
    </div>);
  if (questions.length===0) return <div>No questions found for current level</div>;

  const currentIdx=getCurrentQuestionIndex();
  const phaseNames={"initial":"Initial Evaluation","reevaluation":"Reevaluation","standard":"Standard Test","easy":"Easy Level","hard":"Hard Level"};

  return (
    <div className="app-container">
      <div className="test-info">
        <h3>Phase: {phaseNames[phase]} - Level: {ageGroupLabel()}</h3>
        <p>Progress: {trackProgress[0]} successes, {trackProgress[1]} failures, {trackProgress[2]} partials</p>
        <p>Question {currentIdx+1} of {questions.length}</p>
      </div>

      <div className="question-row">
        <h2 className="query-text">{questions[currentIdx] && questions[currentIdx].query}</h2>
        {/* Traffic light shows after recording stops (E) or after clicking (C) */}
        {showContinue && (
          <div className="traffic-light">
            <button className="light green" onClick={()=>handleContinue("success")}></button>
            <button className="light orange" onClick={()=>handleContinue("partial")}></button>
            <button className="light red" onClick={()=>handleContinue("failure")}></button>
          </div>
        )}
      </div>

      {/* Question images */}
      {questionType==="C" && (
        <div className="images-container">
          {images.map((img,i)=>(
            <div key={i} style={{position:"relative"}}>
              {img===target && clickedCorrect && (
                <img src="resources/test_assets/general/fireworks.png" className="fireworks" alt="celebration"/>
              )}
              <img src={img} alt={`option ${i+1}`} className="image" onClick={()=>handleClick(img)}/>
            </div>
          ))}
        </div>
      )}

      {questionType==="E" && (
        <div className="expression-container">
          {countdown>0 && <h3>Recording starts in {countdown}...</h3>}
          {recording && <div>
            {!recPaused && (<button onClick={pauseRecording}>Pause</button>)}
            {recPaused && (<button onClick={pauseRecording}>Resume</button>)}
            <button onClick={stopRecording}>Stop</button></div>}
          {recordingStopped && (
            <div>
              <audio src={audioUrl} controls></audio>
            </div>
          )}
          <div className="images-container">
            {images.map((img,i)=>(
              <div key={i}><img src={img} alt={`option ${i+1}`} className="image"/></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
