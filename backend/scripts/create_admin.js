import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../Models/User.js";

// Load backend .env file
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mindwell";

async function createAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully.");

    const adminEmail = "admin@mindwell.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      console.log("Updating role to 'admin' just in case.");
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Admin user updated successfully.");
    } else {
      console.log(`Creating new admin user: ${adminEmail}`);
      const admin = new User({
        full_name: "Admin User",
        email: adminEmail,
        password: "AdminSecurePass123!",
        role: "admin"
      });
      await admin.save();
      console.log("Admin user created successfully.");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

createAdmin();
