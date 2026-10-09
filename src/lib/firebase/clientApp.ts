import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase only once to prevent Next.js hot-reload errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Ensure session persists across tab closures
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging conditionally (only supported in browsers and secured contexts)
export const messaging = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};
