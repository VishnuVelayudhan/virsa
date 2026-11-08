document.addEventListener('DOMContentLoaded', () => {



    /* =========================================================
       2. DOM ELEMENTS & STATE
       ========================================================= */
    const viewLanding = document.getElementById('view-landing');
    const viewQuestionnaire = document.getElementById('questionnaire-modal');
    const welcomeMessage = document.getElementById('welcome-message');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const personDetailsModal = document.getElementById('person-details-modal');
    const closeDetailsBtn = document.getElementById('close-details-btn');
    const personDetailsName = document.getElementById('person-details-name');
    const reportsList = document.getElementById('reports-list');
    const addNewReportBtn = document.getElementById('add-new-report-btn');

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    const signupForm = document.getElementById('signup-form');
    const signupError = document.getElementById('signup-error');
    const signupSuccess = document.getElementById('signup-success');

    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');

    const viewPeople = document.getElementById('view-people');
    const peopleList = document.getElementById('people-list');
    const emptyPeopleMsg = document.getElementById('empty-people-msg');
    const addPersonForm = document.getElementById('add-person-form');
    const personError = document.getElementById('person-error');
    const logoutPeopleBtn = document.getElementById('logout-people-btn');

    const logoutBtn = document.getElementById('logout-btn');

    const scoringForm = document.getElementById('scoring-form');
    const scoringError = document.getElementById('scoring-error');
    const scoringSuccessState = document.getElementById('scoring-success-state');
    const retakeBtn = document.getElementById('retake-btn');

    // State Variables
    let currentUser = null;

    /* =========================================================
       3. NAVIGATION LOGIC
       ========================================================= */
    function showLanding() {
        viewLanding.classList.remove('hidden');
        viewQuestionnaire.classList.add('hidden');
        viewPeople.classList.add('hidden');
        currentUser = null;
        // Optionally update nav links
        document.querySelector('.nav-links').innerHTML = `
            <li><a href="#about" class="nav-btn">About VIRSA</a></li>
            <li><a href="#registration" class="nav-btn btn-primary">Join Us</a></li>
        `;
    }

    async function loadPeopleList() {
        if (!currentUser) return;
        try {
            const res = await fetch(`/api/people/${currentUser.id}`);
            const data = await res.json(); // data is an array of people

            peopleList.innerHTML = ''; // Clear existing list
            if (data.length === 0) {
                peopleList.innerHTML = '<p class="text-center text-muted py-2" id="empty-people-msg">No people added yet.</p>';
            } else {
                data.forEach((person) => {
                    const row = document.createElement('div');
                    row.className = 'people-list-item fade-in';
                    row.innerHTML = `
                        <span class="col-slno">${1010 + person.id}</span>
                        <a href="#" class="col-name person-link" data-id="${person.id}">${person.name}</a>
                        <span class="col-age">${person.age}</span>
                        <span class="col-date">${person.date}</span>
                        <span class="col-address">${person.address || ''}</span>
                        <span class="col-score text-center" style="font-weight:bold; color: ${person.eye_health_value !== null ? 'var(--color-primary-light)' : 'inherit'}">${person.eye_health_value !== null ? person.eye_health_value : '-'}</span>
                    `;
                    peopleList.appendChild(row);
                });
                // Add click events to newly created links
                document.querySelectorAll('.person-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const personId = e.target.getAttribute('data-id');
                        const person = data.find(p => p.id == personId);
                        if (person) showPersonDetails(person);
                    });
                });
            }
        } catch (err) {
            console.error('Error loading people list:', err);
        }
    }
    function showPeopleView(user) {
        currentUser = user;
        viewLanding.classList.add('hidden');
        viewQuestionnaire.classList.add('hidden');
        viewPeople.classList.remove('hidden');

        document.querySelector('.nav-links').innerHTML = '';
        loadPeopleList();
        window.scrollTo(0, 0);
    }

    let currentPerson = null;

    async function showPersonDetails(person) {
        currentPerson = person;
        personDetailsModal.classList.remove('hidden');
        personDetailsName.textContent = `${person.name}'s Reports History`;
        reportsList.innerHTML = '<p class="text-center text-muted py-2">Loading reports...</p>';

        try {
            const res = await fetch(`/api/people/${person.id}/reports`);
            const reports = await res.json();

            reportsList.innerHTML = '';
            if (reports.length === 0) {
                reportsList.innerHTML = '<p class="text-center text-muted py-2" id="empty-reports-msg">No reports found for this patient.</p>';
            } else {
                reports.forEach(report => {
                    const dateObj = new Date(report.timestamp);
                    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

                    let aiHtml = '';
                    if (report.score_data) {
                        try {
                            const scoreData = JSON.parse(report.score_data);
                            if (scoreData.ai_predictions) {
                                const diseaseMap = {
                                    "0": "General disease risk indicator", "Disease_Risk": "General disease risk indicator",
                                    "1": "Diabetic Retinopathy", "DR": "Diabetic Retinopathy",
                                    "2": "Age-Related Macular Degeneration", "ARMD": "Age-Related Macular Degeneration",
                                    "3": "Macular Hole", "MH": "Macular Hole",
                                    "4": "Diabetic Nephropathy", "DN": "Diabetic Nephropathy",
                                    "5": "Myopia", "MYA": "Myopia",
                                    "6": "Branch Retinal Vein Occlusion", "BRVO": "Branch Retinal Vein Occlusion",
                                    "7": "Tessellation", "TSLN": "Tessellation",
                                    "8": "Epiretinal Membrane", "ERM": "Epiretinal Membrane",
                                    "9": "Laser Scars", "LS": "Laser Scars",
                                    "10": "Maculopathy", "MS": "Maculopathy",
                                    "11": "Central Serous Retinopathy", "CSR": "Central Serous Retinopathy",
                                    "12": "Optic Disc Cupping", "ODC": "Optic Disc Cupping",
                                    "13": "Central Retinal Vein Occlusion", "CRVO": "Central Retinal Vein Occlusion",
                                    "14": "Asteroid Hyalosis", "AH": "Asteroid Hyalosis",
                                    "15": "Optic Disc Pallor", "ODP": "Optic Disc Pallor",
                                    "16": "Optic Disc Edema", "ODE": "Optic Disc Edema",
                                    "17": "Anterior Ischemic Optic Neuropathy", "AION": "Anterior Ischemic Optic Neuropathy",
                                    "18": "Pigment Changes", "PT": "Pigment Changes",
                                    "19": "Retinitis", "RT": "Retinitis",
                                    "20": "Retinal Scars", "RS": "Retinal Scars",
                                    "21": "Chorioretinitis Scars", "CRS": "Chorioretinitis Scars",
                                    "22": "Macular Edema", "EDN": "Macular Edema",
                                    "23": "RPE Changes", "RPEC": "RPE Changes",
                                    "24": "Macular Holes (Large)", "MHL": "Macular Holes (Large)",
                                    "25": "Cataract", "CATARACT": "Cataract",
                                    "26": "Glaucoma", "GLAUCOMA": "Glaucoma",
                                    "27": "Normal/Healthy", "NORMAL": "Normal/Healthy"
                                };

                                const mapDiseases = (eyeData) => {
                                    if (!eyeData.probabilities || Object.keys(eyeData.probabilities).length === 0) return 'None';

                                    // Get all probabilities, convert to array, sort descending
                                    const sortedProbs = Object.entries(eyeData.probabilities)
                                        .sort(([, a], [, b]) => b - a);

                                    return sortedProbs.map(([d, prob]) => {
                                        const name = diseaseMap[d] || d;
                                        const percent = (prob * 100).toFixed(2);
                                        return `${name}: ${percent}%`;
                                    }).join('<br/>');
                                };

                                const leftPreds = mapDiseases(scoreData.ai_predictions.left_eye);
                                const rightPreds = mapDiseases(scoreData.ai_predictions.right_eye);

                                aiHtml = `
                                    <div class="report-ai-results" style="margin-top: 15px; padding: 10px; background: rgba(50, 205, 50, 0.1); border-radius: 8px; border: 1px solid var(--color-primary);">
                                        <h4 style="margin: 0 0 10px 0; color: var(--color-primary-light);">🧠 AI Retinal Analysis</h4>
                                        <div style="display: flex; justify-content: space-between; gap: 1rem;">
                                            <div style="flex:1;">
                                                <strong>Left Eye:</strong><br/>
                                                <span style="font-size: 0.9em; color: var(--color-text-muted);">${leftPreds}</span>
                                            </div>
                                            <div style="flex:1;">
                                                <strong>Right Eye:</strong><br/>
                                                <span style="font-size: 0.9em; color: var(--color-text-muted);">${rightPreds}</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        } catch (e) {
                            console.error("Error parsing score data", e);
                        }
                    }

                    const card = document.createElement('div');
                    card.className = 'report-card fade-in';
                    card.innerHTML = `
                        <div class="report-header">
                            <span class="report-date">${dateStr}</span>
                            <span class="report-overall-score">Eye Health Value: ${report.eye_health_value !== null ? report.eye_health_value : '-'}</span>
                        </div>
                        <div class="report-details-grid">
                            <div class="report-metric">
                                <div class="report-metric-title">DR Score</div>
                                <div class="report-metric-value">${report.dr_score !== null ? report.dr_score : '-'}</div>
                            </div>
                            <div class="report-metric">
                                <div class="report-metric-title">Glaucoma Risk</div>
                                <div class="report-metric-value">${report.glaucoma_score !== null ? report.glaucoma_score + '%' : '-'}</div>
                            </div>
                            <div class="report-metric">
                                <div class="report-metric-title">AMD Risk</div>
                                <div class="report-metric-value">${report.amd_score !== null ? report.amd_score + '%' : '-'}</div>
                            </div>
                        </div>
                        ${aiHtml}
                    `;
                    reportsList.appendChild(card);
                });
            }
        } catch (err) {
            reportsList.innerHTML = '<p class="text-center error py-2">Failed to load reports.</p>';
        }
    }

    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            personDetailsModal.classList.add('hidden');
            loadPeopleList();
        });
    }

    if (addNewReportBtn) {
        addNewReportBtn.addEventListener('click', () => {
            personDetailsModal.classList.add('hidden');
            if (currentPerson) showQuestionnaire(currentPerson);
        });
    }

    function showQuestionnaire(person) {
        currentPerson = person;
        viewQuestionnaire.classList.remove('hidden');

        // Update welcome message and dr score badge to reflect the clicked person
        const welcomeMessage = document.getElementById('welcome-message');
        welcomeMessage.textContent = `Scoring for ${person.name}`;

        const overallScoreBadge = document.getElementById('overall-score-badge');
        if (person.eye_health_value !== null && person.eye_health_value !== undefined) {
            overallScoreBadge.textContent = `Current Eye Health Value: ${person.eye_health_value}`;
        } else {
            overallScoreBadge.textContent = `Eye Health Value: Not Assessed`;
        }  // Populate if existing scoring data exists
        if (person.score_data) {
            try {
                const parsedScore = JSON.parse(person.score_data);
                for (const key in parsedScore) {
                    const elements = document.getElementsByName(key);
                    if (elements.length > 0) {
                        if (elements[0].type === 'radio') {
                            elements.forEach(el => {
                                if (el.value === parsedScore[key].toString()) el.checked = true;
                            });
                        } else if (elements[0].type === 'checkbox') {
                            elements.forEach(el => {
                                if (el.value === parsedScore[key].toString()) el.checked = true;
                            });
                        } else if (elements[0].tagName === 'SELECT' || elements[0].type === 'number' || elements[0].type === 'text') {
                            elements[0].value = parsedScore[key];
                        }
                    }
                }
            } catch (e) {
                console.error("Error parsing existing score data", e);
            }
        }

        document.getElementById('scoring-form').classList.remove('hidden');
        document.getElementById('scoring-success-state').classList.add('hidden');
        window.scrollTo(0, 0);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            viewQuestionnaire.classList.add('hidden');
            // If they closed an existing patient or new patient, reload the list to reflect any new DR score badge updates.
            loadPeopleList();
        });
    }

    /* =========================================================
       4. AUTHENTICATION API CALLS
       ========================================================= */
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.textContent = '';
        signupSuccess.textContent = '';

        const username = document.getElementById('signup-username').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const dob = document.getElementById('signup-dob').value;

        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, phone, dob })
            });
            const data = await res.json();

            if (!res.ok) {
                signupError.textContent = data.error || 'Signup failed.';
            } else {
                signupSuccess.textContent = 'Account created! You can now log in.';
                signupForm.reset();
            }
        } catch (err) {
            signupError.textContent = 'Network error. Please try again.';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const username = document.getElementById('login-username').value.trim();
        const phone = document.getElementById('login-phone').value.trim();

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, phone })
            });
            const data = await res.json();

            if (!res.ok) {
                loginError.textContent = data.error || 'Login failed.';
            } else {
                loginForm.reset();
                showPeopleView(data.user);
            }
        } catch (err) {
            loginError.textContent = 'Network error. Please try again.';
        }
    });

    logoutPeopleBtn.addEventListener('click', () => {
        showLanding();
    });

    addPersonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        personError.textContent = '';

        if (!currentUser) return;

        const name = document.getElementById('person-name').value.trim();
        const age = document.getElementById('person-age').value;
        const date = document.getElementById('person-date').value;
        const address = document.getElementById('person-address').value.trim();

        try {
            const res = await fetch('/api/people', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, name, age, date, address })
            });

            const data = await res.json();
            if (!res.ok) {
                personError.textContent = data.error || 'Failed to add person.';
            } else {
                addPersonForm.reset();
                loadPeopleList();
                // Popout the modal immediately upon adding a new person
                showQuestionnaire(data);
            }
        } catch (err) {
            personError.textContent = 'Network error. Please try again.';
        }
    });

    /* Toggle Forms */
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginBox.classList.add('hidden');
            signupBox.classList.remove('hidden');
            signupForm.reset();
            signupError.textContent = '';
            signupSuccess.textContent = '';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
            loginForm.reset();
            loginError.textContent = '';
        });
    }

    /* =========================================================
       5. QUESTIONNAIRE SUBMISSION
       ========================================================= */
    scoringForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        scoringError.textContent = '';

        // Collect form data and calculate score
        const formData = new FormData(scoringForm);

        let totalDrScore = 0;
        let totalGScore = 0;
        let totalAmdScore = 0;
        const scoreData = {};

        // Collect valid numeric helper functions for scoring calculations
        const getVal = (name) => {
            const val = formData.get(name);
            if (val !== null && val !== '') scoreData[name] = val;
            return val;
        };
        const getNum = (name) => {
            const val = getVal(name);
            return val ? parseFloat(val) : null;
        };

        // --- DR Scoring ---
        // Q1)HbA1c
        let q1 = getNum('q1');
        if (q1 !== null) {
            if (q1 < 6.5) totalDrScore += 0;
            else if (q1 <= 7.4) totalDrScore += 4;
            else if (q1 <= 8.4) totalDrScore += 8;
            else totalDrScore += 12;
        }

        // Q2)Duration of Diabetes
        let q2 = getNum('q2');
        if (q2 !== null) {
            if (q2 < 5) totalDrScore += 0;
            else if (q2 <= 9) totalDrScore += 4;
            else if (q2 <= 14) totalDrScore += 7;
            else totalDrScore += 10;
        }

        // Q3)Systolic BP
        let q3 = getNum('q3');
        if (q3 !== null) {
            if (q3 < 130) totalDrScore += 0;
            else if (q3 <= 139) totalDrScore += 3;
            else totalDrScore += 6;
        }

        // Q4)Renal Involvement
        let q4 = getNum('q4');
        if (q4 === 1) totalDrScore += 3;
        else if (q4 === 2) totalDrScore += 6;

        // Q5)Lipid Abnormality (Checkboxes)
        ['q5_chol', 'q5_ldl', 'q5_tg'].forEach(q => {
            if (getVal(q) === 'yes') totalDrScore += 2;
        });

        // Q6)BMI
        let q6 = getNum('q6');
        if (q6 !== null) {
            if (q6 >= 25 && q6 < 30) totalDrScore += 2; // Overweight
            else if (q6 >= 30) totalDrScore += 4;       // Obese
        }

        // Q7)Smoking
        let q7 = getNum('q7');
        if (q7 === 1) totalDrScore += 1;
        else if (q7 === 2) totalDrScore += 3;

        // Q8)Type of Diabetes
        let q8 = getNum('q8');
        if (q8 === 1) totalDrScore += 3; // Type 1
        else if (q8 === 2) totalDrScore += 1; // Type 2

        // --- Glaucoma Scoring ---
        // G1) Age
        let g1 = getNum('g1');
        if (g1 !== null) {
            if (g1 >= 50 && g1 <= 60) totalGScore += 5;
            else if (g1 > 60) totalGScore += 10;
        }

        // G2) IOP
        let g2 = getNum('g2');
        if (g2 !== null) {
            if (g2 >= 22 && g2 <= 25) totalGScore += 8;
            else if (g2 > 25) totalGScore += 15;
        }

        // G3) CCT
        let g3 = getNum('g3');
        if (g3 !== null) {
            if (g3 >= 540 && g3 <= 580) totalGScore += 4;
            else if (g3 < 540) totalGScore += 8;
        }

        // G4) Visual Field Pattern SD
        let g4 = getNum('g4');
        if (g4 === 1) totalGScore += 4;
        else if (g4 === 2) totalGScore += 7;

        // G5) Family History
        let g5 = getNum('g5');
        if (g5 === 1) totalGScore += 5;

        // G6) Diabetes or HTN
        let g6 = getNum('g6');
        if (g6 === 1) totalGScore += 5;

        // --- AMD Scoring ---
        // A1) Age
        let a1 = getNum('a1');
        if (a1 !== null) {
            if (a1 >= 50 && a1 <= 59) totalAmdScore += 5;
            else if (a1 >= 60 && a1 <= 69) totalAmdScore += 10;
            else if (a1 >= 70) totalAmdScore += 15;
        }

        // A2) Smoking
        let a2 = getNum('a2');
        if (a2 === 1) totalAmdScore += 5;
        else if (a2 === 2) totalAmdScore += 10;

        // A3) Lipid Abnormality
        let a3 = getNum('a3');
        if (a3 === 1) totalAmdScore += 7;

        // A4) Hypertension
        let a4 = getNum('a4');
        if (a4 === 1) totalAmdScore += 5;

        // A5) Physical Activity
        let a5 = getNum('a5');
        if (a5 === 1) totalAmdScore += 3;

        // Calculate Percentages
        // The user specifically requested that the sum of the points directly represents the percentage chance
        let glaucomaPercentage = totalGScore;
        let amdPercentage = totalAmdScore;

        if (!currentPerson) return; // Scoring updates a specific person, not currently logged-in user

        // Multer backend requires multipart/form-data. 
        // We inject our calculated values back into the active formData object which natively contains the file blobs.
        formData.set('scoreData', JSON.stringify(scoreData));
        let eyeHealthValue = totalDrScore + glaucomaPercentage + amdPercentage;
        formData.set('eyeHealthValue', eyeHealthValue);
        formData.set('drScore', totalDrScore);
        formData.set('glaucomaScore', glaucomaPercentage);
        formData.set('amdScore', amdPercentage);

        try {
            const res = await fetch(`/api/people/${currentPerson.id}/score`, {
                method: 'POST',
                body: formData // Body is native FormData. Fetch will automatically set correct Multipart headers bound with boundary.
            });
            const data = await res.json();

            if (!res.ok) {
                scoringError.textContent = data.error || 'Failed to submit scoring.';
            } else {
                // Update local object so badge is correct on subsequent views if we don't refresh list right away
                currentPerson.eye_health_value = eyeHealthValue;

                scoringForm.classList.add('hidden');
                scoringSuccessState.classList.remove('hidden');

                const finalEyeHealthText = document.getElementById('final-eye-health-text');
                finalEyeHealthText.textContent = `Eye Health Value: ${eyeHealthValue}`;

                // Show AI results if returned
                const aiContainer = document.getElementById('ai-results-container');
                const leftEyeEl = document.getElementById('ai-left-eye-results');
                const rightEyeEl = document.getElementById('ai-right-eye-results');

                if (data.aiResults) {
                    const diseaseMap = {
                        "0": "General disease risk indicator", "Disease_Risk": "General disease risk indicator",
                        "1": "Diabetic Retinopathy", "DR": "Diabetic Retinopathy",
                        "2": "Age-Related Macular Degeneration", "ARMD": "Age-Related Macular Degeneration",
                        "3": "Macular Hole", "MH": "Macular Hole",
                        "4": "Diabetic Nephropathy", "DN": "Diabetic Nephropathy",
                        "5": "Myopia", "MYA": "Myopia",
                        "6": "Branch Retinal Vein Occlusion", "BRVO": "Branch Retinal Vein Occlusion",
                        "7": "Tessellation", "TSLN": "Tessellation",
                        "8": "Epiretinal Membrane", "ERM": "Epiretinal Membrane",
                        "9": "Laser Scars", "LS": "Laser Scars",
                        "10": "Maculopathy", "MS": "Maculopathy",
                        "11": "Central Serous Retinopathy", "CSR": "Central Serous Retinopathy",
                        "12": "Optic Disc Cupping", "ODC": "Optic Disc Cupping",
                        "13": "Central Retinal Vein Occlusion", "CRVO": "Central Retinal Vein Occlusion",
                        "14": "Asteroid Hyalosis", "AH": "Asteroid Hyalosis",
                        "15": "Optic Disc Pallor", "ODP": "Optic Disc Pallor",
                        "16": "Optic Disc Edema", "ODE": "Optic Disc Edema",
                        "17": "Anterior Ischemic Optic Neuropathy", "AION": "Anterior Ischemic Optic Neuropathy",
                        "18": "Pigment Changes", "PT": "Pigment Changes",
                        "19": "Retinitis", "RT": "Retinitis",
                        "20": "Retinal Scars", "RS": "Retinal Scars",
                        "21": "Chorioretinitis Scars", "CRS": "Chorioretinitis Scars",
                        "22": "Macular Edema", "EDN": "Macular Edema",
                        "23": "RPE Changes", "RPEC": "RPE Changes",
                        "24": "Macular Holes (Large)", "MHL": "Macular Holes (Large)",
                        "25": "Cataract", "CATARACT": "Cataract",
                        "26": "Glaucoma", "GLAUCOMA": "Glaucoma",
                        "27": "Normal/Healthy", "NORMAL": "Normal/Healthy"
                    };

                    const mapDiseases = (eyeData) => {
                        if (!eyeData.probabilities || Object.keys(eyeData.probabilities).length === 0) return 'None';

                        // Get all probabilities, convert to array, sort descending
                        const sortedProbs = Object.entries(eyeData.probabilities)
                            .sort(([, a], [, b]) => b - a);

                        return sortedProbs.map(([d, prob]) => {
                            const name = diseaseMap[d] || d;
                            const percent = (prob * 100).toFixed(2);
                            return `${name}: ${percent}%`;
                        }).join('<br/>');
                    };

                    leftEyeEl.innerHTML = mapDiseases(data.aiResults.left_eye);
                    rightEyeEl.innerHTML = mapDiseases(data.aiResults.right_eye);
                    aiContainer.classList.remove('hidden');
                } else {
                    aiContainer.classList.add('hidden');
                }
            }
        } catch (err) {
            scoringError.textContent = 'Network error. Please try again.';
        }
    });

    retakeBtn.addEventListener('click', () => {
        scoringForm.reset();
        scoringForm.classList.remove('hidden');
        scoringSuccessState.classList.add('hidden');
        const aiContainer = document.getElementById('ai-results-container');
        if (aiContainer) aiContainer.classList.add('hidden');
    });

});
