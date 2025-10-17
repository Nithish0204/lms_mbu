const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log(
      "📍 Connection string:",
      process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, "//<credentials>@")
    );

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:");
    console.error(`Error: ${error.message}`);

    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("querySrv")
    ) {
      console.error("\n🔧 IMMEDIATE ACTION REQUIRED:");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("1. Go to: https://cloud.mongodb.com/");
      console.error("2. Login and select your project");
      console.error('3. Click "Network Access" (left sidebar)');
      console.error('4. Click "ADD IP ADDRESS"');
      console.error('5. Click "ADD CURRENT IP ADDRESS"');
      console.error('6. Click "Confirm"');
      console.error("7. Wait 1-2 minutes");
      console.error("8. Restart this server");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("\nAlternatively, whitelist all IPs: 0.0.0.0/0");
    }

    process.exit(1);
  }
};

module.exports = connectDB;
