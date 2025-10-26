async function createUser(id, y, m, audio, text) {
  const url = "https://seeandsay-mongodb-backend.onrender.com/api/createUser";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: id,
        ageYears: y,
        ageMonths: m
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


async function updateUserFiles(userId, audioBase64, textContent) {
  const url = "https://seeandsay-mongodb-backend.onrender.com/api/updateUserFiles";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, audioFile: audioBase64, txtFile: textContent }),
    });

    const result = await response.json();
    console.log("✅ Files uploaded:", result);
    return result;
  } catch (err) {
    console.error("❌ Failed to upload files:", err);
  }
}

