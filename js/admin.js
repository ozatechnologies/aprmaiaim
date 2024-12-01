// DOM elements
const usersList = document.querySelector('#usersList');
const totalUsersElement = document.querySelector('#totalUsers');
const activeAIMsElement = document.querySelector('#activeAIMs');
const totalRecordsElement = document.querySelector('#totalRecords');

// Check if user is admin
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (!doc.exists || doc.data().role !== 'admin') {
                    window.location.href = 'dashboard.html';
                }
            });
    }
});

// Load users
function loadUsers() {
    db.collection('users').get()
        .then(snapshot => {
            let html = '';
            let totalUsers = 0;
            let activeAIMs = 0;

            snapshot.forEach(doc => {
                const user = doc.data();
                totalUsers++;
                if (user.aimId) activeAIMs++;

                html += `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.aimId || 'Not Generated'}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser('${doc.id}')">Delete</button>
                            ${user.role !== 'admin' ? 
                                `<button class="btn btn-sm btn-success ms-2" onclick="makeAdmin('${doc.id}')">Make Admin</button>` : 
                                ''}
                        </td>
                    </tr>
                `;
            });

            usersList.innerHTML = html;
            totalUsersElement.textContent = totalUsers;
            activeAIMsElement.textContent = activeAIMs;

            // Count total records
            countTotalRecords();
        });
}

// Count total records
function countTotalRecords() {
    let totalRecords = 0;
    
    db.collection('users').get()
        .then(snapshot => {
            const promises = [];
            
            snapshot.forEach(doc => {
                const promise = db.collection('users').doc(doc.id)
                    .collection('records').get()
                    .then(records => {
                        totalRecords += records.size;
                    });
                promises.push(promise);
            });

            Promise.all(promises)
                .then(() => {
                    totalRecordsElement.textContent = totalRecords;
                });
        });
}

// Delete user
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        // Delete user's records first
        db.collection('users').doc(userId).collection('records').get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    doc.ref.delete();
                });
                
                // Then delete user document
                return db.collection('users').doc(userId).delete();
            })
            .then(() => {
                loadUsers();
            })
            .catch(error => {
                alert(error.message);
            });
    }
}

// Make user admin
function makeAdmin(userId) {
    if (confirm('Are you sure you want to make this user an admin?')) {
        db.collection('users').doc(userId).update({
            role: 'admin'
        })
        .then(() => {
            loadUsers();
        })
        .catch(error => {
            alert(error.message);
        });
    }
}

// Load initial data
loadUsers();
