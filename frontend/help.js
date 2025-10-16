function Help() {
  return (
    <div className="content-area">
      <h1>How to Use This App</h1>
      <p>
        Welcome! This app is designed to guide you through interactive questions
        where you respond by selecting images and tracking your progress. Here’s
        how to navigate and use the interface:
      </p>

      <h2>1. Answering Questions</h2>
      <ul>
        <li>Read the question displayed at the top of the screen.</li>
        <li>Look at the images shown below and click the one that best answers the question.</li>
        <li>If your choice is correct, a small fireworks effect will appear above the image.</li>
      </ul>

      <h2>2. Traffic Light Buttons</h2>
      <ul>
        <li><strong>Green</strong> – Mark a question as answered correctly and confidently.</li>
        <li><strong>Orange</strong> – Mark if you’re unsure or want to revisit the question later.</li>
        <li><strong>Red</strong> – Mark a question as incorrect or that you need more practice.</li>
      </ul>

      <h2>3. Navigation Bar</h2>
      <p>
        At the bottom of the screen, you’ll find the navigation bar. Use it to move between
        different sections of the app. The active section is highlighted in blue.
      </p>

      <h2>4. Resetting Progress</h2>
      <p>
        A red “Reset” button is located in the bottom-right corner. Click it to clear your progress
        and start over from the beginning.
      </p>

      <h2>5. Age Input Screen</h2>
      <p>
        When prompted, enter your age to make sure the experience is tailored for you.
        If the input is invalid, you’ll see a red error message.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>Hover over buttons for visual feedback.</li>
        <li>Use the traffic light system to track your confidence as you go.</li>
        <li>You can return to this Help page anytime from the navigation bar.</li>
      </ul>

      <p style={{ marginTop: "20px", fontWeight: "bold" }}>
        That’s it — you’re ready to start!
      </p>
    </div>
  );
}
