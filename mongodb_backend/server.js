// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const url = process.env.MONGODB_URL;


// ✅ Connect to MongoDB
mongoose.connect(url, {
  serverSelectionTimeoutMS: 5000,
  ssl: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));



app.get("/", (req, res) => {
  res.json({ message: "Hello from Render backend" });
});







// ✅ Define schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: String,
  ageYears: Number,
  ageMonths: Number,
  tests: [
    {
      date: { type: Date, default: Date.now },
      audioFile: String,
      txtFile: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema, "users");

// ✅ Route 1 - Create new user, basic data.
app.post("/api/createUser", async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { userId, ageYears, ageMonths } = req.body;
    const newUser = new User({ userId, ageYears, ageMonths});
    const result = await newUser.save();

    console.log("User Created successfully:", result);
    res.status(201).json({ success: true, user: result });
  } catch (error) {
    console.error("Creation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Route 2 - Update user files, end of test.
app.post("/api/addTestToUser", async (req, res) => {
  try {
    const { userId, audioFile, txtFile } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $push: { tests: { audioFile, txtFile } } }, // add a new test
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("User Updated successfully:", updatedUser);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("❌ User Update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

