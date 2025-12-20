

// create user
async function createUser(userId, userName) {
  const url = "https://seeandsay-backend.onrender.com/api/createUser";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        userName: userName
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Successfully Created User:", result);
    return result;
  } catch (err) {
    console.error("❌ Failed to Create User:", err);
    return null;
  }
}

// update user info with test results, audio base64, and timestamps
async function updateUserTests(userId, ageYears, ageMonths, correct, partly, wrong, audioBase64, timestampText) {
  const url = "https://seeandsay-backend.onrender.com/api/addTestToUser";

  try {
    console.log("📤 Uploading test data to MongoDB...");
    console.log("   User ID:", userId);
    console.log("   Results:", correct, "correct,", partly, "partial,", wrong, "wrong");
    console.log("   Audio:", audioBase64 ? "Present (" + (audioBase64.length / 1024).toFixed(2) + " KB base64)" : "None");
    console.log("   Timestamps:", timestampText ? "Present" : "None");
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        ageYears: ageYears,
        ageMonths: ageMonths,
        correct: correct,
        partly: partly,
        wrong: wrong,
        audioFile64: audioBase64,        // Base64 string: "data:audio/mpeg;base64,..."
        timestamps: timestampText
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Test data uploaded successfully:", result);
    return result;
  } catch (err) {
    console.error("❌ Failed to upload test data:", err);
    return null;
  }
}
