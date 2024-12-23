// Wait for Firebase to initialize
window.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const loginForm = document.querySelector('#loginForm');
    const registerForm = document.querySelector('#registerForm');
    const logoutBtn = document.querySelector('#logoutBtn');

    // Register form handler
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const name = registerForm['registerName'].value;
                const email = registerForm['registerEmail'].value;
                const password = registerForm['registerPassword'].value;

                // Show loading state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = 'Registering...';
                submitBtn.disabled = true;

                // Create user
                const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                
                // Add user details to Realtime Database
                await window.db.ref('users/' + userCredential.user.uid).set({
                    name: name,
                    email: email,
                    role: 'user',
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });

                console.log('User registered successfully');

                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.querySelector('#registerModal'));
                modal.hide();
                registerForm.reset();

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message);
                
                // Reset button state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = 'Register';
                submitBtn.disabled = false;
            }
        });
    }

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const email = loginForm['loginEmail'].value;
                const password = loginForm['loginPassword'].value;

                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = 'Logging in...';
                submitBtn.disabled = true;

                const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
                
                // Check user role and redirect accordingly
                window.db.ref('users/' + userCredential.user.uid).once('value')
                    .then((snapshot) => {
                        // Close modal and reset form
                        const modal = bootstrap.Modal.getInstance(document.querySelector('#loginModal'));
                        modal.hide();
                        loginForm.reset();

                        if (snapshot.val().role === 'admin') {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    });
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message);
                
                // Reset button state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = 'Login';
                submitBtn.disabled = false;
            }
        });
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert(error.message);
            }
        });
    }

    // Auth state changes
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('User signed in:', user.email);
            
            // Check if on login page and redirect if necessary
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                window.db.ref('users/' + user.uid).once('value')
                    .then((snapshot) => {
                        if (snapshot.val().role === 'admin') {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    });
            }
        } else {
            console.log('User signed out');
            
            // If not on index page, redirect to login
            if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
        }
    });
});
