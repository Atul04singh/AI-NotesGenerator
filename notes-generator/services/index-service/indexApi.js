// indexApi.js
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const mongoose = require("mongoose");

const { model: Syllabus, parseSyllabusV2 } = require("./syllabus");

mongoose.connect("mongodb://localhost:27017/syllabusDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("✅ Connected to MongoDB successfully");
});

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Function to call Ollama API
async function askOllama(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama API error: ${errText}`);
  }

  const data = await response.json();
  return data.response;
}
//get
app.get("/syllabus/:id", async (req, res) => {
  try {
    const syllabus = await Syllabus.findOne({ customId: req.params.id });
    if (!syllabus) return res.status(404).json({ error: "Not found" });

    res.json(syllabus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//post

// API endpoint + save result in mongodb
app.post("/convert-syllabus", async (req, res) => {
  try {
    const { syllabus } = req.body;

    if (!syllabus || typeof syllabus !== "string") {
      return res.status(400).json({ error: "Invalid syllabus input" });
    }

    const prompt = `
You are a helpful assistant that converts a syllabus into structured JSON format.

Given a syllabus text, extract its main topic and break it down into subtopics and nested subtopics (if any). Use the following JSON format strictly:

{
  "topic": "<main topic name>",
  "subtopics": [
    { "topicName": "<subtopic 1>", "result": "" },
    { 
      "topicName": "<subtopic 2 with children>", 
      "subtopics": [
        { "topicName": "<nested subtopic 1>", "result": "" },
        { "topicName": "<nested subtopic 2>", "result": "" }
      ]
    }
  ]
}

- Always return only valid JSON, without explanation, markdown, or code blocks.
- The root key must be "topic", and use "subtopics" and "result" as shown.
- If no nested subtopics exist, omit the "subtopics" array and only include "result".

Now convert the following syllabus into JSON:

Syllabus: ${syllabus}

Return only valid JSON.
`.trim();

    const rawResult = await askOllama(prompt);

    let parsedJson;
    try {
      parsedJson = JSON.parse(rawResult);
    } catch (err) {
      console.error("❌ JSON parsing failed. Raw result:", rawResult);
      return res
        .status(500)
        .json({ error: "Invalid JSON from LLM", raw: rawResult });
    }

    // Save to MongoDB
    const newSyllabus = new Syllabus(parsedJson);
    await newSyllabus.save();

    return res.json({ success: true, data: newSyllabus });
  } catch (err) {
    console.error("🔥 Error in /convert-syllabus:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /syllabus
router.post("/syllabus", async (req, res) => {
  try {
    const { syllabus } = req.body;

    // Ensure the syllabus text exists
    if (!syllabus) {
      return res.status(400).json({ error: "Syllabus text is required." });
    }

    // ✅ Call the parser directly (not from Syllabus)
    const parsedSyllabus = parseSyllabusV2(syllabus);

    // Create a new syllabus document using the parsed data
    const newSyllabus = new Syllabus(parsedSyllabus);

    // Save to MongoDB
    await newSyllabus.save();

    res.status(201).json({
      message: "Syllabus saved successfully.",
      data: newSyllabus,
    });
  } catch (error) {
    console.error("Error saving syllabus:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// Automatic choose what to call route
router.post("/auto-syllabus", async (req, res) => {
  try {
    const { syllabus } = req.body;

    if (!syllabus || typeof syllabus !== "string") {
      return res.status(400).json({ error: "Syllabus text is required" });
    }

    const isStructured =
      syllabus.includes(":") &&
      syllabus.includes(",") &&
      syllabus.includes(".");

    let newDoc;
    let source;

    if (isStructured) {
      // Use local parser
      const parsed = parseSyllabusV2(syllabus);
      newDoc = new Syllabus(parsed);
      await newDoc.save();
      source = "local";
    } else {
      // Call AI endpoint
      const response = await fetch("http://localhost:3001/convert-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI service failed: ${errorText}`);
      }

      const aiResult = await response.json();

      // Ensure we use the saved Mongo document
      newDoc = new Syllabus(aiResult.data); // assuming AI endpoint returns { success: true, data: parsedJson }
      await newDoc.save();
      source = "ai";
    }

    return res.status(201).json({
      source,
      data: newDoc, // MongoDB document including _id
    });
  } catch (err) {
    console.error("❌ Error in /auto-syllabus:", err);
    return res
      .status(500)
      .json({ error: "Failed to process syllabus", details: err.message });
  }
});

module.exports = router;
app.use("/", router); // Mount all routes defined in `router`

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
