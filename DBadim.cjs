const admin = require("firebase-admin");
const serviceAccount = require("./RelireFirebaseAdmin.json");
const express = require("express");
const CryptoJS = require("crypto-js");

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
 * 
 * @typedef dbInfo
 * @prop {string} dbUID
 * @prop {string} dbName
 * 
 * @typedef ForeingKey
 * @prop {string} tableName
 * @prop {string} column
 * 
 * @typedef Columns
 * @prop {string} type
 * @prop {string} name
 * @prop {boolean} notNull
 * @prop {boolean} unique
 * @prop {ForeingKey | undefined} foreingKey
 * 
 * @typedef ApiKey
 * @prop {string} user
 * @prop {string} dbUID
 * @prop {string} random
 * 
 * @typedef {(req: Request, res: Response) => Promise<{dbUID: string, userUID: string} | null>} VerifyAuth
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
async function AsyncAttempter(func) {
  try {
    let result = await func();
    return [result, null]
  } catch (e) {
    return [null, e]
  }
}

/**
 * @param {Response} res
 * @param {any} value 
 * @param {{
 *  NotSended: GenericError,
 *  WrongType: GenericError,
 *  EmptyString: GenericError
 * }} errors
 * @returns {false | string}
 */
function IsValidString(res, value, errors) {
  if (value === undefined) {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        ok: false,
        error: errors.NotSended
      });
    return false;
  } else if (typeof (value) !== "string") {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        ok: false,
        error: errors.WrongType
      });
    return false;
  } else if (!value.trim()) {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        ok: false,
        error: errors.EmptyString
      });
    return false;
  }

  return value.trim();
}

/**
 * @param {string} authId
 * @param {Response} res
 * @returns {Promise<admin.auth.DecodedIdToken | null>}
 */
async function GetUserHandler(authId, res) {
  let [user, userError] = await AsyncAttempter(
    () => auth.verifyIdToken(authId, true)
  )

  if (userError) {
    switch (userError.code) {
      case "auth/id-token-revoked": {
        res.status(STATUS_CODES.UNAUTHORIZED)
          .json({
            ok: false,
            error: {
              message: "The Id Token sended was revoked",
              code: "id-token-revoked"
            }
          });
        break;
      }
      default: {
        res.status(STATUS_CODES.FAILED_DEPENDENCY)
          .json({
            ok: false,
            error: {
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

/**@type {VerifyAuth} */
async function VerifyAuthUser(req, res) {

}

/**@type {VerifyAuth} */
async function VerifyAuthKey(req, res) {

}

/**@type {VerifyAuth} */
async function VerifyAuthInformation(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  req.body.dbUID = IsValidString(
    res,
    reqInfo.dbUID,
    {
      EmptyString: {
        code: "wrong-dbUID",
        message: "The dbUID sended was an empty string."
      },
      NotSended: {
        code: "no-dbUID",
        message: "There was no dbUID in the request sended."
      },
      WrongType: {
        code: "wrong-dbUID",
        message: "The dbUID sended was not a string."
      }
    }
  );
  if (!dbUID) return null;

  switch (reqInfo.type) {
    case "key": {
      return VerifyAuthUser(req, res);
    }
    case "user": {
      return VerifyAuthKey(req, res);
    }
  }

  res.status(STATUS_CODES.UNAUTHORIZED)
    .json({
      ok: false,
      error: {
        code: "wrong-auth-type",
        message: "The type of auth sended is not supported"
      }
    })

  return null;
}

/**@type {AdminHandler} */
async function CreateTable(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  let tableName = IsValidString(res, req.tableName, {
    EmptyString: {
      message: "Table name is an empty string",
      code: "missing-table-info"
    },
    NotSended: {
      message: "Table name was not sended",
      code: "missing-table-info"
    },
    WrongType: {
      message: "Table name is not a string",
      code: "missing-table-info"
    }
  });
  if (!tableName) return;

  if (!"columns" in reqInfo) {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        ok: false,
        error: {
          message: "Columns were not sended",
          code: "no-columns"
        }
      });
    return;
  } else if (!Array.isArray(reqInfo.columns)) {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        ok: false,
        error: {
          message: "Columns need to be sent in an array",
          code: "no-columns"
        }
      });
    return;
  }

  const ColumnMissingInfoError = {
    message: "Not all columns had all the information needed",
    code: "missing-column-information"
  }

  function ColumnMissingInfoResponse() {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        ok: false,
        error: ColumnMissingInfoError
      });
  }

  /**@type {Columns[]} */
  let columns = reqInfo.columns;
  let dbColumns = {};

  for (let i = 0; i < columns.length; ++i) {
    let column = columns[i];

    if (typeof (column) !== "object") {
      ColumnMissingInfoResponse();
      return;
    } else if (!("name" in column)) {
      ColumnMissingInfoResponse();
      return;
    } else if (!("type" in column)) {
      ColumnMissingInfoResponse();
      return;
    } else if (!("notNull" in column)) {
      ColumnMissingInfoResponse();
      return;
    } else if (!("unique" in column)) {
      ColumnMissingInfoResponse();
      return;
    }

    let columnName = IsValidString(res, column.name, {
      EmptyString: ColumnMissingInfoError,
      NotSended: ColumnMissingInfoError,
      WrongType: ColumnMissingInfoError
    });
    if (!columnName) return;

    column.type = IsValidString(res, column.type, {
      EmptyString: ColumnMissingInfoError,
      NotSended: ColumnMissingInfoError,
      WrongType: ColumnMissingInfoError
    });
    if (!column.type) return;

    if (columnName in dbColumns) {
      res.status(STATUS_CODES.BAD_REQUEST)
        .json({
          ok: false,
          error: {
            code: "twin-columns",
            message: "Two or more columns have the same name"
          }
        });
      return;
    }

    delete column.name;
    dbColumns[columnName] = column;
  }


}

/** @type {AdminHandler} */
async function CreateDB(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  if (reqInfo.type === "key") {
    res.status(STATUS_CODES.UNAUTHORIZED)
      .json({
        ok: false,
        error: {
          message: "The API key just work on the database that was created.",
          code: "apikey-out-of-bounds"
        }
      });
    return;
  }

  let dbName = IsValidString(
    res,
    reqInfo.dbName,
    {
      NotSended: {
        message: "Database name was not granted.",
        code: "missing-dbName"
      },
      WrongType: {
        message: "Database name is not a string.",
        code: "wrong-dbName"
      },
      EmptyString: {
        message: "Database name is an empty string.",
        code: "wrong-dbName"
      }
    }
  );
  if (!dbName) return;

  let user = await GetUserHandler(reqInfo.auth, res);
  if (user === null) return;

  let userSpaceRef = database.ref(user.uid);
  let countDatabases = (await database.ref(user.uid).get()).numChildren();

  if (countDatabases < 5) {
    /**@type {[admin.database.Reference, GenericError]} */
    let [dbResponse, pushError] = await AsyncAttempter(
      () => userSpaceRef.push({
        dbName: dbName,
        author: user.uid
      })
    );

    if (pushError) {
      console.log(pushError);
      res.status(STATUS_CODES.FAILED_DEPENDENCY)
        .json({
          ok: false,
          error: {
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
      error: {
        message: "Sorry, for now, each user is limited to 5 databases.",
        code: "db-limit"
      }
    });
}

/** @type {AdminHandler} */
async function GetDatabases(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  if (reqInfo.type === "key") {
    res.status(STATUS_CODES.UNAUTHORIZED)
      .json({
        ok: false,
        error: {
          message: "Each database has its own APIkey, one cannot work in others.",
          code: "apikey-out-of-bounds"
        }
      });
    return;
  }

  let user = await GetUserHandler(reqInfo.auth, res);
  if (user === null) return;

  let [databases, dbError] = await AsyncAttempter(
    () => database.ref(user.uid).get()
  );

  if (dbError) {
    console.log(dbError);
    res.status(STATUS_CODES.FAILED_DEPENDENCY)
      .json({
        ok: false,
        error: {
          message: "An error occurred, try again later",
          code: "unkwon-error"
        }
      });
    return;
  }

  /**@type {dbInfo[]} */
  let dbInfos = [];
  databases.forEach((db) => {
    dbInfos.push({
      dbName: db.child("dbName").val(),
      dbUID: db.key
    })
  });

  res.status(STATUS_CODES.OK)
    .json({
      ok: true,
      dbInfos: dbInfos
    })
}

/**
 * @param {number} minInclusive 
 * @param {number} maxInclusive 
 * @returns {number}
 */
function RandomInt(minInclusive, maxInclusive) {
  return Math.floor(
    Math.random() * (maxInclusive - minInclusive + 1)
  ) + minInclusive;
}

/**
 * @param {number} length 
 * @returns {string}
 */
function RandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length - 1;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(RandomInt(0, charactersLength));
    counter += 1;
  }
  return result;
}

/**@type {AdminHandler} */
async function CreateAPIKey(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  if (reqInfo.type === "key") {
    res.status(STATUS_CODES.UNAUTHORIZED)
      .json({
        ok: false,
        error: {
          message: "Holy recursion! APIkeys cannot create APIkeys.",
          code: "apikey-out-of-bounds"
        }
      });
    return;
  }

  let dbUID = IsValidString(
    res,
    reqInfo.dbUID,
    {
      EmptyString: {
        code: "wrong-dbUID",
        message: "The dbUID sended was an empty string."
      },
      NotSended: {
        code: "no-dbUID",
        message: "There was no dbUID in the request sended."
      },
      WrongType: {
        code: "wrong-dbUID",
        message: "The dbUID sended was not a string."
      }
    }
  );
  if (!dbUID) return;

  let user = await GetUserHandler(reqInfo.auth, res);
  if (!user) return;

  let dbRef = database.ref(`${user.uid}/${dbUID}`);
  let dbInfo = await database.ref(`${user.uid}/${dbUID}`).get();
  if (!dbInfo.exists()) {
    res.status(STATUS_CODES.PAGE_NOT_FOUND)
      .json({
        ok: false,
        error: {
          message: "The DataBase provided do not exists or was deleted.",
          code: "not-a-real-db"
        }
      });
    return;
  }

  let dbAPIkey = {
    user: user.uid,
    dbUID: dbUID,
    random: RandomString(256)
  }

  let keyObject = CryptoJS.AES.encrypt(JSON.stringify(dbAPIkey), process.env.VITE_CRYPTO_KEY);
  let key = keyObject.toString();

  let [, updateError] = await AsyncAttempter(
    () => dbRef.update({ "api-key": key })
  );

  if (updateError) {
    res.status(STATUS_CODES.FAILED_DEPENDENCY)
      .json({
        ok: false,
        error: {
          message: "An error occurred, try again later",
          code: "unkwon-error"
        }
      });
    console.log(updateError);
    return;
  }

  res.status(STATUS_CODES.CREATED)
    .json({
      ok: true,
      APIKey: key
    });
}

/** @type {AdminHandler} */
module.exports = function RoutesHandler(req, res) {
  if (!req.is("json")) {
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
  if (typeof (req.body) !== "object") {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        "ok": false,
        "error": {
          "message": "The body is not an object.",
          "code": "body-type"
        }
      });
  } else if (!("auth" in req.body) || !("type" in req.body)) {
    res.status(STATUS_CODES.BAD_REQUEST)
      .json({
        "ok": false,
        "error": {
          "message": "Incomplete or no auth information was sended.",
          "code": "missing-auth"
        }
      });
    return;
  }

  let missingAuth = {
    code: "missing-auth",
    message: "Incomplete or no auth information was sended."
  }

  req.body.auth = IsValidString(res, req.body.auth, {
    EmptyString: missingAuth,
    NotSended: missingAuth,
    WrongType: {
      code: "wrong-auth-info",
      message: "The auth information sended is not the rigth type"
    }
  });
  if (!req.body.auth) return;
  req.body.type = IsValidString(res, req.body.type, {
    EmptyString: missingAuth,
    NotSended: missingAuth,
    WrongType: {
      code: "wrong-auth-info",
      message: "The auth information sended is not the rigth type"
    }
  });
  if (!req.body.type) return;

  switch (req.originalUrl) {
    case "/api/create-db": {
      CreateDB(req, res);
      return;
    }
    case "/api/create-api": {
      CreateAPIKey(req, res);
      return;
    }
    case "/api/get-databases": {
      GetDatabases(req, res);
      return;
    }
  }

  res.status(STATUS_CODES.PAGE_NOT_FOUND)
    .json({
      ok: false,
      error: {
        message: "Page not found",
        code: "wrong-url"
      }
    })
}