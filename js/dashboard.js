// DOM elements
const logoutBtn = document.querySelector('#logoutBtn');
const addRecordForm = document.querySelector('#addRecordForm');
const generateAIMBtn = document.querySelector('#generateAIM');
const aimDetails = document.querySelector('#aimDetails');
const recordsList = document.querySelector('#recordsList');

// Logout handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch(error => {
                alert(error.message);
            });
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
    generateAIMBtn.addEventListener('click', () => {
        const aimId = generateAIMID();
        
        auth.onAuthStateChanged(user => {
            if (user) {
                db.collection('users').doc(user.uid).update({
                    aimId: aimId,
                    aimGeneratedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    loadAIMDetails();
                })
                .catch(error => {
                    alert(error.message);
                });
            }
        });
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

// Load initial data
loadAIMDetails();
loadRecords();
