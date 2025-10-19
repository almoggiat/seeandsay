// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const url = process.env.MONGODB_URL || "mongodb+srv://tomseesay_user:1qaz2wsx3edc4rfv@seesaydb.w8yu8n0.mongodb.net/?retryWrites=true&w=majority&appName=SeeSayDB";


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


// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

