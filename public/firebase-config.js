// Firebase Configuration — Concept Czech HQ
const firebaseConfig = {
  apiKey: "AIzaSyDfUh30jTfTGeIiCuGbPWfQTFdKgoHniko",
  authDomain: "concept-czech-hq.firebaseapp.com",
  projectId: "concept-czech-hq",
  storageBucket: "concept-czech-hq.firebasestorage.app",
  messagingSenderId: "501868863857",
  appId: "1:501868863857:web:b2ed20351ab64670e096d0",
  measurementId: "G-NKK6S0GBX6"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available in this browser');
  }
});

// Set device language for auth
auth.useDeviceLanguage();
