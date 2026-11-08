const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

// Add these for AI integration
const axios = require('axios');
const FormData = require('form-data');

// Configure Multer for local storage
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename using timestamp + random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 7860;

app.use(cors()); // Add cors middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint: Signup
app.post('/api/signup', (req, res) => {
    const { username, phone, dob } = req.body;

    if (!username || !phone || !dob) {
        return res.status(400).json({ error: 'Username, phone, and DOB are required.' });
    }

    const query = `INSERT INTO users (username, phone, dob) VALUES (?, ?, ?)`;
    db.run(query, [username, phone, dob], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Username or phone already exists.' });
            }
            console.error("Signup error:", err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(201).json({ message: 'User created successfully', userId: this.lastID });
    });
});

// API Endpoint: Login
app.post('/api/login', (req, res) => {
    const { username, phone } = req.body;

    if (!username || !phone) {
        return res.status(400).json({ error: 'Username and phone are required.' });
    }

    const query = `SELECT * FROM users WHERE username = ? AND phone = ?`;
    db.get(query, [username, phone], (err, row) => {
        if (err) {
            console.error("Signup error:", err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid username or phone number.' });
        }
        res.status(200).json({ message: 'Login successful', user: { id: row.id, username: row.username } });
    });
});

// API Endpoint: Submit Systemic Score for a Person
// NOTE: Added "async" here so we can await the Python API response
app.post('/api/people/:personId/score', upload.fields([
    { name: 'leftEye', maxCount: 1 },
    { name: 'rightEye', maxCount: 1 }
]), async (req, res) => {
    const { personId } = req.params;

    // Values from FormData will be strings, so we must safely parse them
    const body = req.body || {};
    let scoreDataStr = body.scoreData;
    if (typeof scoreDataStr === 'object') {
        scoreDataStr = JSON.stringify(scoreDataStr);
    }
    let eyeHealthValue = body.eyeHealthValue !== undefined && body.eyeHealthValue !== 'undefined' ? parseInt(body.eyeHealthValue, 10) : null;
    let drScore = body.drScore !== undefined && body.drScore !== 'undefined' ? parseInt(body.drScore, 10) : null;
    let glaucomaScore = body.glaucomaScore !== undefined && body.glaucomaScore !== 'undefined' ? parseInt(body.glaucomaScore, 10) : null;
    let amdScore = body.amdScore !== undefined && body.amdScore !== 'undefined' ? parseInt(body.amdScore, 10) : null;

    if (!scoreDataStr) {
        return res.status(400).json({ error: 'Score data is required.' });
    }

    // Check if files were uploaded
    let leftEyeFile = req.files && req.files.leftEye ? req.files.leftEye[0].filename : null;
    let rightEyeFile = req.files && req.files.rightEye ? req.files.rightEye[0].filename : null;

    // ==========================================
    // INTEGRATION WITH OCUNET (PYTHON AI MODEL)
    // ==========================================
    let aiResults = null;
    if (leftEyeFile && rightEyeFile) {
        try {
            const leftEyePath = path.join(uploadDir, leftEyeFile);
            const rightEyePath = path.join(uploadDir, rightEyeFile);

            const form = new FormData();
            form.append('left_eye', fs.createReadStream(leftEyePath));
            form.append('right_eye', fs.createReadStream(rightEyePath));

            console.log("Sending both eyes to local AI Model...");
            // Make request to the local Flask server port 5000
            const aiEndpoint = process.env.AI_API_URL || 'http://127.0.0.1:5000/predict';
            const aiResponse = await axios.post(aiEndpoint, form, {
                headers: { ...form.getHeaders() }
            });

            if (aiResponse.data.status === 'success') {
                aiResults = aiResponse.data.results;
                console.log("AI Predictions Received successfully!");

                // We embed the AI results directly into the JSON score_data column
                // so the frontend can retrieve and display it!
                try {
                    let scoreObj = JSON.parse(scoreDataStr);
                    scoreObj.ai_predictions = aiResults;
                    scoreDataStr = JSON.stringify(scoreObj);
                } catch (e) {
                    console.error("Error modifying scoreDataStr to include AI output", e);
                }
            }
        } catch (aiError) {
            console.error("\n[AI ERROR] Could not connect to the Python AI Model!");
            console.log("Ensure you run: 'python OcuNet-main/models/app_api.py' beforehand!");
            console.error("Message:", aiError.message, "\n");
        }
    }

    // Build insert query for reports table
    let query = `INSERT INTO reports (person_id, dr_score, glaucoma_score, amd_score, eye_health_value, score_data, left_eye_image, right_eye_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    let params = [personId, drScore, glaucomaScore, amdScore, eyeHealthValue, scoreDataStr, leftEyeFile, rightEyeFile];

    // First update the person's master eye health value so the general list continues to work
    if (eyeHealthValue !== null && !isNaN(eyeHealthValue)) {
        db.run(`UPDATE people SET eye_health_value = ? WHERE id = ?`, [eyeHealthValue, personId], (err) => {
            if (err) console.error("Update people Eye Health Error:", err);
        });
    }

    db.run(query, params, function (err) {
        if (err) {
            console.error("Score DB Error:", err);
            console.error("Signup error:", err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(200).json({
            message: 'Score saved successfully',
            reportId: this.lastID,
            leftEye: leftEyeFile,
            rightEye: rightEyeFile,
            ai_status: aiResults ? "Successfully analyzed by AI" : "AI analysis skipped/failed",
            aiResults: aiResults
        });
    });
});

// API Endpoint: Get all historical reports for a specific person
app.get('/api/people/:personId/reports', (req, res) => {
    const { personId } = req.params;

    const query = `SELECT * FROM reports WHERE person_id = ? ORDER BY timestamp DESC`;
    db.all(query, [personId], (err, rows) => {
        if (err) {
            console.error("Signup error:", err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(200).json(rows);
    });
});


// API Endpoint: Get all people for a user
app.get('/api/people/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `SELECT * FROM people WHERE user_id = ? ORDER BY timestamp DESC`;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error("Signup error:", err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(200).json(rows);
    });
});

// API Endpoint: Add a new person
app.post('/api/people', (req, res) => {
    const { userId, name, age, date, address } = req.body;

    if (!userId || !name || !age || !date) {
        return res.status(400).json({ error: 'All fields (name, age, date) are required.' });
    }

    const query = `INSERT INTO people (user_id, name, age, date, address) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [userId, name, age, date, address || ''], function (err) {
        if (err) {
            console.error("Signup error:", err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.status(201).json({ message: 'Person added successfully', id: this.lastID, name, age, date, address });
    });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
