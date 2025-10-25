async function sendToBackend(id, y, m, audio, text) {
  const url = "https://seeandsay-mongodb-backend.onrender.com/api/saveUser";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: id,
        ageYears: y,
        ageMonths: m,
        audioFile: audio,
        txtFile: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Successfully sent to backend:", result);
    return result;
  } catch (err) {
    console.error("❌ Failed to send data to backend:", err);
    return null;
  }
}
