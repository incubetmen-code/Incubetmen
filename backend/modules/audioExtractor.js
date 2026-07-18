const { spawn } = require("child_process");
const path = require("path");

function extractAudio(videoPath, outputPath, callback) {

    const ffmpeg = spawn("ffmpeg", [
        "-i", videoPath,
        "-vn",
        "-acodec", "mp3",
        outputPath
    ]);

    ffmpeg.stderr.on("data", (data) => {
        console.log("[FFMPEG]", data.toString());
    });

    ffmpeg.on("close", (code) => {

        if (code === 0) {
            callback(null, outputPath);
        } else {
            callback(new Error("Audio extraction failed"));
        }

    });

}

module.exports = extractAudio;