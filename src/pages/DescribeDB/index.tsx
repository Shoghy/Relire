import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/NavBar";
import { GetDatabases, auth } from "../../utilities/DBclient";
import { DBTableCreate, DataInTable, LogIn } from "../../utilities/PageLocations";
import { useState, useEffect, useRef } from "react";
import { IDataBase } from "../../utilities/types";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { AsyncAttempter, RandomString } from "../../utilities/functions";

export default function DescribeDB(){
  const navigate = useNavigate();
  let params = useParams();

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [db, setDB] = useState<IDataBase>();
  const [dbDataElement, setDBDataElement] = useState<React.ReactNode>(<h1>Cargando base de datos</h1>);
  const dbRef  = useRef<IDataBase>();
  //Reference for the async function
  dbRef.current = db;

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if(user === undefined || user === null){
        navigate(LogIn);
        return;
      }
    });

  (async () => {
    let [getDBResult, getDBError] = await AsyncAttempter(
      () => GetDatabases(
        auth.currentUser?.uid as string,
        params.idDB as string
      )
    );

    if(getDBError){
      DBGetDefaultCath(
        getDBError,
        errorElement,
        setErrorElement,
        navigate
      );
      return;
    }

    setDB(getDBResult?.val());
    if(dbRef.current === undefined || dbRef.current.tables === undefined){
      setDBDataElement(<h1>Aún no hay tablas, crea una</h1>)
      return;
    }

    let tables: React.JSX.Element[] = [];
    let key = RandomString(6);
    let tablesNames = Object.keys(dbRef.current.tables);

    for(let i = 0; i < tablesNames.length; ++i){
      let tableName = tablesNames[i];
      let cantEntries = 0;

      if(dbRef.current.tablesData !== undefined && tableName in dbRef.current.tablesData){
        cantEntries = Object.keys(dbRef.current.tablesData[tableName]).length;
      }

      tables.push(
        <tr key={`${i}-${key}`}>
          <td key={`${i}-1-${key}`}><Link to={DataInTable(params.idDB as string, tableName)}>{tableName}</Link></td>
          <td key={`${i}-2-${key}`}>{cantEntries}</td>
        </tr>
      );
    }
    setDBDataElement((
      <table>
        <thead>
          <tr>
            <th key="Table Name">Table Name</th>
            <th key="Entries">Entries</th>
          </tr>
        </thead>
        <tbody>
          {tables}
        </tbody>
      </table>
    ));
  })()}, []);

  if(errorElement){
    return errorElement;
  }

  return (
    <>
      <NavBar/>
      <center>
        {dbDataElement}
      </center>
      <br/>
      <br/>
      <center>
        <Link to={DBTableCreate(params.idDB as string)} className="btn">Crear Tabla</Link>
      </center>
    </>
  )
}