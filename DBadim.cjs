const admin = require("firebase-admin");
const serviceAccount = require("./RelireFirebaseAdmin.json");
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});

(async () => {
  console.log((await admin.database().ref("/").get()).val());
})()