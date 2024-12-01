// Wait for Firebase to initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Check if user is admin
            const userRef = window.db.ref('users/' + user.uid);
            userRef.once('value', (snapshot) => {
                const userData = snapshot.val();
                if (!userData || userData.role !== 'admin') {
                    // Not an admin, redirect to dashboard
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                // Show admin name
                document.getElementById('adminName').textContent = userData.name;
                
                // Initialize admin features
                initializeAdminFeatures();
            });
        } else {
            // Not logged in, redirect to login
            window.location.href = 'index.html';
        }
    });
});

function initializeAdminFeatures() {
    // Initialize Bootstrap components
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Load users
    loadUsers();
    
    // Load points history
    loadPointsHistory();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize event listeners
    initializeEventListeners();
}

function loadUsers() {
    const usersRef = window.db.ref('users');
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val();
        const tableBody = document.getElementById('usersList');
        tableBody.innerHTML = '';

        if (users) {
            Object.entries(users).forEach(([userId, userData]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${userData.name || 'N/A'}</td>
                    <td>${userData.email || 'N/A'}</td>
                    <td>${userData.aimId || 'Not Generated'}</td>
                    <td>${userData.hexId || 'N/A'}</td>
                    <td>${userData.points || 0}</td>
                    <td>
                        <span class="badge bg-${userData.role === 'admin' ? 'danger' : 'primary'}">
                            ${userData.role || 'user'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="openPointsModal('${userId}', '${userData.name}')" data-bs-toggle="tooltip" title="Manage Points">
                            <i class="bi bi-coin"></i>
                        </button>
                        <button class="btn btn-sm btn-info me-1" onclick="openRoleModal('${userId}', '${userData.name}', '${userData.role}')" data-bs-toggle="tooltip" title="Change Role">
                            <i class="bi bi-person-badge"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${userId}')" data-bs-toggle="tooltip" title="Delete User">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    });
}

function loadPointsHistory() {
    const historyRef = window.db.ref('pointsHistory');
    historyRef.on('value', (snapshot) => {
        const history = snapshot.val();
        const tableBody = document.getElementById('pointsHistoryList');
        tableBody.innerHTML = '';

        if (history) {
            // Get all users first
            window.db.ref('users').once('value', (usersSnapshot) => {
                const users = usersSnapshot.val();
                
                // Process each user's points history
                Object.entries(history).forEach(([userId, userHistory]) => {
                    Object.entries(userHistory).forEach(([transactionId, transaction]) => {
                        const row = document.createElement('tr');
                        const date = new Date(transaction.timestamp);
                        const userName = users[userId]?.name || 'Unknown User';
                        const adminName = users[transaction.adminId]?.name || 'System';
                        
                        row.innerHTML = `
                            <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                            <td>${userName}</td>
                            <td>
                                <span class="badge bg-${transaction.type === 'credit' ? 'success' : 'danger'}">
                                    ${transaction.type.toUpperCase()}
                                </span>
                            </td>
                            <td>${transaction.type === 'credit' ? '+' : '-'}${transaction.points}</td>
                            <td>${transaction.description}</td>
                            <td>${adminName}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                });
            });
        }
    });
}

function initializeSearch() {
    // User search
    document.getElementById('userSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.getElementById('usersList').getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Points history search
    document.getElementById('pointsSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.getElementById('pointsHistoryList').getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function initializeEventListeners() {
    // Points form submission
    document.getElementById('submitPoints').addEventListener('click', async () => {
        const userId = document.getElementById('selectedUserId').value;
        const action = document.getElementById('pointsAction').value;
        const amount = parseInt(document.getElementById('pointsAmount').value);
        const description = document.getElementById('pointsDescription').value;

        try {
            const userRef = window.db.ref('users/' + userId);
            const currentAdmin = window.auth.currentUser;

            // Update user points
            await userRef.update({
                points: firebase.database.ServerValue.increment(action === 'credit' ? amount : -amount)
            });

            // Add to points history
            const historyRef = window.db.ref('pointsHistory/' + userId).push();
            await historyRef.set({
                type: action,
                points: amount,
                description: description,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                adminId: currentAdmin.uid
            });

            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('pointsModal'));
            modal.hide();
            document.getElementById('pointsForm').reset();
        } catch (error) {
            console.error('Error managing points:', error);
            alert('Error: ' + error.message);
        }
    });

    // Role form submission
    document.getElementById('submitRole').addEventListener('click', async () => {
        const userId = document.getElementById('roleUserId').value;
        const newRole = document.getElementById('userRole').value;

        try {
            await window.db.ref('users/' + userId).update({
                role: newRole
            });

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('roleModal'));
            modal.hide();
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Error: ' + error.message);
        }
    });

    // Settings form submission
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const settings = {
            initialPoints: parseInt(document.getElementById('initialPoints').value),
            maxDeduction: parseInt(document.getElementById('maxDeduction').value)
        };

        try {
            await window.db.ref('settings').set(settings);
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error: ' + error.message);
        }
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await window.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error: ' + error.message);
        }
    });
}

// Modal opening functions
function openPointsModal(userId, userName) {
    document.getElementById('selectedUserId').value = userId;
    document.getElementById('selectedUserName').value = userName;
    new bootstrap.Modal(document.getElementById('pointsModal')).show();
}

function openRoleModal(userId, userName, currentRole) {
    document.getElementById('roleUserId').value = userId;
    document.getElementById('roleUserName').value = userName;
    document.getElementById('userRole').value = currentRole;
    new bootstrap.Modal(document.getElementById('roleModal')).show();
}

// User deletion
async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            // Delete user data
            await window.db.ref('users/' + userId).remove();
            // Delete points history
            await window.db.ref('pointsHistory/' + userId).remove();
            alert('User deleted successfully!');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error: ' + error.message);
        }
    }
}
