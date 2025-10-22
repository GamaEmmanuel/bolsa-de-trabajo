import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

const auth = getAuth(app);

// Set persistence to local storage so users remain logged in across browser sessions
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };