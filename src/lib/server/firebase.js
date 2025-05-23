import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } from '$env/static/private';


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: FIREBASE_PROJECT_ID,
      client_email: FIREBASE_CLIENT_EMAIL,
      private_key: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
export const adminDb = getFirestore();
export const adminAuth = getAuth();
export { admin }