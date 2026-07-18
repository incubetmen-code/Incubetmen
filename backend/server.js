const express = require("express");
const cors = require("cors");
const path = require("path");

const downloadRoute = require("./routes/download");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve Frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve Clip Files (hanya folder clips/ yang di-expose,
// BUKAN seluruh storage/, supaya originals/audio/dll tetap privat)
app.use("/storage/clips", express.static(path.join(__dirname, "../storage/clips")));

// API Routes
app.use("/download", downloadRoute);
app.use("/api/projects", projectRoutes);

// Home
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});