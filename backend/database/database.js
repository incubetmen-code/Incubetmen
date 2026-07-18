const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// lokasi file database
const dbPath = path.join(__dirname, "incuclipper.db");

// buat koneksi database (SINGLE INSTANCE ONLY)
const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {
        console.error("❌ Database gagal terhubung:", err.message);
    } else {
        console.log("✅ Database berhasil terhubung");
    }

});

// ==========================
// INIT TABLES
// ==========================
db.serialize(() => {

    // USERS
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // PROJECTS
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            status TEXT DEFAULT 'Queued',
            platform TEXT DEFAULT 'web',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // VIDEOS
    db.run(`
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            original_name TEXT,
            file_path TEXT,
            duration INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // CLIPS (nanti AI pakai ini)
    db.run(`
        CREATE TABLE IF NOT EXISTS clips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id INTEGER,
            start_time REAL,
            end_time REAL,
            clip_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // EXPORTS
    db.run(`
        CREATE TABLE IF NOT EXISTS exports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clip_id INTEGER,
            export_path TEXT,
            resolution TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

});

module.exports = db;