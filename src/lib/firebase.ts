import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDW8lhCvg6n8gEpkm1A_Wggots_K7syajc",
  authDomain: "ti-coolture.firebaseapp.com",
  projectId: "ti-coolture",
  storageBucket: "ti-coolture.firebasestorage.app",
  messagingSenderId: "70044379295",
  appId: "1:70044379295:web:87c29650cdf36c8cba1aaa",
  measurementId: "G-Z48VZWX588"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore using default database for your production project
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
