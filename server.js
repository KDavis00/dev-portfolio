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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Database
const db = new Database("./database.db");
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

// ------------------------
// Upload to Cloudinary
// ------------------------
app.post("/upload", upload.single("media"), async (req, res) => {
  if (!req.file) return res.json({ url: "" }); // no file uploaded, return empty string

  try {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "portfolio" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ error: error.message });
        }
        res.json({ url: result.secure_url });
      }
    );
    require("stream").Readable.from(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ------------------------
// API: Projects
// ------------------------

// Get all projects
app.get("/api/projects", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM projects ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project
app.get("/api/projects/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add project (safe defaults)
app.post("/api/projects", (req, res) => {
  const { title, description, category, tech, demo, github, url } = req.body;

  if (!title || !description) return res.status(400).json({ error: "Title and description required" });

  try {
    const stmt = db.prepare(`
      INSERT INTO projects(title, description, category, tech, demo, github, url)
      VALUES(?,?,?,?,?,?,?)
    `);
    const info = stmt.run(
      title,
      description,
      category || '',
      tech || '',
      demo || '',
      github || '',
      url || ''
    );
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error("Insert failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete project
app.delete("/api/projects/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.json({ deletedID: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
const path = require("path");

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));