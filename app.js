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

  // Reset all persistent states
function resetAll() {
  // Clear all persistent states
  localStorage.removeItem("ageYears");
  localStorage.removeItem("ageMonths");
  localStorage.removeItem("ageConfirmed");
  localStorage.removeItem("ageInvalid");
  localStorage.removeItem("currentIndex");
  localStorage.removeItem("trackProgress");
  localStorage.removeItem("currentLevel");
  localStorage.removeItem("phase");
  localStorage.removeItem("completeMessege");
  localStorage.removeItem("questionType")
  localStorage.removeItem("permission")
  localStorage.removeItem("audioChunks")
  localStorage.removeItem("audioUrl")
  localStorage.removeItem("recPaused")

  // Reload React state to initial values
  window.location.reload();
}

  let content;
  if (page === "test") {
    content = <Test />;
  } else if (page === "AudioRecorder") {
    content = <AudioRecorder />;
  } else {
    content = <Welcome />;
  }

  return (
    <div className="app-container">
      <div className="page-content">{content}</div>
      <BottomNav page={page} setPage={setPage} />

      {/* Global Reset Button */}
      <button
        className="reset-button"
        onClick={resetAll}
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          padding: "10px 16px",
          background: "red",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Reset
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);