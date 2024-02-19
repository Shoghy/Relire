import NavBar from "@/components/NavBar";
import styles from "./main.module.css";
import { ChangeBodyColor, RemoveIndexOfArray } from "@/utilities/functions";
import DBButton from "./db_button";
import { useEffect, useState } from "react";
import { CreateDatabase, DeleteDatabase, GetDatabases, auth } from "@/utilities/DBclient";
import { DB, LogIn } from "@/utilities/PageLocations";
import { useNavigate } from "react-router-dom";
import { BasicDBInfo, IApiResponse } from "@/utilities/types";

export default function Main() {
  const navigate = useNavigate();
  ChangeBodyColor("var(--dark-green)");
  const [userDBs, setUserDBs] = useState<BasicDBInfo[] | string>();

  useEffect(() => {
    LoadDatabases();
  }, []);

  async function LoadDatabases(){
    await auth.authStateReady();
    if(auth.currentUser === null){
      navigate(LogIn);
      return;
    }

    const dbList = await GetDatabases();

    if(!dbList.ok){
      setUserDBs("An error occured.");
    }

    dbList.dbInfos ??= [];
    setUserDBs(dbList.dbInfos);
  }

  function EnumarateDatabases(){
    if(userDBs === undefined){
      return (
        <Message>
          Loading databases...
        </Message>
      );
    }

    if(typeof userDBs === "string"){
      return (
        <Message>
          {userDBs}
        </Message>
      );
    }

    const buttons: React.JSX.Element[] = [];
    for(let i = 0; i < userDBs.length; ++i){
      buttons.push(
        <DBButton
          key={i}
          containerClassName={styles["db-btn"]}
          onClick={() => navigate(DB(userDBs[i].dbUID as string))}
          onXBtnClick={(e) => {
            e.stopPropagation();
            RemoveDatabase(userDBs[i].dbUID, userDBs[i].dbName);
          }}
        >
          <h3>{userDBs[i].dbName}</h3>
          <span>{userDBs[i].dbUID}</span>
        </DBButton>
      );
    }
    return buttons;
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

    setUserDBs((current) => {
      if(current === undefined || typeof current === "string"){
        current = [];
      }
      current.push({ dbName, dbUID: newDB.dbUID as string });
      return [...current];
    });
  }

  async function RemoveDatabase(dbUID: string, dbName: string){
    const confirmDBName = prompt(`Insert the name of the database: ${dbName}`);
    if (confirmDBName !== dbName) {
      alert("The names don't match");
      return;
    }
    const response = await DeleteDatabase(dbUID, dbName);

    if(!response.ok){
      alert(response.error?.message);
      return;
    }

    setUserDBs((current) => {
      if(!Array.isArray(current)){
        return;
      }

      for(let i = 0; i < current.length; ++i){
        const dbInfo = current[i];
        if(dbInfo.dbUID !== dbUID) continue;
        current = RemoveIndexOfArray(current, i);
        break;
      }

      return [... current];
    });
  }

  return (
    <>
      <NavBar />
      <div className={styles.background}>
        <div className={styles.container}>
          <DBButton
            showXButton={false}
            onClick={() => CreateDB()}
            containerClassName={styles["add-db-btn"]}
          >
            <i className="fa fa-plus" aria-hidden="true"></i>
          </DBButton>
          <EnumarateDatabases/>
        </div>
      </div>
    </>
  );
}

function Message({children}:{children: string}){
  return (
    <h1 style={{
      color: "var(--nyanza)",
      width: "100%",
      textAlign: "center"
    }}>
      {children}
    </h1>
  );
}