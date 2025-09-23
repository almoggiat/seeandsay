function BottomNav({ page, setPage }) {
  return (
    <div className="bottom-nav">
      <button
        className={page === "home" ? "active" : ""}
        onClick={() => setPage("home")}
      >
        <span className="icon">🏠</span>
        <span className="label">בית</span>
      </button>

      <button
        className={page === "test" ? "active" : ""}
        onClick={() => setPage("test")}
      >
        <span className="icon">🧪</span>
        <span className="label">מבחן</span>
      </button>

      <button
        className={page === "AudioRecorder" ? "active" : ""}
        onClick={() => setPage("AudioRecorder")}
      >
        <span className="icon">🎤</span>
        <span className="label">בדיקת מיקרופון</span>
      </button>
    </div>
  );
}
