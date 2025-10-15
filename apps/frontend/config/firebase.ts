import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Expo automatically exposes environment variables with EXPO_PUBLIC_ prefix
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase environment variables: ${missingKeys.join(', ')}`
  );
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
const auth: Auth = getAuth(app);

// Set persistence for React Native
// Note: In Expo/React Native, Firebase Auth uses AsyncStorage automatically for persistence
// For web, we explicitly set browserLocalPersistence
if (Platform.OS === 'web') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✓ Firebase Auth persistence enabled (web)');
    })
    .catch((error) => {
      console.warn('Failed to set auth persistence:', error);
    });
} else {
  // React Native automatically persists auth state
  console.log('✓ Firebase Auth persistence enabled (React Native - automatic)');
}

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Functions
const functions: Functions = getFunctions(app);

// Initialize Analytics (web only)
let analytics: Analytics | null = null;
if (Platform.OS === 'web') {
  // Check if analytics is supported (not blocked by ad blockers, privacy settings, etc.)
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('✓ Firebase Analytics initialized');
    } else {
      console.log('ℹ Firebase Analytics not supported (ad blocker or privacy settings)');
    }
  }).catch(() => {
    console.log('ℹ Firebase Analytics initialization skipped');
  });
}

// Connect to emulators in development
// Set EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true in your .env file to use emulators
const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

if (useEmulator && __DEV__) {
  const emulatorHost = Platform.OS === 'web' ? 'localhost' : '10.0.2.2'; // Android emulator uses 10.0.2.2
  
  try {
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    console.log('✓ Connected to Firebase Emulators');
  } catch (error) {
    console.log('Emulators already initialized or not available');
  }
}

export { auth, db, functions, analytics };
export default app;
