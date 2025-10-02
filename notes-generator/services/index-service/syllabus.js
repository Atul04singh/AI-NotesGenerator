const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// ✅ Subtopic schema for nesting
const SubtopicSchema = new mongoose.Schema(
  {
    topicName: String,
    result: String,
    subtopics: [this], // recursive nesting
  },
  { _id: false }
);

// ✅ Main Syllabus Schema
const SyllabusSchema = new mongoose.Schema({
  customId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true,
  },
  topic: String,
  subtopics: [SubtopicSchema],
});

// ✅ Function to parse syllabus string into structured object
function parseSyllabusV2(syllabusText) {
  const mainTopic = "Introduction to Python"; // Or extract dynamically if needed
  const subtopics = [];

  const parts = syllabusText.split(".");

  for (const part of parts) {
    if (!part.includes(":")) {
      if (part.trim()) {
        subtopics.push({
          topicName: part.trim(),
          result: "",
          subtopics: [],
        });
      }
    } else {
      const [parent, children] = part.split(":");
      const childrenArr = children.split(",").map((child) => ({
        topicName: child.trim(),
        result: "",
      }));

      subtopics.push({
        topicName: parent.trim(),
        result: "",
        subtopics: childrenArr,
      });
    }
  }

  return {
    topic: mainTopic,
    subtopics,
  };
}

// ✅ Export the model and parser function
module.exports = {
  model: mongoose.model("Syllabus", SyllabusSchema),
  parseSyllabusV2,
};
