// ========================================
// Firebase Configuration - EXAMPLE
// ========================================
// This is a sample/template file showing how your firebase-config.js should look
// DO NOT use these values - they are just examples!

// Copy this template to firebase-config.js and replace with your actual Firebase credentials

const firebaseConfig = {
    apiKey: "AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "ambition-care-12345.firebaseapp.com",
    databaseURL: "https://ambition-care-12345-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ambition-care-12345",
    storageBucket: "ambition-care-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log("🔥 Firebase initialized successfully!");

// ========================================
// How to get your actual configuration:
// ========================================
// 1. Go to https://console.firebase.google.com/
// 2. Select your project
// 3. Click gear icon ⚙️ → Project settings
// 4. Scroll to "Your apps" section
// 5. Click on the Web app (</> icon)
// 6. Copy the firebaseConfig object
// 7. Paste it above, replacing the example values
// ========================================
