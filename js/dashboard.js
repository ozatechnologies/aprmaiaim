// DOM elements
const logoutBtn = document.querySelector('#logoutBtn');
const addRecordForm = document.querySelector('#addRecordForm');
const generateAIMBtn = document.querySelector('#generateAIMBtn');
const aimDetails = document.querySelector('#aimDetails');
const recordsList = document.querySelector('#recordsList');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const aimId = document.getElementById('aimId');
const pointsBalance = document.getElementById('pointsBalance');
const pointsHistory = document.getElementById('pointsHistory');

// Logout handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert(error.message);
        }
    });
}

// Generate AIM ID
function generateAIMID() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `AIM-${timestamp}-${randomStr}`.toUpperCase();
}

// Load AIM details
function loadAIMDetails() {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists && doc.data().aimId) {
                        aimDetails.innerHTML = `
                            <p><strong>AIM ID:</strong> ${doc.data().aimId}</p>
                            <p><strong>Generated on:</strong> ${new Date(doc.data().aimGeneratedAt.toDate()).toLocaleDateString()}</p>
                        `;
                        generateAIMBtn.style.display = 'none';
                    } else {
                        aimDetails.innerHTML = '<p>No AIM ID generated yet.</p>';
                    }
                });
        }
    });
}

// Generate AIM ID handler
if (generateAIMBtn) {
    generateAIMBtn.addEventListener('click', async () => {
        try {
            // Generate 12-digit hexadecimal
            const hexId = Array.from({length: 12}, () => 
                Math.floor(Math.random() * 16).toString(16)
            ).join('').toUpperCase();
            
            // Generate AIM ID format
            const prefix = 'AIM';
            const middle = auth.currentUser.uid.substring(0, 5).toUpperCase();
            const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
            const aimId = `${prefix}-${middle}-${suffix}`;
            
            // Update user record with both IDs
            await db.collection('users').doc(auth.currentUser.uid).update({
                aimId: aimId,
                hexId: hexId,
                aimGeneratedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Hide the generate button
            generateAIMBtn.style.display = 'none';
            
            // Show success message
            alert('AIM ID and Hexadecimal ID generated successfully!');
        } catch (error) {
            console.error('Error generating AIM ID:', error);
            alert('Error generating AIM ID. Please try again.');
        }
    });
}

// Add academic record handler
if (addRecordForm) {
    addRecordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const record = {
            institution: addRecordForm['institution'].value,
            course: addRecordForm['course'].value,
            year: parseInt(addRecordForm['year'].value),
            grade: addRecordForm['grade'].value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        auth.onAuthStateChanged(user => {
            if (user) {
                db.collection('users').doc(user.uid).collection('records').add(record)
                    .then(() => {
                        addRecordForm.reset();
                        loadRecords();
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            }
        });
    });
}

// Load academic records
function loadRecords() {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).collection('records')
                .orderBy('timestamp', 'desc')
                .get()
                .then(snapshot => {
                    let html = '';
                    snapshot.forEach(doc => {
                        const record = doc.data();
                        html += `
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h5 class="card-title">${record.institution}</h5>
                                    <p class="card-text">
                                        <strong>Course:</strong> ${record.course}<br>
                                        <strong>Year:</strong> ${record.year}<br>
                                        <strong>Grade:</strong> ${record.grade}
                                    </p>
                                    <button class="btn btn-danger btn-sm" onclick="deleteRecord('${doc.id}')">Delete</button>
                                </div>
                            </div>
                        `;
                    });
                    recordsList.innerHTML = html || '<p>No records found.</p>';
                });
        }
    });
}

// Delete record
function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this record?')) {
        auth.onAuthStateChanged(user => {
            if (user) {
                db.collection('users').doc(user.uid).collection('records').doc(recordId).delete()
                    .then(() => {
                        loadRecords();
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            }
        });
    }
}

// Check authentication state
window.auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Load user data
        const userRef = window.db.ref('users/' + user.uid);
        userRef.on('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                document.getElementById('userName').textContent = userData.name;
                document.getElementById('userEmail').textContent = userData.email;
                document.getElementById('aimId').textContent = userData.aimId || 'Not Generated';
                document.getElementById('hexId').textContent = userData.hexId || 'Not Generated';
                document.getElementById('pointsBalance').textContent = (userData.points || 0) + ' Points';
                
                // Show/Hide Generate AIM button based on whether AIM ID exists
                const generateBtn = document.getElementById('generateAIMBtn');
                if (generateBtn) {
                    generateBtn.style.display = userData.aimId ? 'none' : 'block';
                }
            }
        });

        // Load points history
        const historyRef = window.db.ref('pointsHistory/' + user.uid);
        historyRef.on('value', (snapshot) => {
            const history = snapshot.val();
            const tableBody = document.getElementById('pointsHistory');
            tableBody.innerHTML = '';

            if (history) {
                // Convert to array and sort by timestamp
                const entries = Object.entries(history).map(([key, value]) => ({
                    id: key,
                    ...value
                })).sort((a, b) => b.timestamp - a.timestamp);

                entries.forEach(entry => {
                    const row = document.createElement('tr');
                    const date = new Date(entry.timestamp);
                    row.innerHTML = `
                        <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                        <td>
                            <span class="badge bg-${entry.type === 'credit' ? 'success' : 'danger'}">
                                ${entry.type.toUpperCase()}
                            </span>
                        </td>
                        <td>${entry.type === 'credit' ? '+' : '-'}${entry.points}</td>
                        <td>${entry.description}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="4" class="text-center">No points history yet</td>
                `;
                tableBody.appendChild(row);
            }
        });

        // Generate AIM ID handler
        const generateAIMBtn = document.getElementById('generateAIMBtn');
        if (generateAIMBtn) {
            generateAIMBtn.addEventListener('click', async () => {
                try {
                    // Generate 12-digit hexadecimal
                    const hexId = Array.from({length: 12}, () => 
                        Math.floor(Math.random() * 16).toString(16)
                    ).join('').toUpperCase();
                    
                    // Generate AIM ID format
                    const prefix = 'AIM';
                    const middle = user.uid.substring(0, 5).toUpperCase();
                    const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
                    const aimId = `${prefix}-${middle}-${suffix}`;
                    
                    // Get user reference
                    const userRef = window.db.ref('users/' + user.uid);
                    
                    // Update user data
                    await userRef.update({
                        aimId: aimId,
                        hexId: hexId,
                        updatedAt: firebase.database.ServerValue.TIMESTAMP
                    });

                    // Add to points history
                    const historyRef = window.db.ref('pointsHistory/' + user.uid).push();
                    await historyRef.set({
                        type: 'credit',
                        points: 100, // Initial points for new AIM ID
                        description: 'Initial points for AIM ID generation',
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });

                    // Update user points
                    await userRef.update({
                        points: firebase.database.ServerValue.increment(100)
                    });

                    // Hide the generate button
                    generateAIMBtn.style.display = 'none';
                    
                    // Show success message
                    alert('AIM ID and Hexadecimal ID generated successfully! You received 100 initial points.');
                } catch (error) {
                    console.error('Error generating AIM ID:', error);
                    alert('Error: ' + error.message);
                }
            });
        }
    } else {
        // Not logged in, redirect to login
        window.location.href = 'index.html';
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await window.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert(error.message);
    }
});

// Load initial data
loadAIMDetails();
loadRecords();
