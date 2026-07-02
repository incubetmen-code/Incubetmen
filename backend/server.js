const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Serve Frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// API Routes
const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

// Home
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});