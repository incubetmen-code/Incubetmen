const { spawn } = require("child_process");
const path = require("path");

function runWhisper(audioPath, outputDir, callback) {

    const whisper = spawn("python", [
        "-m",
        "whisper",
        audioPath,
        "--model",
        "base",
        "--output_dir",
        outputDir,
        "--output_format",
        "txt"
    ], {
        env: {
            ...process.env,
            // Paksa Python pakai UTF-8 untuk semua input/output-nya,
            // supaya tidak crash saat mencetak bahasa non-Latin
            // (misal Arab) di terminal Windows yang default-nya
            // bukan UTF-8.
            PYTHONIOENCODING: "utf-8",
            PYTHONUTF8: "1"
        }
    });

    whisper.stdout.on("data", (data) => {
        console.log("[WHISPER]", data.toString("utf-8"));
    });

    whisper.stderr.on("data", (data) => {
        console.log("[WHISPER LOG]", data.toString("utf-8"));
    });

    whisper.on("close", (code) => {

        if (code === 0) {
            callback(null, "done");
        } else {
            callback(new Error("Whisper failed"));
        }

    });

}

module.exports = runWhisper;