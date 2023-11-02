import { Link, useNavigate } from "react-router-dom";
import { CreateDatabase, GetDatabases, auth } from "../../utilities/DBclient";
import NavBar from "../../components/NavBar";
import { DB, LogIn } from "../../utilities/PageLocations";
import React, { useEffect, useState } from "react";
import { AsyncAttempter } from "../../utilities/functions";
import "./styles.css"
import { DatabaseListResponse, IApiResponse } from "../../utilities/types";

interface BasicDBInfo{
  name: string,
  uid: string
}

export default function Main(){
  const navigate = useNavigate();
  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [userDBsElement, setUserDBsElement] = useState<React.JSX.Element | null>(<h1>Loading databases...</h1>)
  const [userDBs, setUserDBs] = useState<BasicDBInfo[]>([]);
  const createDBButton = (
    <button
    className="db-button"
    onClick={() => CreateDB()}
    key={"Crear DB"}
    >
      <i className="fa fa-plus" aria-hidden="true"></i>
    </button>
  )

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if(user === undefined || user === null){
        navigate(LogIn);
      }
      GetUserDataBases();
    });
  }, [])

  async function GetUserDataBases(){
    let [dbsList, dbsError] = await AsyncAttempter(
      () => GetDatabases()
    );

    if(dbsError || !dbsList || !dbsList.ok){
      console.log(dbsError);
      setErrorElement(
        <h1>
          We were not able to communicate with the database. Try again later
        </h1>
      );
      return;
    }

    if((dbsList as DatabaseListResponse).dbInfos.length === 0){
      setUserDBsElement(
        <center>
          <h1>You still don't have any database, create one</h1>
        </center>
      )
      return;
    }

    setUserDBsElement(null);

    setUserDBs((current) => {
      (dbsList as DatabaseListResponse).dbInfos
      .forEach((value) => {
        current.push({
          uid: value.dbUID,
          name: value.dbName
        })
      });
      return [... current];
    })
  }

  async function CreateDB(){
    let dbName = prompt("Insert the name of the database");
    if(!dbName) return;
    let cdbAsync = CreateDatabase(
      dbName
    )

    let newDB: IApiResponse;
    try{
      newDB = await cdbAsync;
    }catch(error){
      console.error(error);
      return;
    }

    if(!newDB.ok){
      switch(newDB.error?.code){
        case "db-limit":{
          alert(newDB.error.message);
          break;
        }
        default:{
          alert("We were not able to process yor request");
          break;
        }
      }
      return;
    }

    setUserDBsElement(null);
    setUserDBs((current) => {
      current.push({name: dbName as string, uid: newDB.dbUID});
      return [... current]
    })
  }

  if(errorElement){
    return errorElement;
  }

  return (
    <>
      <NavBar/>
      {userDBsElement}
      <div className="dbs-container">
        {(() => {
          if(userDBs.length === 0) return createDBButton;

          let dbList: React.JSX.Element[] = [];
          for(let i = 0; i < userDBs.length; ++i){
            let userDB = userDBs[i];
            dbList.push(
              <Link to={DB(userDB.uid as string)} className="db-button" key={i}>
                <span>{userDB.name}</span>
                <span>{userDB.uid}</span>
              </Link>
            )
          }

          if(dbList.length < 5) dbList.push(createDBButton);

          return dbList;
        })()}
      </div>
    </>
  )
}