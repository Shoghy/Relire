import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { get, getDatabase, ref } from "firebase/database"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const database = getDatabase(app);

export function GetTables(userUID: string, db: string, tb?:string){
  let reference = `${userUID}/${db}/tables`;
  if(tb){
    reference += `/${tb}`
  }
  return get(ref(database, reference));
}

export function GetDataInTable(userUID: string, db:string, tb: string){
  let reference = ref(database, `${userUID}/${db}/tablesData/${tb}`);
  return get(reference);
}

export { app, auth, database }
