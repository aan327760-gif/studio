
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let appInstance: FirebaseApp;
let dbInstance: Firestore;
let authInstance: Auth;

/**
 * Initializes Firebase services and ensures single instances of each service.
 * This helps prevent "Unexpected state" errors in Next.js development mode.
 */
export function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } {
  if (!appInstance) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
  }

  return { app: appInstance, db: dbInstance, auth: authInstance };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
