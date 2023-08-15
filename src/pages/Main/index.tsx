import { Link, useNavigate } from "react-router-dom";
import { CreateDatabase, GetDatabases, auth } from "../../utilities/DBclient";
import NavBar from "../../components/NavBar";
import { DB, LogIn } from "../../utilities/PageLocations";
import React, { useEffect, useState } from "react";
import { AsyncAttempter } from "../../utilities/functions";

interface BasicDBInfo{
  name: string,
  uid: string
}

export default function Main(){
  const navigate = useNavigate();
  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [userDBsElement, setUserDBsElement] = useState<React.JSX.Element | null>(<h1>Loading databases...</h1>)
  const [userDBs, setUserDBs] = useState<BasicDBInfo[]>([])

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if(user === undefined || user === null){
        navigate(LogIn);
      }
      GetUserDataBases();
    });
  }, [])

  async function GetUserDataBases(){
    let [dbs, dbsError] = await AsyncAttempter(
      () => GetDatabases(
        auth.currentUser?.uid as string
      )
    );

    if(dbsError){
      setErrorElement(
        <h1>
          We were not able to communicate with the database. Try again later
        </h1>
      );
      return;
    }

    if(!dbs?.size){
      setUserDBsElement(
        <center>
          <h1>You still don't have any database, create one</h1>
        </center>
      )
      return;
    }

    setUserDBsElement(null);

    setUserDBs((current) => {
      dbs?.forEach((value) => {
        current.push({
          uid: value.key as string,
          name: value.child("dbName").val() as string
        })
      });
      return [... current];
    })
  }

  async function CreateDB(){
    let dbName = prompt("Insert the name of the database");
    if(!dbName) return;
    let cdbAsync = CreateDatabase(
      auth.currentUser?.uid as string,
      dbName
    )

    let error = await cdbAsync.catch((error) => error);
    if(error){
      console.log(error)
      return;
    }
  }

  if(errorElement){
    return errorElement;
  }

  return (
    <>
      <NavBar/>
      {userDBsElement}
      <div>
        {(() => {
          if(userDBs.length === 0) return;

          let dbList: React.JSX.Element[] = [];
          for(let i = 0; i < userDBs.length; ++i){
            let userDB = userDBs[i];
            dbList.push(
              <Link to={DB(userDB.uid as string)} className="btn" key={i}>
                {userDB.name}
              </Link>
            )
          }
          return dbList;
        })()}
      </div>
      <button className="btn" onClick={() => CreateDB()}><i className="fa fa-plus-circle" aria-hidden="true"></i></button>
    </>
  )
}