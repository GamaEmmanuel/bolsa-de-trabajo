import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Firebase configuration with hardcoded values
const firebaseConfig = {
  apiKey: "AIzaSyBjG3M5sb9y6xk1bu_-lp-aSBIn8ng2UZ8",
  authDomain: "jobportal-4b561.firebaseapp.com",
  projectId: "jobportal-4b561",
  storageBucket: "jobportal-4b561.firebasestorage.app",
  messagingSenderId: "679742411599",
  appId: "1:679742411599:web:3cf2873537296aacdbeb3a",
  measurementId: "G-PX2T3R6M1T"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize auth with explicit LOCAL persistence
const auth = getAuth(app);

// Explicitly set persistence to LOCAL (survives page refreshes and browser restarts)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
  });
}

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };