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
        className={page === "help" ? "active" : ""}
        onClick={() => setPage("help")}
      >
        <span className="icon">💡</span>
        <span className="label">עזרה</span>
      </button>
    </div>
  );
}
