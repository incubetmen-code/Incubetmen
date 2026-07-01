const express = require("express");
const cors = require("cors");

require("./database/database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        app: "IncuClipperStudio",
        version: "1.0.0",
        status: "Running"
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 IncuClipperStudio API berjalan di http://localhost:${PORT}`);
});