const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'virsa.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run('PRAGMA busy_timeout = 5000;');

        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            dob TEXT
        )`, (err) => {
            if (err) console.error('Error creating users table', err);
        });

        // Create systemic_scores table
        db.run(`CREATE TABLE IF NOT EXISTS systemic_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score_data TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error('Error creating systemic_scores table', err);
        });

        // Create people table for the Data view
        db.run(`CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            date TEXT NOT NULL,
            address TEXT,
            systemic_score INTEGER,
            eye_health_value INTEGER,
            left_eye_image TEXT,
            right_eye_image TEXT,
            score_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) {
                console.error('Error creating people table', err);
            } else {
                // Try to add columns if they don't exist (fails silently if they do)
                db.run(`ALTER TABLE people ADD COLUMN systemic_score INTEGER`, () => { });
                db.run(`ALTER TABLE people ADD COLUMN eye_health_value INTEGER`, () => { });
                db.run(`ALTER TABLE people ADD COLUMN left_eye_image TEXT`, () => { });
                db.run(`ALTER TABLE people ADD COLUMN right_eye_image TEXT`, () => { });
                db.run(`ALTER TABLE people ADD COLUMN score_data TEXT`, () => { });
            }
        });

        // Create reports table
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id INTEGER NOT NULL,
            dr_score INTEGER,
            glaucoma_score INTEGER,
            amd_score INTEGER,
            eye_health_value INTEGER,
            score_data TEXT,
            left_eye_image TEXT,
            right_eye_image TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (person_id) REFERENCES people (id)
        )`, (err) => {
            if (err) console.error('Error creating reports table', err);
        });
    }
});

module.exports = db;
