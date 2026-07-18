const terminal = document.getElementById("terminalLog");
const queue = document.getElementById("queueList");
const output = document.getElementById("outputList");

function log(text) {
    terminal.textContent += "\n> " + text;
    terminal.scrollTop = terminal.scrollHeight;
}

// Status yang menandakan proses sudah berhenti (berhasil ATAU gagal),
// dipakai untuk tahu kapan polling status harus dihentikan.
const FINISHED_STATUSES = [
    "AI Completed",
    "AI Failed",
    "Failed",
    "File Missing"
];

async function startProcess() {

    const input = document.getElementById("videoUrl");
    const url = input.value.trim();

    if (url === "") {
        alert("Masukkan URL video.");
        return;
    }

    log("Creating project...");

    try {

        const response = await fetch("/download", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: url
            })

        });

        const data = await response.json();

        log(data.message);

        if (data.projectId) {
            log("Project ID : " + data.projectId);
        }

        // ID unik untuk elemen status di queue, supaya bisa
        // diupdate lagi nanti tanpa mengubah baris lain
        const statusElementId = "queue-status-" + data.projectId;

        queue.innerHTML += `
            <div class="queue-item">
                <strong>${url}</strong>
                <div class="status" id="${statusElementId}">
                    Waiting Download...
                </div>
            </div>
        `;

        log("Added to queue.");
        log("Waiting Download...");

        input.value = "";

        // Mulai pantau status project ini, supaya kita tahu
        // kapan proses AI benar-benar selesai
        if (data.projectId) {
            pollProjectStatus(data.projectId, statusElementId);
        }

    } catch (err) {

        console.error(err);

        log("Backend tidak dapat dihubungi.");

    }

}

// =========================================================
// POLLING STATUS PROJECT
// =========================================================
// Memanggil ulang GET /api/projects/:id setiap beberapa detik,
// sampai statusnya menandakan proses sudah selesai (berhasil
// atau gagal). Endpoint ini sudah ada sebelumnya, tidak diubah.
function pollProjectStatus(projectId, statusElementId) {

    const intervalId = setInterval(async () => {

        try {

            const res = await fetch("/api/projects/" + projectId);
            const project = await res.json();

            const statusEl = document.getElementById(statusElementId);

            if (statusEl && project.status) {
                statusEl.textContent = project.status;
            }

            if (project.status) {
                log("Project " + projectId + " status: " + project.status);
            }

            if (FINISHED_STATUSES.includes(project.status)) {

                clearInterval(intervalId);

                if (project.status === "AI Completed") {
                    loadProjectClips(projectId);
                } else {
                    log("Proses berhenti untuk project " + projectId + " (status: " + project.status + ")");
                }

            }

        } catch (err) {

            console.error(err);
            // Tidak menghentikan polling hanya karena satu kali gagal fetch,
            // supaya tahan terhadap gangguan jaringan sesaat.

        }

    }, 4000);

}

// =========================================================
// AMBIL DAN TAMPILKAN CLIP HASIL AI
// =========================================================
async function loadProjectClips(projectId) {

    try {

        const res = await fetch("/api/projects/" + projectId + "/clips");
        const clips = await res.json();

        log("Project " + projectId + " selesai. Jumlah clip: " + clips.length);

        if (!Array.isArray(clips) || clips.length === 0) {
            log("Tidak ada clip yang ditemukan untuk project " + projectId);
            return;
        }

        clips.forEach(clip => {
            renderClipItem(projectId, clip);
        });

    } catch (err) {

        console.error(err);
        log("Gagal mengambil daftar clip untuk project " + projectId);

    }

}

// Mengubah clip_path (path file di server, misal
// "C:\...\storage\clips\clip_15_0.mp4" atau
// "/.../storage/clips/clip_15_0.mp4") menjadi URL yang bisa
// diakses browser lewat static serving "/storage/clips" yang
// sudah dikonfigurasi di server.js
function buildClipUrl(clipPath) {

    const parts = clipPath.split(/[\\/]/);
    const fileName = parts[parts.length - 1];

    return "/storage/clips/" + fileName;

}

function renderClipItem(projectId, clip) {

    const clipUrl = buildClipUrl(clip.clip_path);

    const item = document.createElement("div");
    item.className = "output-item";

    // video dibuat lewat DOM API (bukan innerHTML), src di-set
    // langsung (cara standar HTML5), TANPA <source> dan TANPA
    // video.load(). muted dan volume di-set EKSPLISIT supaya
    // audio tidak bergantung pada nilai default browser mana pun.
    const video = document.createElement("video");
    video.controls = true;
    video.muted = false;
    video.volume = 1.0;
    video.src = clipUrl;

    const info = document.createElement("div");
    info.className = "output-info";
    info.textContent = "Project " + projectId + " — " + clip.start_time + "s - " + clip.end_time + "s";

    const downloadLink = document.createElement("a");
    downloadLink.href = clipUrl;
    downloadLink.setAttribute("download", "");
    downloadLink.textContent = "Download Clip";

    item.appendChild(video);
    item.appendChild(info);
    item.appendChild(downloadLink);

    output.appendChild(item);

}

document
    .getElementById("startProcess")
    .addEventListener("click", startProcess);