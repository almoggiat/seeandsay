

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

//// validate reading recording with backend
//async function validateReadingRecording(audioBase64) {
//  // For now, automatically act as if there is no backend connection
//  // This will be replaced with actual backend call later
//  return null; // null means no connection
//
//  // When backend is ready, uncomment and modify this:
//  /*
//  const url = "https://seeandsay-backend.onrender.com/api/validateReading";
//
//  try {
//    const response = await fetch(url, {
//      method: "POST",
//      headers: { "Content-Type": "application/json" },
//      body: JSON.stringify({
//        audioFile64: audioBase64
//      }),
//    });
//
//    if (!response.ok) {
//      throw new Error(`Server responded with status ${response.status}`);
//    }
//
//    const result = await response.json();
//    return result.valid === true; // true or false
//  } catch (err) {
//    console.error("❌ Failed to validate reading:", err);
//    return null; // null means no connection
//  }
//  */
//}

// update user info with test results, audio base64, and timestamps
// full_array --> is the new, full array of right and wrong
async function updateUserTests(userId, ageYears, ageMonths,
                    full_array,correct, partly, wrong,
                    audioBase64, timestampText) {
  const url = "https://seeandsay-backend.onrender.com/api/addTestToUser";

  try {
    console.log("📤 Uploading test data to MongoDB...");
    console.log("   User ID:", userId);
    console.log("   Array Results:", full_array);
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
        full_array: full_array,          // Format: [(1,"correct"),(2,"partly"),(3,"wrong")]
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


// Speaker Verification API call
async function verifySpeaker(userId, audioFile64) {
  const url = "https://seeandsay-backend.onrender.com/api/VerifySpeaker";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        audioFile64: audioFile64
      }),
    });

    // Backend returned an error → verification failed
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Verification failed (${response.status}): ${errorText}`);
    }

    // Wait for backend JSON response
    const result = await response.json();

    if (result.success === true) {
      console.log("✅ Speaker verification successful");
      console.log("👤 Parent speaker:", result.parent_speaker);
      return {
        success: true,
        parentSpeaker: result.parent_speaker
      };
    } else {
      console.warn("⚠️ Verification returned success=false");
      return { success: false };
    }

  } catch (err) {
    console.error("❌ Speaker verification error:", err);
    // Return null on network errors to allow testing without backend connection
    return null;
  }
}
