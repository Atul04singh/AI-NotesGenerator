const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Base URLs of services
const INDEX_SERVICE = "http://localhost:3000/convert-syllabus";
const CONTENT_SERVICE = "http://localhost:3001/generate-notes";

app.post("/create-note", async (req, res) => {
  try {
    const { syllabus } = req.body;

    if (!syllabus) {
      return res.status(400).json({ error: "Syllabus is required" });
    }

    // Step 1: Call index-service to create syllabus JSON + save to DB
    const indexRes = await axios.post(INDEX_SERVICE, { syllabus });
    const syllabusData = indexRes.data.data;

    const id = syllabusData._id || syllabusData.customId;
    if (!id) {
      return res
        .status(500)
        .json({ error: "No ID returned from index-service" });
    }

    // Step 2: Call content-service and wait for notes generation to complete
    const contentRes = await axios.post(CONTENT_SERVICE, { id });

    // Step 3: Respond back to client after notes are generated
    res.json({
      message: "Notes generated successfully",
      syllabusId: id,
      contentServiceResponse: contentRes.data,
    });
  } catch (err) {
    console.error("❌ Error in orchestrator:", err.message);
    res
      .status(500)
      .json({ error: "Orchestrator failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Orchestrator running at http://localhost:${PORT}`);
});
