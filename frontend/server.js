// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
try{
      storage_manager = SeeSayMongoStorage()
      } catch (error){
        console.error(error);
        res.status(500).json({ success: false,
                            error: "❌ Failed to initialize MongoDB storage: {e}" });
      }

// Create endpoint && Save Data to MongoDB
app.post("/api/saveUser", async (req, res) => {
  try {
    const { ageYears, ageMonths } = req.body;
    newUser = storage_manager.add_user(user_id= "123123",user_name= "TomTESTTTT",age= ageYears+"."+ageMonths)
    await newUser;
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to save" });
  }
});

// Start server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
