// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHbbchBTrJKWuf2au5BsZZCGaE3nvPRnY",
  authDomain: "sitemanager-bc330.firebaseapp.com",
  projectId: "sitemanager-bc330",
  storageBucket: "sitemanager-bc330.firebasestorage.app",
  messagingSenderId: "980661817778",
  appId: "1:980661817778:web:f569fe40220bcb28e194ab",
  measurementId: "G-WCY4N5JQ77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app); 