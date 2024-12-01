// Test Firebase Connection
document.addEventListener('DOMContentLoaded', function() {
    // Test auth state
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    });

    // Test Firestore
    firebase.firestore().collection('test')
        .add({
            test: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(function(docRef) {
            console.log('Test document written with ID: ', docRef.id);
            // Clean up test document
            docRef.delete();
        })
        .catch(function(error) {
            console.error('Error writing test document: ', error);
        });
});
