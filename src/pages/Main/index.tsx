import NavBar from "@/components/NavBar";
import styles from "./main.module.css";
import { ChangeBodyColor, RemoveIndexOfArray } from "@/utilities/functions";
import DBButton from "./db_button";
import { useEffect, useRef, useState } from "react";
import { CreateDatabase, DeleteDatabase, GetDatabases, auth } from "@/utilities/DBclient";
import { DB, LogIn } from "@/utilities/PageLocations";
import { useNavigate } from "react-router-dom";
import { BasicDBInfo } from "@/utilities/types";
import { selfCustomAlert, selfDAlert } from "@/components/custom_alert";
import { selfLoadingCurtain } from "@/components/loading_curtain";
import TextInput from "@/components/TextInput";

interface CustomAlertInfo {
  title: string
  message: string
  inputValue: string
  submitFunction: () => any
  dbUID: string
  dbName: string
}

const customAlert = selfCustomAlert();
const DAlert = selfDAlert();
const loadingScreen = selfLoadingCurtain(true);
export default function Main() {
  const navigate = useNavigate();
  ChangeBodyColor("var(--dark-green)");
  const [userDBs, setUserDBs] = useState<BasicDBInfo[]>([]);
  const [alertInfo, setAlertInfo] = useState<CustomAlertInfo>({
    inputValue: "",
    message: "",
    submitFunction: () => { return; },
    title: "",
    dbName: "",
    dbUID: ""
  });
  const alertInfoRef = useRef(alertInfo);
  alertInfoRef.current = alertInfo;

  useEffect(() => {
    loadingScreen.open();
    DAlert.close();
    customAlert.close();
    LoadDatabases();
  }, []);

  async function LoadDatabases() {
    await auth.authStateReady();

    if (auth.currentUser === null) {
      navigate(LogIn);
      return;
    }

    const dbList = await GetDatabases();
    loadingScreen.close();

    if (!dbList.ok) {
      DAlert.openWith({
        title: "Error",
        message: dbList.error?.message
      });
      return;
    }

    setUserDBs(dbList.dbInfos ?? []);
  }

  function EnumarateDatabases() {
    const buttons: React.JSX.Element[] = [];
    for (let i = 0; i < userDBs.length; ++i) {
      buttons.push(
        <DBButton
          key={i}
          containerClassName={styles["db-btn"]}
          onClick={() => navigate(DB(userDBs[i].dbUID as string))}
          onXBtnClick={(e) => {
            e.stopPropagation();
            OnDBXClick(userDBs[i].dbUID, userDBs[i].dbName);
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
    const dbName = alertInfoRef.current.inputValue;
    loadingScreen.open();
    customAlert.close();

    if (!dbName) {
      DAlert.openWith({
        title: "You need to add a name to your database"
      });
      loadingScreen.close();
      return;
    }

    const newDB = await CreateDatabase(
      dbName
    );
    loadingScreen.close();

    if (!newDB.ok) {
      DAlert.openWith({
        title: "Error",
        message: newDB.error?.message
      });
      return;
    }

    setUserDBs((current) => {
      current.push({ dbName, dbUID: newDB.dbUID as string });
      return [...current];
    });
  }

  async function DeleteDB() {
    customAlert.close();
    loadingScreen.open();

    const dbUID = alertInfoRef.current.dbUID;
    const dbName = alertInfoRef.current.dbName;
    const confirmDBName = alertInfoRef.current.inputValue;

    if (confirmDBName !== dbName) {
      DAlert.openWith({
        title: "Error",
        message: "The names don't match"
      });
      loadingScreen.close();
      return;
    }
    const response = await DeleteDatabase(dbUID, dbName);
    loadingScreen.close();

    if (!response.ok) {
      DAlert.openWith({
        title: "Error",
        message: response.error?.message
      });
      return;
    }

    setUserDBs((current) => {
      for (let i = 0; i < current.length; ++i) {
        const dbInfo = current[i];
        if (dbInfo.dbUID !== dbUID) continue;
        current = RemoveIndexOfArray(current, i);
        break;
      }

      return [...current];
    });
  }

  function OnDBXClick(dbUID: string, dbName: string) {
    customAlert.open();
    setAlertInfo({
      title: "Delete",
      message: `Insert the name of the database: ${dbName}`,
      inputValue: "",
      dbName: dbName,
      dbUID: dbUID,
      submitFunction: DeleteDB
    });
  }

  function OnAddBtnClick() {
    customAlert.open();
    setAlertInfo({
      title: "Create Database",
      message: "Insert the name of the new database",
      inputValue: "",
      dbName: "",
      dbUID: "",
      submitFunction: CreateDB
    });
  }

  return (
    <>
      <NavBar />
      <div className={styles.background}>
        <div className={styles.container}>
          <DBButton
            showXButton={false}
            onClick={() => OnAddBtnClick()}
            containerClassName={styles["add-db-btn"]}
          >
            <i className="fa fa-plus" aria-hidden="true"></i>
          </DBButton>
          <EnumarateDatabases />
        </div>
      </div>
      <loadingScreen.Element />
      <DAlert.Element onClose={() => {DAlert.setMessage("");}}/>
      <customAlert.Element className={styles.alerts}>
        <h1>{alertInfo.title}</h1>
        <span>{alertInfo.message}</span>
        <TextInput
          type="text"
          value={alertInfo.inputValue}
          onChange={(e) => {
            const value = e.currentTarget.value;
            setAlertInfo((c) => {
              c.inputValue = value;
              return { ...c };
            });
          }}
        />
        <button
          className={styles["submit-btn"]}
          onClick={() => alertInfo.submitFunction()}
        >Confirm</button>
      </customAlert.Element>
    </>
  );
}
