const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/lms_db")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const fixEnrollmentIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const enrollmentsCollection = db.collection("enrollments");

    console.log("\n=== Fixing Enrollment Collection Indexes ===\n");

    // Get current indexes
    console.log("📋 Current indexes:");
    const indexes = await enrollmentsCollection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the old incorrect index if it exists
    console.log("\n🗑️  Dropping old indexes with wrong field names...");
    try {
      await enrollmentsCollection.dropIndex("studentId_1_courseId_1");
      console.log("✅ Dropped old index: studentId_1_courseId_1");
    } catch (err) {
      if (err.code === 27) {
        console.log(
          "ℹ️  Index studentId_1_courseId_1 doesn't exist (already dropped)"
        );
      } else {
        console.log("⚠️  Error dropping index:", err.message);
      }
    }

    // Create the correct unique index
    console.log("\n✨ Creating correct unique index...");
    await enrollmentsCollection.createIndex(
      { student: 1, course: 1 },
      { unique: true, name: "student_1_course_1" }
    );
    console.log("✅ Created unique compound index: student_1_course_1");

    // Show updated indexes
    console.log("\n📋 Updated indexes:");
    const updatedIndexes = await enrollmentsCollection.indexes();
    updatedIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log("\n✅ Index fix completed successfully!");
    console.log(
      "\n💡 You can now restart your server and try enrolling again.\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error fixing indexes:", error);
    process.exit(1);
  }
};

// Run the fix
setTimeout(() => {
  fixEnrollmentIndexes();
}, 1000);
