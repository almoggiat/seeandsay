// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ✅ Define schema
const userSchema = new mongoose.Schema({
  ageYears: Number,
  ageMonths: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ✅ Define route
app.post("/api/saveUser", async (req, res) => {
  try {
    const { ageYears, ageMonths } = req.body;
    const newUser = new User({ ageYears, ageMonths });
    await newUser.save();
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to save" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));


// Start server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
