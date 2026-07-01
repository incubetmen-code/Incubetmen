const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES (nanti kita isi)
const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
    res.json({
        app: "IncuClipperStudio",
        status: "running",
        message: "REST API ready"
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});