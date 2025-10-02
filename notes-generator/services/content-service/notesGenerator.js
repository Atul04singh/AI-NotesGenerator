require("dotenv").config();
const mongoose = require("mongoose");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const Syllabus = require("./models/Syllabus");

const MONGO_URI = process.env.MONGO_URI;
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

// --- Connect to MongoDB ---
async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");
}

// --- Build Prompt ---
function buildPrompt(topicPath) {
  return `
You are an expert educator creating detailed, student-friendly engineering notes.

Topic: "${topicPath}"

Requirements:
1. Start with a short definition/introduction.
2. Explain the concept in depth in simple language.
3. Use bullet points/headings where helpful.
4. Provide practical examples.
5. Include key concepts and important points.
6. If applicable, give step-by-step explanations.
7. End with a summary.
8. Make sure it is formatted for academic notes.
`;
}

// --- Generate content from Ollama ---
async function generateContent(prompt) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.response;
}

// --- Update nested result in MongoDB ---
async function updateResultInDB(syllabusId, topicPath, generatedContent) {
  // Build arrayFilters and update path dynamically
  const arrayFilters = [];
  let updatePath = "";
  for (let i = 0; i < topicPath.length; i++) {
    const filterName = `t${i}`;
    const key = i === 0 ? "topic" : "topicName";

    // Push filter object
    arrayFilters.push({ [`${filterName}.${key}`]: topicPath[i] });

    if (i > 0) {
      updatePath +=
        i === 1 ? `subtopics.$[${filterName}]` : `.subtopics.$[${filterName}]`;
    }
  }
  updatePath += ".result";

  // Compose update query
  const update = { $set: {} };
  update.$set[updatePath] = generatedContent;

  // Compose find query for top-level document
  const query = { customId: syllabusId, topic: topicPath[0] };

  // arrayFilters skip first filter since it's matched in query
  const updateResult = await Syllabus.updateOne(query, update, {
    arrayFilters: arrayFilters.slice(1),
  });

  if (updateResult.modifiedCount > 0) {
    console.log(`✅ MongoDB updated for: ${topicPath.join(" → ")}`);
  } else {
    console.log(`⚠ MongoDB update failed for: ${topicPath.join(" → ")}`);
  }
}

// --- Recursive function to process topics ---
async function processNode(node, parentPath = [], syllabusId) {
  const currentName = node.topicName || node.topic || "Untitled";
  const topicPath = [...parentPath, currentName];
  const topicPathStr = topicPath.join(" → ");

  if (!node.result || node.result.trim() === "") {
    console.log(`⚡ Generating notes for: ${topicPathStr}`);

    const prompt = buildPrompt(topicPathStr);
    const generatedContent = await generateContent(prompt);

    // // Print generated content before storing, to print opt notes in terminal
    // console.log(`\n📄 Generated Content for "${topicPathStr}":\n`);
    // console.log(generatedContent);
    // console.log("\n--------------------------------------\n");

    // Save in DB immediately
    await updateResultInDB(syllabusId, topicPath, generatedContent);

    // Update local object to prevent re-generation
    node.result = generatedContent;
  } else {
    console.log(`⏩ Skipping (already has result): ${topicPathStr}`);
  }

  // Process subtopics recursively
  if (node.subtopics && node.subtopics.length > 0) {
    for (const sub of node.subtopics) {
      await processNode(sub, topicPath, syllabusId);
    }
  }
}

// --- Main function ---
async function main() {
  await connectDB();

  const syllabusId = process.argv[2];
  const doc = await Syllabus.findOne({ customId: syllabusId });

  if (!doc) {
    console.log("❌ Syllabus not found");
    mongoose.disconnect();
    return;
  }

  console.log(`=== Processing Syllabus: ${doc.topic} ===`);
  await processNode(doc, [], syllabusId);

  console.log("✅ All notes generated and stored in DB!");
  mongoose.disconnect();
}

main().catch((err) => console.error("❌ Error:", err));
