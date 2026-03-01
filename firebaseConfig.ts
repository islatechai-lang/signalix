import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApegsQKwBIrK8kmrqBjxioOUJRWyIvh4A",
  authDomain: "signalix-5c646.firebaseapp.com",
  projectId: "signalix-5c646",
  storageBucket: "signalix-5c646.firebasestorage.app",
  messagingSenderId: "426287248452",
  appId: "1:426287248452:web:8f9635b599fc139c923811",
  measurementId: "G-96HZH2KSZB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Auth and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);