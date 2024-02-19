import { useNavigate, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { DeleteTable, GetTables, auth } from "@/utilities/DBclient";
import { DataInTable, LogIn, DBTableCreate } from "@/utilities/PageLocations";
import { useState, useEffect } from "react";
import { ChangeBodyColor, RemoveIndexOfArray } from "@/utilities/functions";
import styles from "./describedb.module.css";
import TableButton from "./table_button";
import { selfCustomAlert } from "@/components/custom_alert";
import { IApiRequest, IApiResponse } from "@/utilities/types";

const selfAlert = selfCustomAlert();
export default function DescribeDB() {
  ChangeBodyColor("var(--fern-green)");
  const navigate = useNavigate();
  const params = useParams();
  const dbUID = params.idDB as string;
  const [APIKey, setAPIkey] = useState("");
  const [tables, setTables] = useState<string[]>();

  useEffect(() => {
    LoadTables();
  }, []);

  async function RemoveTable(tableName: string){
    const confirmTableName = prompt(`Insert the name of the table: ${tableName}`);
    if(tableName !== confirmTableName){
      alert("Names don't match");
      return;
    }
  
    const response = await DeleteTable(dbUID, tableName);

    if(!response.ok){
      alert(response.error?.message);
      return;
    }

    setTables((current) => {
      return RemoveIndexOfArray(current!, current!.indexOf(tableName));
    });
  }

  async function LoadTables(){
    await auth.authStateReady();
    if(auth.currentUser === null){
      navigate(LogIn);
      return;
    }
    
    const tableList = await GetTables(auth.currentUser!.uid, dbUID);
    if("error" in tableList){
      alert("An error ocurred, try again later");
      return;
    }
    const tablesNames: string[] = [];
    tableList.forEach((table) => {
      tablesNames.push(table.key);
    });
    setTables(tablesNames);
  }

  function EnumarateTables(){
    if(tables === undefined){
      return (<Message>Loading...</Message>);
    }

    const elements: React.JSX.Element[] = [];
    for(let i = 0; i < tables.length; ++i){
      elements.push(
        <TableButton
          key={i}
          tableName={tables[i]}
          onClick={() => navigate(DataInTable(dbUID, tables[i]))}
          onXClick={() => RemoveTable(tables[i])}
        />
      );
    }
    return elements;
  }

  async function CreateAPIKey() {
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
      alert("An error ocurred");
      return;
    }

    if (!apiResponse.ok) {
      alert("An error ocurred");
      return;
    }

    setAPIkey(apiResponse.APIKey);
    selfAlert.open();
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
      <selfAlert.Element onXClick={() => {
        setAPIkey("");
      }}>
        <h4 style={{ color: "black" }}>
            Warning once you close this, the API key will not be shown again, and if you re-create it, this one will be deleted.
        </h4>
        <p style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          color: "black",
          wordWrap: "break-word",
          padding: "8px",
          borderRadius: "10px"
        }}>
          {APIKey}
        </p>
      </selfAlert.Element>
    </>
  );
}

function Message({children}:{children?: string}){
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