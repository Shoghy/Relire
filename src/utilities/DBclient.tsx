import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { get, getDatabase, push, ref } from "firebase/database"
import { IApiRequest, IApiResponse, IColumForRequest } from './types';

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
const serverURL = import.meta.env.VITE_SERVER_URL;
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  'Accept': 'application/json'
}
const BadAPI: IApiResponse = {
  ok: false,
  error: {
    message: "The server didn't return a JSON",
    code: "bad-api-programmer",
    name: ""
  }
}

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

export async function GetDatabases(): Promise<IApiResponse>{
  await auth.authStateReady();
  let userIDToken = await auth.currentUser?.getIdToken();

  let requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user"
  }

  let response = await fetch(
    `${serverURL}/api/get-databases`, {
      body: JSON.stringify(requestBody),
      method: "POST",
      headers: headers
    }
  )

  try{
    let apiResponse: IApiResponse = await response.json();
    return apiResponse;
  }catch(e){
    console.log(e)
  }

  return BadAPI;
}

export async function CreateDatabase(db: string): Promise<IApiResponse>{
  let userIDToken = await auth.currentUser?.getIdToken();

  let requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    dbName: db
  }

  let response = await fetch(
    `${serverURL}/api/create-db`, {
    body: JSON.stringify(requestBody),
    method: "POST",
    headers: headers
  });

  try{
    let userUID = auth.currentUser?.uid;
    let apiResponse: IApiResponse = await response.json();
    apiResponse.dbRef = ref(database, `${userUID}/${apiResponse.dbUID}`)
    return apiResponse;
  }catch(e){
    console.log(e);
  }

  return BadAPI;
}

export async function CreateTable(db: string, tableName: string, columns: IColumForRequest[]){
  await auth.authStateReady();
  let userIDToken = await auth.currentUser?.getIdToken();

  let requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    dbUID: db,
    tableName: tableName,
    columns: columns
  }

  let response = await fetch(
    `${serverURL}/api/create-table`, {
    body: JSON.stringify(requestBody),
    method: "POST",
    headers: headers
  });

  try{
    let apiResponse: IApiResponse = await response.json();
    return apiResponse;
  }catch(e){
    console.log(e);
  }

  return BadAPI;
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
