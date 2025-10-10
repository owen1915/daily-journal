import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNFThPakvar5U1htDpIwI-eSK8naw434U",
  authDomain: "dailyjournal-d0d95.firebaseapp.com",
  projectId: "dailyjournal-d0d95",
  storageBucket: "dailyjournal-d0d95.firebasestorage.app",
  messagingSenderId: "439797097569",
  appId: "1:439797097569:web:da1ac1f2d791752a5f7620",
  measurementId: "G-WHR73P3JTM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services you'll actually use
export const auth = getAuth(app);
export const db = getFirestore(app);
