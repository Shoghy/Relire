import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/NavBar";
import { GetTables, auth } from "../../utilities/DBclient";
import { DBTableCreate, DataInTable, LogIn } from "../../utilities/PageLocations";
import { useState, useEffect } from "react";
import { Dictionary, IApiRequest, IApiResponse, IColumn } from "../../utilities/types";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { AsyncAttempter, RandomString } from "../../utilities/functions";
import CustomAlert from "../../components/custom-alert";

export default function DescribeDB() {
  const navigate = useNavigate();
  const params = useParams();
  const dbUID = params.idDB as string;

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [dbDataElement, setDBDataElement] = useState<React.ReactNode>(<h1>Cargando base de datos</h1>);
  const [APIKey, setAPIkey] = useState("");

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user === undefined || user === null) {
        navigate(LogIn);
        return;
      }
      Start()
    });
  }, []);

  async function Start() {
    let [getDBResult, getDBError] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        dbUID
      )
    );

    if (getDBError) {
      DBGetDefaultCath(
        getDBError,
        errorElement,
        setErrorElement,
        navigate
      );
      return;
    }

    let dbTables: Dictionary<Dictionary<IColumn>> = getDBResult?.val();
    if (dbTables === undefined) {
      setDBDataElement(<h1>Aún no hay tablas, crea una</h1>)
      return;
    }

    let tables: React.JSX.Element[] = [];
    let key = RandomString(6);

    for(let dbTableName in dbTables){
      tables.push(
        <tr key={`${dbTableName}-${key}`}>
          <td><Link to={DataInTable(dbUID, dbTableName)}>{dbTableName}</Link></td>
        </tr>
      );
    }

    setDBDataElement((
      <table>
        <thead>
          <tr>
            <th>Table Name</th>
          </tr>
        </thead>
        <tbody>
          {tables}
        </tbody>
      </table>
    ));
  }

  async function CreateAPIKey(){
    const userIDToken = await auth.currentUser?.getIdToken();
    let requestBody: IApiRequest = {
      auth: userIDToken as string,
      type: "user",
      dbUID: dbUID
    }

    const serverURL = import.meta.env.VITE_SERVER_URL;
    let response = await fetch(
      `${serverURL}/api/create-api`, {
      body: JSON.stringify(requestBody),
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        'Accept': 'application/json'
      }
    });

    let apiResponse: IApiResponse;

    try{
      apiResponse = await response.json();
    }catch(e){
      alert("An error ocurred");
      console.log(e);
      return;
    }

    if(!apiResponse.ok){
      console.log(apiResponse.error);
      alert("An error ocurred");
      return;
    }

    setAPIkey(apiResponse.APIKey);
  }

  if (errorElement) {
    return errorElement;
  }

  return (
    <>
      <NavBar />
      <button
        className="btn"
        onClick={() => CreateAPIKey()}
      >
        Create API key
      </button>
      <center>
        {dbDataElement}
      </center>
      <br />
      <br />
      <center>
        <Link to={DBTableCreate(dbUID)} className="btn">Crear Tabla</Link>
      </center>
      {
      APIKey &&
      <CustomAlert title="API KEY" onClose={() => {
        setAPIkey("");
      }}>
        <h4 style={{color: "black"}}>
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
      </CustomAlert>
      }
    </>
  )
}