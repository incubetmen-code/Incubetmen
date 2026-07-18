const db = require("../database/database");

// GET ALL PROJECTS
function getAllProjects(callback) {
    db.all("SELECT * FROM projects", [], callback);
}

// CREATE PROJECT
function createProject(title, user_id, callback) {

    db.run(
        "INSERT INTO projects (title, user_id, status, platform) VALUES (?, ?, ?, ?)",
        [title, user_id, "active", "web"],

        function (err) {

            if (err)
                return callback(err);

            callback(null, this.lastID);

        }

    );

}

// UPDATE STATUS
function updateStatus(id, status, callback) {

    db.run(
        "UPDATE projects SET status = ? WHERE id = ?",
        [status, id],
        callback
    );

}

// GET STATUS
function getStatus(id, callback) {

    db.get(
        "SELECT status FROM projects WHERE id = ?",
        [id],
        callback
    );

}

// GET PROJECT BY ID
function getProjectById(id, callback) {
    db.get(
        "SELECT * FROM projects WHERE id = ?",
        [id],
        callback
    );
}

// UPDATE PROJECT
function updateProject(id, title, callback) {
    db.run(
        "UPDATE projects SET title = ? WHERE id = ?",
        [title, id],
        callback
    );
}

// DELETE PROJECT
function deleteProject(id, callback) {
    db.run(
        "DELETE FROM projects WHERE id = ?",
        [id],
        callback
    );
}

// SAVE VIDEO
function saveVideo(projectId, originalName, filePath, callback) {

    db.run(

        `INSERT INTO videos
        (project_id, original_name, file_path)
        VALUES (?, ?, ?)`,

        [
            projectId,
            originalName,
            filePath
        ],

        function (err) {

            if (err)
                return callback(err);

            // this.lastID = ID video yang baru saja dibuat
            callback(null, this.lastID);

        }

    );

}

// SIMPAN CLIP (dengan video_id dan clip_path yang benar)
function addClip(videoId, startTime, endTime, clipPath, callback) {

    db.run(

        `INSERT INTO clips
        (video_id, start_time, end_time, clip_path)
        VALUES (?, ?, ?, ?)`,

        [
            videoId,
            startTime,
            endTime,
            clipPath
        ],

        callback

    );

}

// AMBIL SEMUA CLIP MILIK SATU PROJECT
// (JOIN ke tabel videos karena clips hanya punya video_id,
// bukan project_id secara langsung)
function getClipsByProjectId(projectId, callback) {

    db.all(

        `SELECT
            clips.id,
            clips.video_id,
            clips.start_time,
            clips.end_time,
            clips.clip_path,
            clips.created_at
        FROM clips
        JOIN videos ON clips.video_id = videos.id
        WHERE videos.project_id = ?
        ORDER BY clips.id ASC`,

        [
            projectId
        ],

        callback

    );

}

module.exports = {
    getAllProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
    updateStatus,
    getStatus,
    saveVideo,
    addClip,
    getClipsByProjectId
};