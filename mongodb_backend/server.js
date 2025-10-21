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
  ageYears: Number,
  ageMonths: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema, "users");

// ✅ Define route
app.post("/api/saveUser", async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { userId, ageYears, ageMonths } = req.body;
    const newUser = new User({ userId, ageYears, ageMonths });
    const result = await newUser.save();

    console.log("Saved successfully:", result);
    res.status(201).json({ success: true, user: result });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

