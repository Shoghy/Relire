import * as admin from "firebase-admin"
import serviceAccount from "./RelireFirebaseAdmin.json"
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});
