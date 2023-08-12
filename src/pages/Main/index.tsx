import { Link, useNavigate } from "react-router-dom";
import { GetDatabases, auth } from "../../utilities/DBclient";
import NavBar from "../../components/NavBar";
import { DB, LogIn } from "../../utilities/PageLocations";
import React, { useEffect, useState } from "react";
import { AsyncAttempter } from "../../utilities/functions";

export default function Main(){
  const navigate = useNavigate();
  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [userDBs, setUserDBs] = useState(<h1>Loading databases...</h1>)

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

    let hasChild = false;
    let dbList : React.JSX.Element[] = [];
    dbs?.forEach((value) => {
      hasChild = true;
      dbList.push(
        <Link to={DB(value.key as string)} className="btn">
          {value.child("dbName").val()}
        </Link>
      )
    });

    if(!hasChild){
      setUserDBs(
      <center>
        <h1>You still don't have any database, create one</h1>
      </center>
      )
      return;
    }
    setUserDBs(<>{dbList}</>)
  }

  if(errorElement){
    return errorElement;
  }

  return (
    <>
      <NavBar/>
      {userDBs}
      <button className="btn"><i className="fa fa-plus-circle" aria-hidden="true"></i></button>
    </>
  )
}