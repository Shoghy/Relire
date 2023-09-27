const admin = require("firebase-admin");
const serviceAccount = require("./RelireFirebaseAdmin.json");
const express = require("express");

/**
 * @typedef {express.Request<{}, any, any, QueryString.ParsedQs, Record<string, any>>} Request
 * @typedef {express.Response<any, Record<string, any>, number>} Response
 * @typedef {(req: Request, res: Response) => void} AdminHandler
 * @typedef {{
 *  auth: string
 *  type: "user" | "key",
 *  [key: string]: any
 * }} ReqInfo
 * @typedef {{
 *  code: string,
 *  message: string
 * }} GenericError
*/

require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});

const auth = admin.auth();
const database = admin.database();

const STATUS_CODES = {
  BAD_REQUEST: 400,
  PAGE_NOT_FOUND: 404,
  OK: 200,
  CREATED: 201,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500,
  INSUFFICIENT_STORAGE: 507,
  TOO_MANY_REQUESTS: 429,
  FAILED_DEPENDENCY: 424,
  IDK: 69420
}

/**@type {<T>(func: () => Promise<T>) => Promise<[T, null] | [null, GenericError]>} */
async function AsyncAttempter(func){
  try{
    let result = await func();
    return [result, null]
  }catch(e){
    return [null, e]
  }
}

/**
 * @param {string} authId
 * @param {Response} res
 * @returns {Promise<admin.auth.DecodedIdToken | null>}
 */
async function GetUserHandler(authId, res){
  let [user, userError] = await AsyncAttempter(
    () => auth.verifyIdToken(authId, true)
  )

  if(userError){
    switch(userError.code){
      case "auth/id-token-revoked":{
        res.status(STATUS_CODES.UNAUTHORIZED)
        .json({
          ok: false,
          error:{
            message: "The Id Token sended was revoked",
            code: "id-token-revoked"
          }
        });
        break;
      }
      default:{
        res.status(STATUS_CODES.FAILED_DEPENDENCY)
        .json({
          ok: false,
          error:{
            message: "An error occurred, try again later",
            code: "unkwon-error"
          }
        });
        break;
      }
    }
    console.log(userError.code);
    console.log(userError.message);
    console.log(reqInfo);
    return null;
  }

  return user
}

/** @type {AdminHandler} */
async function CreateDB(req, res){
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  if(reqInfo.type === "key"){
    res.status(STATUS_CODES.UNAUTHORIZED)
    .json({
      ok: false,
      error:{
        message: "The API key just work on the database that was created.",
        code: "apikey-out-of-bounds"
      }
    });
    return;
  }

  if(!("dbName" in reqInfo)){
    res.status(STATUS_CODES.BAD_REQUEST)
    .json({
      ok: false,
      error:{
        message: "Database name was not granted.",
        code: "missing-dbName"
      }
    });
    return;
  }else if(typeof(reqInfo.dbName) !== "string"){
    res.status(STATUS_CODES.BAD_REQUEST)
    .json({
      ok: false,
      error:{
        message: "Database name is not a string.",
        code: "wrong-dbName"
      }
    });
    return;
  }else if(!reqInfo.dbName.trim()){
    res.status(STATUS_CODES.BAD_REQUEST)
    .json({
      ok: false,
      error:{
        message: "Database name is an empty string.",
        code: "wrong-dbName"
      }
    });
    return;
  }

  reqInfo.dbName = reqInfo.dbName.trim();

  let user = await GetUserHandler(reqInfo.auth, res);
  if(user === null) return;

  let userSpaceRef = database.ref(user.uid);
  let countDatabases = (await database.ref(user.uid).get()).numChildren();

  if(countDatabases < 5){
    /**@type {[admin.database.Reference, GenericError]} */
    let [dbResponse, pushError] = await AsyncAttempter(
      () => userSpaceRef.push({
        dbName: reqInfo.dbName,
        author: user.uid
      })
    );

    if(pushError){
      console.log(pushError);
      res.status(STATUS_CODES.FAILED_DEPENDENCY)
      .json({
        ok: false,
        error:{
          message: "An error occurred, try again later",
          code: "unkwon-error"
        }
      });
      return;
    }

    res.status(STATUS_CODES.CREATED)
    .json({
      ok: true,
      dbUID: dbResponse.key
    });
    return;
  }

  res.status(STATUS_CODES.TOO_MANY_REQUESTS)
  .json({
    ok: false,
    error:{
      message: "Sorry, for now, each user is limited to 5 databases.",
      code: "db-limit"
    }
  });
}

/** @type {AdminHandler} */
module.exports = function RoutesHandler(req, res){
  if(!req.is("json")){
    res.status(STATUS_CODES.BAD_REQUEST)
    .json({
      "ok": false,
      "error": {
        "message": "JSON needed for authorization and context info.",
        "code": "request-without-JSON"
      }
    });
    return;
  }

  if(!("auth" in req.body) || !("type" in req.body)){
    res.status(STATUS_CODES.BAD_REQUEST)
    .json({
      "ok": false,
      "error": {
        "message": "Incomplete or no auth was sended information.",
        "code": "missing-auth"
      }
    });
    return;
  }

  if(req.originalUrl === "/api/create-db"){
    CreateDB(req, res);
    return;
  }

  res.status(STATUS_CODES.PAGE_NOT_FOUND)
  .json({
    ok: false,
    error:{
      message: "Page not found",
      code: "wrong-url"
    }
  })
}