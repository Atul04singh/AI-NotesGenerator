// fetchById.js
require("dotenv").config();
const mongoose = require("mongoose");
const Syllabus = require("./models/Syllabus");

// helper to print nested subtopics
function printSubtopics(subtopics = [], indent = "  ") {
  for (const st of subtopics) {
    console.log(`${indent}- ${st.topicName}`);
    console.log(
      `${indent}  result: ${
        st.result && st.result.trim() ? "(present)" : "(empty)"
      }`
    );
    if (st.subtopics && st.subtopics.length) {
      printSubtopics(st.subtopics, indent + "  ");
    }
  }
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  // connect
  await mongoose.connect(MONGO_URI).catch((err) => {
    console.error("Mongo connect error:", err.message || err);
    process.exit(1);
  });

  console.log("✅ Connected to MongoDB");

  const idArg = process.argv[2];
  if (!idArg) {
    console.error("Usage: node fetchById.js <customId_or__id>");
    process.exit(1);
  }

  let doc = null;
  // first try customId
  try {
    doc = await Syllabus.findOne({ customId: idArg }).lean();
  } catch (e) {
    console.error("Error querying by customId:", e.message || e);
    process.exit(1);
  }

  // fallback: try as _id
  if (!doc) {
    try {
      // if idArg is invalid ObjectId, this will throw; catch and ignore
      doc = await Syllabus.findById(idArg).lean();
    } catch (e) {
      // ignore — doc stays null
    }
  }

  if (!doc) {
    console.log("No syllabus found for id:", idArg);
    await mongoose.disconnect();
    process.exit(0);
  }

  // Print doc (topic + nested subtopics)
  console.log("\n=== Syllabus document found ===");
  console.log("customId:", doc.customId || "(none)");
  console.log("topic:", doc.topic || "(no topic field)");
  console.log("result:", doc.result || "(no top-level result)");
  console.log("\nsubtopics:");
  if (doc.subtopics && doc.subtopics.length) {
    printSubtopics(doc.subtopics, "  ");
  } else {
    console.log("  (no subtopics)");
  }

  // disconnect
  await mongoose.disconnect();
  process.exit(0);
}

main();
