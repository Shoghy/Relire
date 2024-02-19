import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { get, getDatabase, push, ref } from "firebase/database";
import { BasicDBInfo, IApiRequest, IApiResponse, IColumForRequest } from "./types";

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

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Accept": "application/json"
};
const BadAPI: IApiResponse = {
  ok: false,
  error: {
    message: "The server didn't return a JSON",
    code: "bad-api-programmer",
    name: ""
  }
};

export function GetTables(userUID: string, db: string, tb?:string){
  let reference = `${userUID}/${db}/tables`;
  if(tb){
    reference += `/${tb}`;
  }
  try{
    return get(ref(database, reference));
  }catch(e){
    return {error: e};
  }
}

export function GetDataInTable(userUID: string, db:string, tb: string){
  const reference = ref(database, `${userUID}/${db}/tablesData/${tb}`);
  return get(reference);
}

export async function GetDatabases(): Promise<IApiResponse<{dbInfos?: BasicDBInfo[]}>>{
  await auth.authStateReady();
  const userIDToken = await auth.currentUser?.getIdToken();

  const requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user"
  };

  const response = await fetch(
    "/api/get-databases", {
      body: JSON.stringify(requestBody),
      method: "POST",
      headers: headers
    }
  );

  try{
    const apiResponse: IApiResponse<{dbInfos: BasicDBInfo[]}> = await response.json();
    return apiResponse;
  }catch(e){}

  return BadAPI;
}

export async function CreateDatabase(db: string): Promise<IApiResponse>{
  const userIDToken = await auth.currentUser?.getIdToken();

  const requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    dbName: db
  };

  const response = await fetch(
    "/api/create-db", {
      body: JSON.stringify(requestBody),
      method: "POST",
      headers: headers
    });

  try{
    const userUID = auth.currentUser?.uid;
    const apiResponse: IApiResponse = await response.json();
    apiResponse.dbRef = ref(database, `${userUID}/${apiResponse.dbUID}`);
    return apiResponse;
  }catch(e){}

  return BadAPI;
}

export async function CreateTable(db: string, tableName: string, columns: IColumForRequest[]){
  await auth.authStateReady();
  const userIDToken = await auth.currentUser?.getIdToken();

  const requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    dbUID: db,
    tableName: tableName,
    columns: columns
  };

  const response = await fetch(
    "/api/create-table", {
      body: JSON.stringify(requestBody),
      method: "POST",
      headers: headers
    });

  try{
    const apiResponse: IApiResponse = await response.json();
    return apiResponse;
  }catch(e){}

  return BadAPI;
}

export function InsertRow(
  userUID: string,
  db: string,
  tb: string,
  data: unknown
){
  const reference = ref(database, `${userUID}/${db}/tablesData/${tb}`);
  return push(reference, data);
}

export async function DeleteRow(db: string, tableName: string, rowUID: string){
  await auth.authStateReady();
  const userIDToken = await auth.currentUser?.getIdToken();

  const requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    tableName,
    rowUID,
    dbUID: db
  };

  const response = await fetch("/api/delete-row", {
    body: JSON.stringify(requestBody),
    method: "POST",
    headers: headers
  });

  try{
    return await response.json() as IApiResponse;
  }catch(e){}

  return BadAPI;
}

export async function DeleteTable(db: string, tableName: string){
  await auth.authStateReady();
  const userIDToken = await auth.currentUser?.getIdToken();

  const requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    tableName,
    dbUID: db
  };

  const response = await fetch("/api/delete-table", {
    body: JSON.stringify(requestBody),
    method: "POST",
    headers: headers
  });

  try{
    return await response.json() as IApiResponse;
  }catch(e){}

  return BadAPI;
}

export async function DeleteDatabase(dbUID: string, dbName: string){
  await auth.authStateReady();
  const userIDToken = await auth.currentUser?.getIdToken();

  const requestBody: IApiRequest = {
    auth: userIDToken as string,
    type: "user",
    dbUID,
    dbName
  };

  const response = await fetch("/api/delete-database", {
    body: JSON.stringify(requestBody),
    method: "POST",
    headers: headers
  });

  try{
    return await response.json() as IApiResponse;
  }catch(e){}

  return BadAPI;
}

export { app, auth, database };
