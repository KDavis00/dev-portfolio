// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const Database = require("better-sqlite3");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// Cloudinary Config
// --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --------------------
// Multer Setup
// --------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --------------------
// Database Setup
// --------------------
const db = new Database("database.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  category TEXT,
  tech TEXT,
  demo TEXT,
  github TEXT,
  url TEXT
)
`).run();

// --------------------
// Upload Media
// --------------------
app.post("/upload", upload.single("media"), async (req, res) => {

  if (!req.file) {
    return res.json({ url: "" });
  }

  try {

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "dev-portfolio"
      },
      (error, result) => {

        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ error: "Upload failed" });
        }

        res.json({ url: result.secure_url });

      }
    );

    const readable = require("stream").Readable.from(req.file.buffer);
    readable.pipe(stream);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Upload error" });

  }
});

// --------------------
// GET All Projects
// --------------------
app.get("/api/projects", (req, res) => {

  try {

    const projects = db
      .prepare("SELECT * FROM projects ORDER BY id DESC")
      .all();

    res.json(projects);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

// --------------------
// GET Single Project
// --------------------
app.get("/api/projects/:id", (req, res) => {

  try {

    const project = db
      .prepare("SELECT * FROM projects WHERE id=?")
      .get(req.params.id);

    res.json(project);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

// --------------------
// ADD Project
// --------------------
app.post("/api/projects", (req, res) => {

  const { title, description, category, tech, demo, github, url } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      error: "Title and description required"
    });
  }

  try {

    const result = db.prepare(`
      INSERT INTO projects
      (title, description, category, tech, demo, github, url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description,
      category || "",
      tech || "",
      demo || "",
      github || "",
      url || ""
    );

    res.json({
      id: result.lastInsertRowid
    });

  } catch (err) {

    console.error("Insert error:", err);
    res.status(500).json({ error: err.message });

  }

});

// --------------------
// DELETE Project
// --------------------
app.delete("/api/projects/:id", (req, res) => {

  try {

    db.prepare("DELETE FROM projects WHERE id=?")
      .run(req.params.id);

    res.json({
      deleted: req.params.id
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});