import { useNavigate, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { DeleteTable, GetTables, auth } from "@/utilities/DBclient";
import { DataInTable, DBTableCreate } from "@/utilities/PageLocations";
import { useState, useEffect } from "react";
import { ChangeBodyColor, RemoveIndexOfArray } from "@/utilities/functions";
import styles from "./describedb.module.css";
import TableButton from "./table_button";
import { selfCustomAlert, selfDAlert } from "@/components/custom_alert";
import { IApiRequest, IApiResponse } from "@/utilities/types";
import { selfLoadingCurtain } from "@/components/loading_curtain";
import TextInput from "@/components/TextInput";

const DAlert = selfDAlert();
const loadingScreen = selfLoadingCurtain(true);
const customAlert = selfCustomAlert();
export default function DescribeDB() {
  ChangeBodyColor("var(--fern-green)");
  const navigate = useNavigate();
  const params = useParams();
  const dbUID = params.idDB as string;
  const [tables, setTables] = useState<string[]>([]);
  const [tableNameToDelete, setTableNameToDelete] = useState("");
  const [alertInput, setAlertInput] = useState("");

  useEffect(() => {
    loadingScreen.open();
    DAlert.close();
    customAlert.close();
    LoadTables();
  }, []);

  function OnTableXClick(tableName: string){
    setTableNameToDelete(tableName);
    setAlertInput("");
    customAlert.open();
  }

  async function RemoveTable(){
    loadingScreen.open();
    customAlert.close();
    if(tableNameToDelete !== alertInput){
      DAlert.openWith({
        title: "Error",
        message: "Names don't match."
      });
      loadingScreen.close();
      return;
    }
  
    const response = await DeleteTable(dbUID, tableNameToDelete);

    if(!response.ok){
      DAlert.openWith({
        title: "Error",
        message: response.error?.message
      });
      loadingScreen.close();
      return;
    }

    setTables((current) => {
      return RemoveIndexOfArray(current!, current!.indexOf(tableNameToDelete));
    });

    loadingScreen.close();
  }

  async function LoadTables(){
    await auth.authStateReady();
    if(auth.currentUser === null){
      return;
    }
    
    const tableList = await GetTables(auth.currentUser!.uid, dbUID);
    if("error" in tableList){
      DAlert.openWith({
        title: "Error",
        message: "An error ocurred, try again later"
      });
      return;
    }
    const tablesNames: string[] = [];
    tableList.forEach((table) => {
      tablesNames.push(table.key);
    });
    setTables(tablesNames);
    loadingScreen.close();
  }

  function EnumarateTables(){
    const elements: React.JSX.Element[] = [];
    for(let i = 0; i < tables.length; ++i){
      elements.push(
        <TableButton
          key={i}
          tableName={tables[i]}
          onClick={() => navigate(DataInTable(dbUID, tables[i]))}
          onXClick={() => OnTableXClick(tables[i])}
        />
      );
    }
    return elements;
  }

  async function CreateAPIKey() {
    loadingScreen.open();
    const userIDToken = await auth.currentUser?.getIdToken();
    const requestBody: IApiRequest = {
      auth: userIDToken as string,
      type: "user",
      dbUID: dbUID
    };

    const response = await fetch(
      "/api/create-api", {
        body: JSON.stringify(requestBody),
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Accept": "application/json"
        }
      });

    let apiResponse: IApiResponse<{APIKey: string}>;

    try {
      apiResponse = await response.json();
    } catch (e) {
      DAlert.openWith({
        title: "Error",
        message: "An error ocurred,\ntry again later"
      });
      loadingScreen.close();
      return;
    }

    loadingScreen.close();

    if (!apiResponse.ok) {
      DAlert.openWith({
        title: "Error",
        message: apiResponse.error?.message
      });
      return;
    }

    DAlert.openWith({
      title: "Warning once you close this, the API key will not be shown again, and if you re-create it, this one will be deleted.",
      message: apiResponse.APIKey
    });
  }

  return (
    <>
      <NavBar />
      <div className={styles.background}>
        <div className={styles.container}>
          <button
            className={styles["add-table-btn"]}
            onClick={() => navigate(DBTableCreate(dbUID))}
          >
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
          <EnumarateTables/>
        </div>
      </div>
      <button
        onClick={() => CreateAPIKey()}
        className={styles["create-api-key-btn"]}
      >
        Create API Key
      </button>
      <loadingScreen.Element/>
      <DAlert.Element/>
      <customAlert.Element className={styles["custom-column"]}>
        <h1>Delete table</h1>
        <span>Insert the name of the table: {tableNameToDelete}</span>
        <TextInput
          type="text"
          value={alertInput}
          onChange={(e) => setAlertInput(e.currentTarget.value)}
        />
        <button
          className={styles["submit-btn"]}
          onClick={()=>RemoveTable()}
        >Confirm</button>
      </customAlert.Element>
    </>
  );
}
