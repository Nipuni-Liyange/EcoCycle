
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("EcoCycle Backend is Running Successfully!");
});

// Server port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
