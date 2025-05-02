import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK for server-side operations
function initializeFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    // Use service account credentials from environment variables
    try {
      // If using a service account JSON string from env var
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;

      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);

      // Fall back to app initialization without credentials
      // This works in environments like Vercel where Firebase Admin auto-detects credentials
      initializeApp();
    }
  }

  return {
    db: getFirestore(),
    storage: getStorage(),
  };
}

// Export Firebase Admin instances
export const { db, storage } = initializeFirebaseAdmin();
