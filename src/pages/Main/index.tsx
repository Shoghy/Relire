import { Link, useNavigate } from "react-router-dom";
import { CreateDatabase, DeleteDatabase, GetDatabases, auth } from "../../utilities/DBclient";
import NavBar from "../../components/NavBar";
import { DB, LogIn } from "../../utilities/PageLocations";
import React, { useEffect, useState } from "react";
import { AsyncAttempter, RemoveIndexOfArray } from "../../utilities/functions";
import "./styles.css";
import { DatabaseListResponse, IApiResponse } from "../../utilities/types";

interface BasicDBInfo {
  name: string,
  uid: string
}

export default function Main() {
  const navigate = useNavigate();
  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [userDBsElement, setUserDBsElement] = useState<React.JSX.Element | null>(<h1>Loading databases...</h1>);
  const [userDBs, setUserDBs] = useState<BasicDBInfo[]>([]);
  const createDBButton = (
    <button
      className="db-button"
      onClick={() => CreateDB()}
      key={"Crear DB"}
    >
      <i className="fa fa-plus" aria-hidden="true"></i>
    </button>
  );

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user === undefined || user === null) {
        navigate(LogIn);
      }
      GetUserDataBases();
    });
  }, []);

  async function GetUserDataBases() {
    const [dbsList, dbsError] = await AsyncAttempter(
      () => GetDatabases()
    );

    if (dbsError || !dbsList || !dbsList.ok) {
      console.log(dbsError);
      setErrorElement(
        <h1>
          We were not able to communicate with the database. Try again later
        </h1>
      );
      return;
    }

    if ((dbsList as DatabaseListResponse).dbInfos.length === 0) {
      setUserDBsElement(
        <center>
          <h1>You still don't have any database, create one</h1>
        </center>
      );
      return;
    }

    setUserDBsElement(null);

    setUserDBs((current) => {
      (dbsList as DatabaseListResponse).dbInfos
        .forEach((value) => {
          current.push({
            uid: value.dbUID,
            name: value.dbName
          });
        });
      return [...current];
    });
  }

  async function CreateDB() {
    const dbName = prompt("Insert the name of the database");
    if (!dbName) return;
    const cdbAsync = CreateDatabase(
      dbName
    );

    let newDB: IApiResponse;
    try {
      newDB = await cdbAsync;
    } catch (error) {
      console.error(error);
      return;
    }

    if (!newDB.ok) {
      switch (newDB.error?.code) {
        case "db-limit": {
          alert(newDB.error.message);
          break;
        }
        default: {
          alert("We were not able to process yor request");
          break;
        }
      }
      return;
    }

    setUserDBsElement(null);
    setUserDBs((current) => {
      current.push({ name: dbName as string, uid: newDB.dbUID });
      return [...current];
    });
  }

  async function RemoveDatabase(dbUID: string){
    const dbName = prompt("Insert the name of the database");
    if (!dbName) return;
    const response = await DeleteDatabase(dbUID, dbName);

    if(!response.ok){
      alert(response.error?.message);
      return;
    }

    setUserDBs((current) => {
      for(let i = 0; i < current.length; ++i){
        const dbInfo = current[i];
        if(dbInfo.uid !== dbUID) continue;
        current = RemoveIndexOfArray(current, i);
        break;
      }

      return [... current];
    });
  }

  if (errorElement) {
    return errorElement;
  }

  return (
    <>
      <NavBar />
      {userDBsElement}
      <div className="dbs-container">
        {(() => {
          if (userDBs.length === 0) return createDBButton;

          const dbList: React.JSX.Element[] = [];
          for (let i = 0; i < userDBs.length; ++i) {
            const userDB = userDBs[i];
            dbList.push(
              <Link to={DB(userDB.uid as string)} className="db-button" key={i}>
                <span>{userDB.name}</span>
                <button
                  className="remove-columna"
                  onClick={(e) => {
                    e.preventDefault();
                    RemoveDatabase(userDB.uid);
                  }}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>
                </button>
                <span>{userDB.uid}</span>
              </Link>
            );
          }

          if (dbList.length < 5) dbList.push(createDBButton);

          return dbList;
        })()}
      </div>
    </>
  );
}