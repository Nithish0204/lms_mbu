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

    // Check for documents with null values
    console.log("\n🔍 Checking for invalid documents...");
    const invalidDocs = await enrollmentsCollection
      .find({
        $or: [
          { student: null },
          { course: null },
          { student: { $exists: false } },
          { course: { $exists: false } },
        ],
      })
      .toArray();

    if (invalidDocs.length > 0) {
      console.log(`⚠️  Found ${invalidDocs.length} invalid document(s):`);
      invalidDocs.forEach((doc, i) => {
        console.log(
          `  ${i + 1}. ID: ${doc._id}, student: ${doc.student}, course: ${
            doc.course
          }`
        );
      });
      console.log("\n🗑️  Deleting invalid documents...");
      const deleteResult = await enrollmentsCollection.deleteMany({
        $or: [
          { student: null },
          { course: null },
          { student: { $exists: false } },
          { course: { $exists: false } },
        ],
      });
      console.log(
        `✅ Deleted ${deleteResult.deletedCount} invalid document(s)`
      );
    } else {
      console.log("✅ No invalid documents found");
    }

    // Drop ALL old indexes
    console.log("\n🗑️  Dropping old indexes with wrong field names...");

    const indexesToDrop = [
      "studentId_1_courseId_1",
      "studentId_1",
      "courseId_1",
      "student_1_course_1",
    ];

    for (const indexName of indexesToDrop) {
      try {
        await enrollmentsCollection.dropIndex(indexName);
        console.log(`✅ Dropped: ${indexName}`);
      } catch (err) {
        if (err.code === 27) {
          console.log(`ℹ️  ${indexName} doesn't exist (OK)`);
        } else {
          console.log(`⚠️  Error dropping ${indexName}:`, err.message);
        }
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

    // Show remaining valid documents count
    const validCount = await enrollmentsCollection.countDocuments();
    console.log(`\n📊 Valid enrollments in database: ${validCount}`);

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
