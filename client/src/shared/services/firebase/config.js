import { initializeApp } from "firebase/app";

// Validate required environment variables
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.error(
    "❌ Missing required Firebase environment variables:",
    missingVars
  );
  throw new Error(`Missing Firebase configuration: ${missingVars.join(", ")}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  throw error;
}

// ✅ LAZY-LOADED SERVICES - Only create when needed
let _auth = null;
let _db = null;
let _storage = null;
let _functions = null;

export const getAuth = async () => {
  if (!_auth) {
    const { getAuth: initAuth } = await import("firebase/auth");
    _auth = initAuth(app);
  }
  return _auth;
};

export const getFirestore = async () => {
  if (!_db) {
    const { getFirestore: initFirestore } = await import("firebase/firestore");
    _db = initFirestore(app);
  }
  return _db;
};

export const getStorage = async () => {
  if (!_storage) {
    const { getStorage: initStorage } = await import("firebase/storage");
    _storage = initStorage(app);
  }
  return _storage;
};

export const getFunctions = async () => {
  if (!_functions) {
    const { getFunctions: initFunctions } = await import("firebase/functions");
    _functions = initFunctions(app);
  }
  return _functions;
};

// Legacy exports for backward compatibility (these will throw helpful errors)
export const auth = new Proxy(
  {},
  {
    get() {
      throw new Error("Use getAuth() instead of direct auth import");
    },
  }
);

export const db = new Proxy(
  {},
  {
    get() {
      throw new Error("Use getFirestore() instead of direct db import");
    },
  }
);

export const storage = new Proxy(
  {},
  {
    get() {
      throw new Error("Use getStorage() instead of direct storage import");
    },
  }
);

export const functions = new Proxy(
  {},
  {
    get() {
      throw new Error("Use getFunctions() instead of direct functions import");
    },
  }
);

export default app;
