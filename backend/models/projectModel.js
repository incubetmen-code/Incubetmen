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

module.exports = {
    getAllProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject
};