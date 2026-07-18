const { spawn } = require("child_process");
const path = require("path");

function exportClip(inputPath, startTime, endTime, outputPath, callback) {

    const ffmpeg = spawn("ffmpeg", [

        "-i", inputPath,
        "-ss", startTime.toString(),
        "-to", endTime.toString(),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-y",
        outputPath

    ]);

    ffmpeg.stderr.on("data", (data) => {
        console.log("[FFMPEG CLIP]", data.toString());
    });

    ffmpeg.on("close", (code) => {

        if (code === 0) {
            callback(null, outputPath);
        } else {
            callback(new Error("Clip export failed"));
        }

    });

}

module.exports = exportClip;