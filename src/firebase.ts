import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export async function logAuditAction(action: string, licenseKey: string, details: string) {
  if (!auth.currentUser) return;
  
  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: new Date().toISOString(),
      userId: auth.currentUser.uid,
      action,
      licenseKey,
      details
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
