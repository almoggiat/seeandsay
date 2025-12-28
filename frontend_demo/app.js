function usePersistentState(key, initialValue) {
  const [state, setState] = React.useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load state for", key, e);
    }
    return initialValue;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state for", key, e);
    }
  }, [key, state]);

  return [state, setState];
}

function App() {
  const [page, setPage] = usePersistentState("page", "home");
  const [csvLoaded, setCsvLoaded] = React.useState(false);
  const [allQuestions, setAllQuestions] = React.useState([]);

  // Load CSV and start image loading as soon as the site opens
  React.useEffect(() => {
    Papa.parse("resources/query_database.csv", {
      download: true,
      header: true,
      complete: function(res) {
        const questions = res.data || [];
        setAllQuestions(questions);
        setCsvLoaded(true);
        
        // Start loading ALL images immediately (no priority yet)
        ImageLoader.startLoading(questions, []);
      },
    });
  }, []);

  // Reset all persistent states
  function resetAll() {
    localStorage.removeItem("ageYears");
    localStorage.removeItem("ageMonths");
    localStorage.removeItem("ageConfirmed");
    localStorage.removeItem("ageInvalid");
    localStorage.removeItem("currentIndex");
    localStorage.removeItem("correctAnswers");
    localStorage.removeItem("partialAnswers");
    localStorage.removeItem("wrongAnswers");
    localStorage.removeItem("permission");
    localStorage.removeItem("microphoneSkipped");
    localStorage.removeItem("voiceIdentifierConfirmed");
    localStorage.removeItem("testPaused");
    localStorage.removeItem("audioChunks");
    localStorage.removeItem("audioUrl");
    localStorage.removeItem("recPaused");
    localStorage.removeItem("devMode");
    localStorage.removeItem("idDigits");
    localStorage.removeItem("sessionCompleted");
    localStorage.removeItem("sessionRecordingStarted");
    
    // Clean up continuous session recording
    localStorage.removeItem("sessionRecordingActive");
    localStorage.removeItem("sessionRecordingUrl");
    localStorage.removeItem("sessionRecordingFinal");
    localStorage.removeItem("sessionRecordingChunks");
    localStorage.removeItem("recordingStartTime");
    localStorage.removeItem("questionTimestamps");

    // validation related
    localStorage.removeItem("readingValidated");
    localStorage.removeItem("readingValidationResult");
    localStorage.removeItem("readingRecordingBlob");


    //resultsrelated
    localStorage.removeItem("correctAnswers");
    localStorage.removeItem("partialAnswers");
    localStorage.removeItem("wrongAnswers");
    localStorage.removeItem("questionResults");

    window.location.reload();
  }
  



  let content;
  if (!csvLoaded) {
    content = React.createElement("div", null, "Loading...");
  } else if (page === "test") {
    content = React.createElement(Test, { allQuestions: allQuestions });
  } else if (page === "help") {
    content = React.createElement(Help);
  } else {
    content = React.createElement(Welcome);
  }

  return React.createElement(
    "div",
    { className: "app-container" },
    React.createElement("div", { className: "page-content" }, content),
    React.createElement(BottomNav, { page: page, setPage: setPage }),
    React.createElement(
      "button",
      {
        className: "reset-button",
        onClick: resetAll,
      },
      "Reset"
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
