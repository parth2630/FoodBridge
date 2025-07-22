// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPayDXfA9mhvvkOPNEAzywQyV3LoEwi0g",
  authDomain: "food-donation-977f5.firebaseapp.com",
  projectId: "food-donation-977f5",
  storageBucket: "food-donation-977f5.firebasestorage.app",
  messagingSenderId: "812006494745",
  appId: "1:812006494745:web:e250b7d51e2a119c5cd088",
  measurementId: "G-GSXRCC1FBS"
};

let auth, db, storage, analytics;

// Initialize Firebase
try {
  const app = initializeApp(firebaseConfig);

  // Initialize Firestore with explicit settings
  try {
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
  } catch (firestoreError) {
    console.warn('Failed to initialize with settings, falling back to default:', firestoreError);
    db = getFirestore(app);
  }
  
  // Enable offline persistence
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence enabled in another tab');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser doesn\'t support persistence');
      }
    });

  // Initialize other Firebase services
  analytics = getAnalytics(app);
  auth = getAuth(app);
  storage = getStorage(app);

  // Enable persistent auth state
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });

} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export { auth, db, storage, analytics };
