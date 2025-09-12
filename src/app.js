function App() {
  const [page, setPage] = React.useState("home");

  let content;
  if (page === "test") {
    content = <Test />;
  } else if (page === "mic") {
    content = <MicTest />;
  } else {
    content = <Welcome />;
  }

  return (
    <div className="app-container">
      <div className="page-content">{content}</div>
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
