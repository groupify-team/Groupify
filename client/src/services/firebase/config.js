import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Debug: Log environment variables
console.log("Firebase Config Debug:");
console.log(
  "API Key:",
  import.meta.env.VITE_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing"
);
console.log("Auth Domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log("Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("Storage Bucket:", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Final Firebase Config:", firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
console.log("Functions initialized:", functions);

export { app };
export default app;
