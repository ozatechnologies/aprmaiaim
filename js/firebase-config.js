// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyChbFyLFkELidW7oSW0hiolmfscLaKTDzg",
    authDomain: "aimid-6731b.firebaseapp.com",
    databaseURL: "https://aimid-6731b-default-rtdb.firebaseio.com",
    projectId: "aimid-6731b",
    storageBucket: "aimid-6731b.firebasestorage.app",
    messagingSenderId: "568462521581",
    appId: "1:568462521581:web:d27295fc87247bae0408e4",
    measurementId: "G-45VZ0Q1978"
};

let auth;
let db;

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Initialize Analytics
    firebase.analytics();
    
    // Initialize services
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence()
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.log('Multiple tabs open, persistence can only be enabled in one tab at a time');
            } else if (err.code === 'unimplemented') {
                console.log('Browser doesn\'t support persistence');
            }
        });

    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}
