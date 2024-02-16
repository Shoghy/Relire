/* eslint-disable @typescript-eslint/no-var-requires */
const admin = require("firebase-admin");
const serviceAccount = require("./RelireFirebaseAdmin.json");
const CryptoJS = require("crypto-js");

require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
});

const auth = admin.auth();
const database = admin.database();

/**@enum {number}*/
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
};

/**@type {<T>(func: () => Promise<T>) => Promise<[T, null] | [null, GenericError]>} */
async function AsyncAttempter(func) {
  try {
    let result = await func();
    return [result, null];
  } catch (e) {
    return [null, e];
  }
}

/**
 * @param {CResponse} res 
 * @param {STATUS_CODES} status 
 * @param {Answer} jsonValue 
 */
function SendAnswer(res, status, jsonValue) {
  res.status(status).json(jsonValue);
}

/**
 * @param {CResponse} res
 * @param {any} value 
 * @param {string} field
 * @returns {false | string}
 */
function IsValidString(res, value, field) {
  const code = `invalid-${field}`;
  if (value === undefined) {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        code: code,
        message: `${field} was not sended`
      }
    });
    return false;
  } else if (typeof (value) !== "string") {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        code: code,
        message: `${field} was sended, but is not a string`
      }
    });
    return false;
  } else if (!value.trim()) {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        code: code,
        message: `${field} is an empty string`
      }
    });
    return false;
  }

  return value.trim();
}

/**
 * @param {string} authId
 * @param {CResponse} res
 * @returns {Promise<admin.auth.DecodedIdToken | null>}
 */
async function GetUserHandler(authId, res) {
  let [user, userError] = await AsyncAttempter(
    () => auth.verifyIdToken(authId, true)
  );

  if (userError) {
    switch (userError.code) {
      case "auth/id-token-revoked": {
        SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
          ok: false,
          error: {
            message: "The Id Token sended was revoked",
            code: "id-token-revoked"
          }
        });
        break;
      }
      default: {
        SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
          ok: false,
          error: {
            message: "An error occurred, try again later",
            code: "unkwon-error"
          }
        });
        break;
      }
    }
    return null;
  }

  return user;
}

/**@type {VerifyAuth} */
async function VerifyAuthUser(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  let dbUID = IsValidString(res, reqInfo.dbUID, "dbUID");
  if (!dbUID) return null;

  let user = await GetUserHandler(reqInfo.auth, res);
  if (!user) return null;

  let db = await database.ref(user.uid).child(dbUID).get();
  if (!db.exists()) {
    SendAnswer(res, STATUS_CODES.PAGE_NOT_FOUND, {
      ok: false,
      error: {
        code: "db-does-not-exists",
        message: "You don't have any database with the dbUID sended"
      }
    });
    return null;
  }
  return {
    dbUID: dbUID,
    userUID: user.uid
  };
}

/**@type {VerifyAuth} */
async function VerifyAuthKey(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  let apiDecripted = CryptoJS.AES.decrypt(reqInfo.auth, process.env.VITE_CRYPTO_KEY);

  /**@type {ApiKey} */
  let apiKey;

  let invalidAPIkey = {
    code: "invalid-api-key",
    message: "The API key don't have all the information needed"
  };
  let apiString = apiDecripted.toString();
  try {
    apiKey = JSON.parse(apiString);
  } catch (e) {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: invalidAPIkey
    });
    return null;
  }

  apiKey.dbUID = IsValidString(res, apiKey.dbUID, "API Key");
  if (!apiKey.dbUID) return null;

  apiKey.user = IsValidString(res, apiKey.user, "API Key");
  if (!apiKey.user) return null;

  let dbApiKey = await database.ref(`${apiKey.user}/${apiKey.dbUID}/api-key`).get();
  if (!dbApiKey.exists()) {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: invalidAPIkey
    });
    return null;
  }

  if (apiString !== dbApiKey.val()) {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: invalidAPIkey
    });
    return null;
  }

  return {
    dbUID: apiKey.dbUID,
    userUID: apiKey.user
  };
}

/**@type {VerifyAuth} */
async function VerifyAuthInformation(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  switch (reqInfo.type) {
    case "key": {
      return VerifyAuthKey(req, res);
    }
    case "user": {
      return VerifyAuthUser(req, res);
    }
  }

  SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
    ok: false,
    error: {
      code: "wrong-auth-type",
      message: "The type of auth sended is not supported"
    }
  });

  return null;
}

/**@type {AdminHandler} */
async function CreateTable(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  const tableName = IsValidString(res, reqInfo.tableName, "tableName");
  if (!tableName) return;

  if (!Array.isArray(reqInfo.columns)) {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
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
  };

  function ColumnMissingInfoResponse() {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: ColumnMissingInfoError
    });
  }

  /**@type {Column[]} */
  let columns = reqInfo.columns;
  /**@type {Dictionary<Column>} */
  let dbColumns = {};
  /**@type {string[]} */
  let columnsWithForeingKey = [];

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

    let columnName = IsValidString(res, column.name, "columnName");
    if (!columnName) return;

    column.type = IsValidString(res, column.type, "colunmType");
    if (!column.type) return;

    if (columnName in dbColumns) {
      SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
        ok: false,
        error: {
          code: "twin-columns",
          message: "Two or more columns have the same name"
        }
      });
      return;
    }

    if (column.foreingKey) {
      columnsWithForeingKey.push(columnName);
    } else {
      delete column.foreingKey;
    }
    delete column.name;
    dbColumns[columnName] = column;
  }

  let authInformation = await VerifyAuthInformation(req, res);
  if (!authInformation) return;

  const userDBReference = database.ref(`${authInformation.userUID}/${authInformation.dbUID}/tables`);
  let tableNameExists = (await userDBReference.child(tableName).get()).exists();
  if (tableNameExists) {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        code: "table-already-exists",
        message: `The is a table with the name of "${tableName}" in your database`
      }
    });
    return;
  }

  let ForeingKeyError = {
    code: "bad-foreingkey-info",
    message: `This message can be sent if:
The foreignKey field sended is not an object.
There is no tableName or column in foreing's key object.
The table doesn't exist or doesn't have that column.`
  };

  function MissingForeingKeyInformation() {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: ForeingKeyError
    });
  }

  for (let i = 0; i < columnsWithForeingKey.length; ++i) {
    let columnName = columnsWithForeingKey[i];
    let columnInfo = dbColumns[columnName];
    let foreingKey = columnInfo.foreingKey;

    if (typeof foreingKey !== "object") {
      MissingForeingKeyInformation();
      return;
    }

    foreingKey.column = IsValidString(res, foreingKey.column, "ForeignKey Column");
    if (!foreingKey.column) return;

    foreingKey.tableName = IsValidString(res, foreingKey.tableName, "ForeignKey Table");
    if (!foreingKey.tableName) return;

    const columnRef = await userDBReference.child(`${foreingKey.tableName}/${foreingKey.column}`).get();
    if (!columnRef.exists()) {
      SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
        ok: false,
        error: {
          code: "column-does-not-exist",
          message: `The column "${foreingKey.column}" does not exists in the table "${foreingKey.tableName}"`
        }
      });
      return;
    }

    /**@type {boolean} */
    const isUnique = columnRef.child("unique").val();
    if (!isUnique) {
      SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
        ok: false,
        error: {
          code: "column-is-not-unique",
          message: `The column "${foreingKey.column}" in the table "${foreingKey.tableName}" is not unique`
        }
      });
      return;
    }

    /**@type {string} */
    const columnType = columnRef.child("type").val();
    if (columnType.toLowerCase() === columnInfo.type.toLowerCase()) continue;

    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        code: "columns-are-not-the-same-type",
        message: "The column does not have the same type as the referenced column"
      }
    });
    return;
  }

  let [, setTableError] = await AsyncAttempter(
    () => userDBReference.child(tableName).set(dbColumns)
  );

  if (setTableError) {
    SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
      ok: false,
      error: {
        code: "unknown",
        message: "Try again later"
      }
    });
    return;
  }
  res.status(STATUS_CODES.CREATED)
    .json({
      ok: true,
    });
}

/** @type {AdminHandler} */
async function CreateDB(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  if (reqInfo.type === "key") {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: {
        message: "The API key just work on the database that was created.",
        code: "apikey-out-of-bounds"
      }
    });
    return;
  }

  let dbName = IsValidString(res, reqInfo.dbName, "dbName");
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
      SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
        ok: false,
        error: {
          message: "An error occurred, try again later",
          code: "unkwon-error"
        }
      });
      return;
    }

    SendAnswer(res, STATUS_CODES.CREATED, {
      ok: true,
      dbUID: dbResponse.key
    });
    return;
  }

  SendAnswer(res, STATUS_CODES.TOO_MANY_REQUESTS, {
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
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
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
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: {
        message: "An error occurred, try again later",
        code: "unkwon-error"
      }
    });
    return;
  }

  /**@type {DBInfo[]} */
  let dbInfos = [];
  databases.forEach((db) => {
    dbInfos.push({
      dbName: db.child("dbName").val(),
      dbUID: db.key
    });
  });

  SendAnswer(res, STATUS_CODES.OK, {
    ok: true,
    dbInfos: dbInfos
  });
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
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: {
        message: "Holy recursion! APIkeys cannot create APIkeys.",
        code: "apikey-out-of-bounds"
      }
    });
    return;
  }

  let dbUID = IsValidString(res, reqInfo.dbUID, "dbName");
  if (!dbUID) return;

  let user = await GetUserHandler(reqInfo.auth, res);
  if (!user) return;

  let dbRef = database.ref(`${user.uid}/${dbUID}`);
  let dbInfo = await database.ref(`${user.uid}/${dbUID}`).get();
  if (!dbInfo.exists()) {
    SendAnswer(res, STATUS_CODES.PAGE_NOT_FOUND, {
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
  };

  let keyObject = CryptoJS.AES.encrypt(JSON.stringify(dbAPIkey), process.env.VITE_CRYPTO_KEY);
  let key = keyObject.toString();

  let [, updateError] = await AsyncAttempter(
    () => dbRef.update({ "api-key": key })
  );

  if (updateError) {
    SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
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
      APIKey: key
    });
}

/** @type {AdminHandler} */
async function DeleteRow(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  const tableName = IsValidString(res, reqInfo.tableName, "tableName");
  if (!tableName) return;
  const rowUID = IsValidString(res, reqInfo.rowUID, "rowUID");
  if (!rowUID) return;

  const authInfo = await VerifyAuthInformation(req, res);
  if (!authInfo) return;

  const tableInfo = await database.ref(`${authInfo.userUID}/${authInfo.dbUID}/tables/${tableName}`).get();

  if (!tableInfo.exists()) {
    SendAnswer(res, STATUS_CODES.PAGE_NOT_FOUND, {
      ok: false,
      error: {
        code: "table-not-found",
        message: `The tableName sended "${tableName}" is not a table of your database`
      }
    });
    return;
  }

  /**@type {Dictionary<Column>} */
  const tableData = tableInfo.val();
  /**@type {string[]} */
  let uniqueColumns = [];

  for (let columnName in tableData) {
    let column = tableData[columnName];
    if (column.unique) {
      uniqueColumns.push(columnName);
    }
  }

  async function deleteRow() {
    /**@type {Error} */
    let error = undefined;
    await database.ref(`${authInfo.userUID}/${authInfo.dbUID}/tablesData/${tableName}/${rowUID}`).remove((response) => {
      error = response;
    });

    if (!error) {
      SendAnswer(res, STATUS_CODES.OK, { ok: true });
    } else {
      SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
        ok: false,
        error: {
          code: "unknown-error",
          message: "Something went wrong"
        }
      });
    }
  }

  if (uniqueColumns.length == 0) {
    deleteRow();
    return;
  }

  /**@type {Dictionary<any>} */
  const rowValue = (await database.ref(`${authInfo.userUID}/${authInfo.dbUID}/tablesData/${tableName}/${rowUID}`).get()).val();

  const tables = await database.ref(`${authInfo.userUID}/${authInfo.dbUID}/tables`).get();
  /**@type {Dictionary<Dictionary<Column>>} */
  const tablesValue = tables.val();
  /**@type {string[]} */
  let tablesWithReference = [];

  for (let tableID in tablesValue) {
    if (tableID == tableName) continue;

    let tableColumns = tablesValue[tableID];
    /**@type {[string, Column][]} */
    let columnsWithReference = [];

    for (let columnName in tableColumns) {
      /**@type {Column} */
      let column = tableColumns[columnName];

      if (column.foreingKey === undefined) continue;
      if (column.foreingKey.tableName !== tableName) continue;

      columnsWithReference.push([columnName, column]);
    }

    if (columnsWithReference.length === 0) continue;

    /**@type {Dictionary<Dictionary<any>>} */
    let tableRows = (await database.ref(`${authInfo.userUID}/${authInfo.dbUID}/tablesData/${tableID}`).get()).val();
    for (let rowUID in tableRows) {
      let row = tableRows[rowUID];
      let preiousLength = tablesWithReference.length;

      for (let columnInfo of columnsWithReference) {
        let foreignKeyValue = row[columnInfo[0]];
        let originalColumnValue = rowValue[columnInfo[1].foreingKey.column];
        if (foreignKeyValue != originalColumnValue) continue;

        tablesWithReference.push(tableID);
        break;
      }

      if (preiousLength < tablesWithReference.length) break;
    }
  }

  if (tablesWithReference.length > 0) {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false, error: {
        code: "delete-prevention",
        message: `The row you're trying to delete is referenced in the tables: \`${tablesWithReference.join(", ")}\``
      }
    });
    return;
  }

  deleteRow();
}

/**@type {AdminHandler} */
async function DeleteTable(req, res) {
  /**@type {ReqInfo} */
  let reqInfo = req.body;

  const tableName = IsValidString(res, reqInfo.tableName, "tableName");
  if (!tableName) return;
  const authInfo = await VerifyAuthInformation(req, res);
  if (!authInfo) return;

  const userDBRef = database.ref(`${authInfo.userUID}/${authInfo.dbUID}`);
  const table = await userDBRef.child(`tables/${tableName}`).get();

  if (!table.exists()) {
    SendAnswer(res, STATUS_CODES.PAGE_NOT_FOUND, {
      ok: false,
      error: {
        code: "table-do-not-exists",
        message: `You don't have a table with the name \`${tableName}\``
      }
    });
    return;
  }

  /**@type {Dictionary<Column>} */
  const tableValue = table.val();
  let hasUniqueColumns = false;

  for (let columnName in tableValue) {
    const column = tableValue[columnName];
    if (column.unique) {
      hasUniqueColumns = true;
      break;
    }
  }

  async function deleteTable() {
    /**@type {Error | null} */
    let error = null;
    await userDBRef.child(`tables/${tableName}`).remove((e) => {
      error = e;
    });

    if(error){
      SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
        ok: false,
        error: {
          code: "unknown-error",
          message: "Something went wrong"
        }
      });
      return;
    }

    await userDBRef.child(`tablesData/${tableName}`).remove((e) => {
      error = e;
    });

    SendAnswer(res, STATUS_CODES.OK, { ok: true });
  }

  if (!hasUniqueColumns) {
    deleteTable();
    return;
  }

  /**@type {Dictionary<Dictionary<Column>>} */
  const allTables = (await userDBRef.child("tables").get()).val();
  /**@type {string[]} */
  let tableWithReference = [];

  for (let tableName2 in allTables) {
    if (tableName2 === tableName) continue;

    const table2 = allTables[tableName2];
    for (let columnName in table2) {
      const column = table2[columnName];

      if (!column.foreingKey) continue;
      if (column.foreingKey.tableName !== tableName) continue;

      tableWithReference.push(tableName2);
    }
  }

  if (tableWithReference.length === 0) {
    deleteTable();
    return;
  }

  SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
    ok: false,
    error: {
      code: "delete-prevention",
      message: `The table cannot be deleted, because is referenced in the tables: \`${tableWithReference.join(", ")}\`.`
    }
  });
}

/**@type {AdminHandler} */
async function DeleteDatabase(req, res) {
  /**@type {ReqInfo} */
  const reqInfo = req.body;

  const dbName = IsValidString(res, reqInfo.dbName, "dbName");
  if (!dbName) return;

  if (reqInfo.type === "key") {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: {
        message: "API keys cannot delete databases.",
        code: "apikey-out-of-bounds"
      }
    });
    return;
  }

  const authInfo = await VerifyAuthInformation(req, res);
  if (!authInfo) return;

  const databaseName = await database.ref(`${authInfo.userUID}/${authInfo.dbUID}/dbName`).get();
  if (!databaseName.exists()) {
    SendAnswer(res, STATUS_CODES.PAGE_NOT_FOUND, {
      ok: false,
      error: {
        message: "The database you're trying to remove does not exists.",
        code: "database-do-not-exists"
      }
    });
  }

  if (databaseName.val() !== dbName) {
    SendAnswer(res, STATUS_CODES.UNAUTHORIZED, {
      ok: false,
      error: {
        message: "You sent the wrong databse name.",
        code: "databases-names-do-not-match"
      }
    });
    return;
  }

  /**@type {Error | null} */
  let error = null;
  database.ref(`${authInfo.userUID}/${authInfo.dbUID}`).remove((response) => {
    error = response;
  });

  if (!error) {
    SendAnswer(res, STATUS_CODES.OK, { ok: true });
  } else {
    SendAnswer(res, STATUS_CODES.FAILED_DEPENDENCY, {
      ok: false,
      error: {
        code: "unknown-error",
        message: "Something went wrong"
      }
    });
  }
}

/** @type {AdminHandler} */
module.exports = function RoutesHandler(req, res) {
  if (!req.is("json")) {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        message: "JSON needed for authorization and context info.",
        code: "request-without-JSON"
      }
    });
    return;
  }

  if (typeof (req.body) !== "object") {
    SendAnswer(res, STATUS_CODES.BAD_REQUEST, {
      ok: false,
      error: {
        message: "The body is not an object.",
        code: "body-type"
      }
    });
    return;
  }

  req.body.auth = IsValidString(res, req.body.auth, "authInfo");
  if (!req.body.auth) return;

  req.body.type = IsValidString(res, req.body.type, "authInfo");
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
    case "/api/create-table": {
      CreateTable(req, res);
      return;
    }
    case "/api/delete-row": {
      DeleteRow(req, res);
      return;
    }
    case "/api/delete-table": {
      DeleteTable(req, res);
      return;
    }
    case "/api/delete-database": {
      DeleteDatabase(req, res);
      return;
    }
  }

  SendAnswer(res, STATUS_CODES.PAGE_NOT_FOUND, {
    ok: false,
    error: {
      message: "Page not found",
      code: "wrong-url"
    }
  });
};