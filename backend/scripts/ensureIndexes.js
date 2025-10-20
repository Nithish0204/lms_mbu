/**
 * Database Index Verification Script
 *
 * Run this script after deployment to ensure all indexes are created.
 * This improves query performance significantly.
 *
 * Usage:
 *   node scripts/ensureIndexes.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Import models (this triggers index creation)
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const LiveClass = require("../models/LiveClass");

const ensureIndexes = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🔧 Creating/verifying indexes...\n");

    // Ensure indexes for all models
    const models = [
      { name: "Assignment", model: Assignment },
      { name: "Submission", model: Submission },
      { name: "Enrollment", model: Enrollment },
      { name: "Course", model: Course },
      { name: "LiveClass", model: LiveClass },
    ];

    for (const { name, model } of models) {
      console.log(`📋 ${name}:`);
      try {
        await model.ensureIndexes();
        const indexes = await model.collection.getIndexes();
        console.log(`   ✅ ${Object.keys(indexes).length} indexes created`);
        console.log(`   📊 Indexes:`, Object.keys(indexes).join(", "));
      } catch (error) {
        console.error(`   ❌ Error creating indexes:`, error.message);
      }
      console.log("");
    }

    console.log("✅ Index verification complete!");
    console.log("\n💡 Tip: Indexes improve query performance by 10-100x");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Database connection closed");
    process.exit(0);
  }
};

ensureIndexes();
