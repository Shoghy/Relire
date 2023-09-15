import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { get, getDatabase, push, ref } from "firebase/database"
import { IApiRequest, IApiResponse } from './types';

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

export function GetDatabases(userUID: string, db?: string){
  let reference = `${userUID}`;
  if(db){
    reference += `/${db}`
  }
  return get(ref(database, reference));
}
export async function CreateDatabase(db: string): Promise<IApiResponse>{
  let userIDToken = await auth.currentUser?.getIdToken();

  let requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    dbName: db
  }

  let response = await fetch(
    "http://localhost:5173/api/create-db", {
    body: JSON.stringify(requestBody),
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      'Accept': 'application/json'
    }
  });

  try{
    let userUID = auth.currentUser?.uid;
    let apiResponse: IApiResponse = await response.json();
    apiResponse.dbRef = ref(database, `${userUID}/${apiResponse.dbUID}`)
    return apiResponse;
  }catch(e){
    console.log(e);
    return {
      ok: false,
      error: {
        message: "The server didn't return a JSON",
        code: "bad-api-programmer",
        name: ""
      }
    }
  }
  /*let reference = ref(database, userUID);

  let newDB:IDataBase = {
    dbName:db,
    author: userUID
  };

  return push(reference, newDB)*/
}

export function InsertRow(
  userUID: string,
  db: string,
  tb: string,
  data: unknown
){
  let reference = ref(database, `${userUID}/${db}/tablesData/${tb}`);
  return push(reference, data);
}

export { app, auth, database }
