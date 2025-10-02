const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // to parse JSON body

app.post("/generate-notes", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing syllabus id" });
  }

  // Spawn a child process to run the notesGenerator.js script with the given id
  const child = spawn("node", ["notesGenerator.js", id]);

  // Stream stdout data
  child.stdout.on("data", (data) => {
    console.log(`notesGenerator stdout: ${data.toString()}`);
  });

  // Stream stderr data
  child.stderr.on("data", (data) => {
    console.error(`notesGenerator stderr: ${data.toString()}`);
  });

  // Handle process exit
  child.on("close", (code) => {
    console.log(`notesGenerator process exited with code ${code}`);
  });

  // Respond immediately that process started
  res.json({ message: `Notes generation started for id: ${id}` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
