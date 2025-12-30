function BottomNav({ page, setPage, t }) {
  return (
    <div className="bottom-nav">
      <button
        type="button"
        className={page === "home" ? "active" : ""}
        onClick={() => setPage("home")}
        aria-current={page === "home" ? "page" : undefined}
        aria-label={t ? t("nav.home.aria") : "Home"}
      >
        <span className="icon">🏠</span>
        <span className="label">{t ? t("nav.home") : "Home"}</span>
      </button>

      <button
        type="button"
        className={page === "test" ? "active" : ""}
        onClick={() => setPage("test")}
        aria-current={page === "test" ? "page" : undefined}
        aria-label={t ? t("nav.test.aria") : "Test"}
      >
        <span className="icon">🧪</span>
        <span className="label">{t ? t("nav.test") : "Test"}</span>
      </button>

      <button
        type="button"
        className={page === "help" ? "active" : ""}
        onClick={() => setPage("help")}
        aria-current={page === "help" ? "page" : undefined}
        aria-label={t ? t("nav.help.aria") : "Help"}
      >
        <span className="icon">💡</span>
        <span className="label">{t ? t("nav.help") : "Help"}</span>
      </button>
    </div>
  );
}
