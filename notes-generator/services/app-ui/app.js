// display-notes/app.js

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Syllabus = require("./models/Syllabus"); // Make sure this path is correct
require("dotenv").config();

const marked = require("marked");

const app = express();
const PORT = 3002;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Set EJS as the view engine and views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static assets (CSS, JS, images, icons)
app.use(express.static(path.join(__dirname, "public")));

// Home route - fetch all syllabus and display as notes icons
app.get(["/", "/home"], async (req, res) => {
  try {
    // Fetch all syllabus documents, only select topic and customId fields
    const syllabuses = await Syllabus.find({}, "topic customId").lean();

    // Render the 'home' view and pass syllabus data
    res.render("home", { syllabuses });
  } catch (error) {
    console.error("❌ Error fetching syllabus:", error);
    res.status(500).send("Error fetching syllabus");
  }
});

app.get("/notesOpened/:customId", async (req, res) => {
  const { customId } = req.params;
  try {
    const syllabus = await Syllabus.findOne({ customId }).lean();
    if (!syllabus) return res.status(404).send("Syllabus not found");

    // Convert all result fields from markdown to HTML
    function convertMarkdown(subtopics) {
      if (!subtopics) return;
      subtopics.forEach((sub) => {
        if (sub.result) {
          sub.resultHTML = marked.parse(sub.result);
        }
        if (sub.subtopics) {
          convertMarkdown(sub.subtopics);
        }
      });
    }
    convertMarkdown(syllabus.subtopics);

    res.render("notesOpened", { syllabus });
  } catch (err) {
    console.error("Error fetching syllabus:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
