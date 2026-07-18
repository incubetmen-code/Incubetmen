const express = require("express");
const router = express.Router();

const Project = require("../models/projectModel");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// =========================
// SAFE AI MODULE LOAD (OPTIONAL)
// =========================
let extractAudio, runWhisper, detectClips, exportClip;

try { extractAudio = require("../modules/audioExtractor"); } catch (e) {}
try { runWhisper = require("../modules/whisperEngine"); } catch (e) {}
try { detectClips = require("../modules/clipDetector"); } catch (e) {}
try { exportClip = require("../modules/clipExporter"); } catch (e) {}


// =========================
// ROUTE
// =========================
router.post("/", (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: "URL kosong" });
    }

    Project.createProject(url, 1, function (err, projectId) {

        if (err) return res.status(500).json(err);

        console.log("\n📦 PROJECT:", projectId);

        Project.updateStatus(projectId, "Downloading", () => {});

        const outputTemplate = path.join(
            __dirname,
            `../../storage/originals/project_${projectId}.%(ext)s`
        );

        // =========================
        // YT-DLP (STABLE)
        // =========================
        const yt = spawn("python", [
    "-m",
    "yt_dlp",
    "-f",
    "18",
    "-o",
    outputTemplate,
    "--no-playlist",
    url
]);

        yt.stderr.on("data", d => console.log("[YT]", d.toString()));

        yt.on("close", (code) => {

            console.log("yt-dlp exit:", code);

            if (code !== 0) {
                Project.updateStatus(projectId, "Failed", () => {});
                return;
            }

            // =========================
            // FIX UTAMA KAMU DI SINI
            // =========================
            const originalsFolder = path.join(__dirname, "../../storage/originals");

console.log("\n========== STORAGE ORIGINALS ==========");

if (!fs.existsSync(originalsFolder)) {
    console.log("Folder originals tidak ada.");
    Project.updateStatus(projectId, "File Missing", () => {});
    return;
}

const allFiles = fs.readdirSync(originalsFolder);

console.log("Isi folder:");

allFiles.forEach(file => {
    console.log(" -", file);
});

const matchedFiles = allFiles.filter(file =>
    file.startsWith(`project_${projectId}.`)
);

if (matchedFiles.length === 0) {

    console.log("❌ Tidak ada file project yang cocok.");

    Project.updateStatus(projectId, "File Missing", () => {});

    return;

}

const videoPath = path.join(originalsFolder, matchedFiles[0]);

console.log("✅ FILE DIPAKAI:");
console.log(videoPath);

console.log("=======================================\n");

            Project.saveVideo(
                projectId,
                path.basename(videoPath),
                videoPath,
                (errSave, videoId) => {

                    if (errSave) {
                        console.log("❌ SAVE VIDEO ERROR:", errSave.message);
                        Project.updateStatus(projectId, "Failed", () => {});
                        return;
                    }

                    console.log("🎞 VIDEO ID:", videoId);

                    Project.updateStatus(projectId, "Downloaded", () => {});

                    // =========================
                    // STOP IF NO AI MODULES
                    // =========================
                    if (!extractAudio || !runWhisper || !detectClips) {
                        console.log("⚠ AI NOT ACTIVE - STOP AFTER DOWNLOAD");
                        return;
                    }

                    // =========================
                    // AI PIPELINE
                    // =========================
                    const audioDir = path.join(__dirname, "../../storage/audio");

                    if (!fs.existsSync(audioDir)) {
                        fs.mkdirSync(audioDir, { recursive: true });
                    }

                    const audioPath = path.join(
                        audioDir,
                        `project_${projectId}.mp3`
                    );

                    Project.updateStatus(projectId, "AI Processing", () => {});

                    extractAudio(videoPath, audioPath, (err) => {

                        if (err) {
                            console.log("❌ AUDIO ERROR");
                            Project.updateStatus(projectId, "AI Failed", () => {});
                            return;
                        }

                        runWhisper(audioPath, audioDir, (err2) => {

                            if (err2) {
                                console.log("❌ WHISPER ERROR");
                                Project.updateStatus(projectId, "AI Failed", () => {});
                                return;
                            }

                            try {

                                const transcriptPath = path.join(
                                    __dirname,
                                    `../../storage/audio/project_${projectId}.txt`
                                );

                                const transcript = fs.readFileSync(transcriptPath, "utf-8");

                                const clips = detectClips(transcript);

                                console.log("✂ CLIPS:", clips.length);

                                const clipsDir = path.join(__dirname, "../../storage/clips");

                                if (!fs.existsSync(clipsDir)) {
                                    fs.mkdirSync(clipsDir, { recursive: true });
                                }

                                // =========================
                                // TUNGGU SEMUA CLIP SELESAI
                                // =========================
                                // exportClip() bersifat asynchronous. Supaya
                                // "AI Completed" HANYA dipanggil setelah SEMUA
                                // clip selesai di-export DAN semua sudah
                                // ter-insert ke DB, dipakai counter manual:
                                // totalClips = jumlah clip yang harus diproses,
                                // completedCount = jumlah yang sudah selesai
                                // (baik sukses maupun gagal, tetap dihitung
                                // "selesai" supaya tidak macet selamanya).
                                //
                                // HANYA ADA SATU tempat di seluruh file ini
                                // yang memanggil Project.updateStatus(...,
                                // "AI Completed", ...) yaitu di dalam
                                // finalizeIfDone() - tidak ada jalur lain.
                                const totalClips = (exportClip ? clips.length : 0);
                                let completedCount = 0;

                                function finalizeIfDone() {

                                    if (completedCount >= totalClips) {
                                        Project.updateStatus(projectId, "AI Completed", () => {});
                                        console.log("🔥 DONE");
                                    }

                                }

                                if (totalClips === 0) {

                                    // Tidak ada clip untuk diexport (modul export
                                    // tidak aktif, atau memang tidak ada kandidat
                                    // clip) - completedCount (0) sudah >= totalClips
                                    // (0), jadi finalizeIfDone() langsung menandai
                                    // selesai. Tetap lewat fungsi yang sama, bukan
                                    // pemanggilan status terpisah.
                                    finalizeIfDone();

                                } else {

                                    clips.forEach((c, i) => {

                                        const clipOutputPath = path.join(
                                            clipsDir,
                                            `clip_${projectId}_${i}.mp4`
                                        );

                                        exportClip(
                                            videoPath,
                                            c.start,
                                            c.end,
                                            clipOutputPath,
                                            (errExport) => {

                                                if (errExport) {
                                                    console.log("❌ CLIP EXPORT ERROR:", errExport.message);
                                                    completedCount++;
                                                    finalizeIfDone();
                                                    return;
                                                }

                                                // simpan clip dengan video_id dan clip_path yang BENAR
                                                Project.addClip(
                                                    videoId,
                                                    c.start,
                                                    c.end,
                                                    clipOutputPath,
                                                    (errDb) => {

                                                        if (errDb) {
                                                            console.log("❌ CLIP DB INSERT ERROR:", errDb.message);
                                                        }

                                                        completedCount++;
                                                        finalizeIfDone();

                                                    }
                                                );

                                            }
                                        );

                                    });

                                }

                            } catch (e) {

                                console.log("❌ PIPELINE ERROR:", e.message);
                                Project.updateStatus(projectId, "AI Failed", () => {});

                            }

                        });

                    });

                }
            );

        });

        res.json({
            success: true,
            projectId
        });

    });

});

module.exports = router;