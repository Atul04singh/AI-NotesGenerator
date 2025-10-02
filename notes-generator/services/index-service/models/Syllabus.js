const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const SubtopicSchema = new mongoose.Schema(
  {
    topicName: String,
    result: {
      type: String,
      default: "",
    },
    subtopics: [],
  },
  { _id: false }
);

// Recursive subtopic schema reference
SubtopicSchema.add({ subtopics: [SubtopicSchema] });

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

function parseSyllabusV2(syllabusText) {
  const mainTopic = "Introduction to Python";
  const subtopics = [];

  const parts = syllabusText.split(".");

  for (const part of parts) {
    if (!part.includes(":")) {
      subtopics.push({
        topicName: part.trim(),
        result: "",
        subtopics: [],
      });
    } else {
      const [parent, children] = part.split(":");
      const childrenArr = children.split(",").map((child) => ({
        topicName: child.trim(),
        result: "",
        subtopics: [],
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

module.exports = {
  SyllabusModel: mongoose.model("Syllabus", SyllabusSchema),
  parseSyllabusV2,
};
