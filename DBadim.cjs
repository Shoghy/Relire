const admin = require("firebase-admin");
const serviceAccount = require("./RelireFirebaseAdmin.json");
const express = require("express");

/**
 * @typedef {express.Request<{}, any, any, QueryString.ParsedQs, Record<string, any>>} Request
 * @typedef {express.Response<any, Record<string, any>, number>} Response
 * @typedef {(req: Request, res: Response) => void} AdminHandler
*/

require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});

/** @type {AdminHandler} */
async function CreateDB(req, res){
  res.json({"hola": "mundo"})
}

/** @type {AdminHandler} */
module.exports = function RoutesHandler(req, res){
  if(!req.is("json")){
    res
    .status(400)
    .json({
      "ok": false,
      "error": {
        "message": "JSON needed for authorization and context info.",
        "code": "request-without-JSON"
      }
    });
    return;
  }

  if(req.originalUrl === "/api/create-db"){
    CreateDB(req, res);
    return;
  }

  res
  .status(404)
  .json({
    ok: false,
    error:{
      message: "Page not found",
      code: "wrong-url"
    }
  })
}