/**
 * Firebase Configuration
 * Initializes and exports Firebase services for the application
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
// Reads from Vite env vars (local .env or Cloud Run build vars).
// Falls back to the project values so the app works even if build vars are not set.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBNys7JagJc3DCyeZ-KCen9Pg21AmeweoQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "college-management-syste-34d63.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "college-management-syste-34d63",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "college-management-syste-34d63.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "277023675773",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:277023675773:web:c6bede8cdf013671916814",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PQGKSH10SH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);