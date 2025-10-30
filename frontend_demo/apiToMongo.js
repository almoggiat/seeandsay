

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

// update user info
async function updateUserTests(userId,ageYears,ageMonths, correct, partly, wrong, audioBlob, textContent) {
  const url = "https://seeandsay-backend.onrender.com/api/addTestToUser";

  try {
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
        audioFile: audioBlob,
        finalEvaluation: textContent
        }),
    });

    const result = await response.json();
    console.log("✅ Files uploaded:", result);
    return result;
  } catch (err) {
    console.error("❌ Failed to upload files:", err);
  }
}
