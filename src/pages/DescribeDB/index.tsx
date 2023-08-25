import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../../components/NavBar";
import { GetDatabases, auth } from "../../utilities/DBclient";
import { DBTableCreate, DataInTable, LogIn } from "../../utilities/PageLocations";
import { useState, useEffect } from "react";
import { IDataBase } from "../../utilities/types";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { AsyncAttempter, RandomString } from "../../utilities/functions";

export default function DescribeDB() {
  const navigate = useNavigate();
  const params = useParams();

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [dbDataElement, setDBDataElement] = useState<React.ReactNode>(<h1>Cargando base de datos</h1>);

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
      () => GetDatabases(
        auth.currentUser?.uid as string,
        params.idDB as string
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

    let dbInfo: IDataBase = getDBResult?.val();
    if (dbInfo === undefined || dbInfo.tables === undefined) {
      setDBDataElement(<h1>Aún no hay tablas, crea una</h1>)
      return;
    }

    let tables: React.JSX.Element[] = [];
    let key = RandomString(6);
    let tablesNames = Object.keys(dbInfo.tables);

    for (let i = 0; i < tablesNames.length; ++i) {
      let tableName = tablesNames[i];
      let cantEntries = 0;

      if (dbInfo.tablesData !== undefined && tableName in dbInfo.tablesData) {
        cantEntries = Object.keys(dbInfo.tablesData[tableName]).length;
      }

      tables.push(
        <tr key={`${i}-${key}`}>
          <td><Link to={DataInTable(params.idDB as string, tableName)}>{tableName}</Link></td>
          <td>{cantEntries}</td>
        </tr>
      );
    }
    setDBDataElement((
      <table>
        <thead>
          <tr>
            <th>Table Name</th>
            <th>Entries</th>
          </tr>
        </thead>
        <tbody>
          {tables}
        </tbody>
      </table>
    ));
  }

  if (errorElement) {
    return errorElement;
  }

  return (
    <>
      <NavBar />
      <center>
        {dbDataElement}
      </center>
      <br />
      <br />
      <center>
        <Link to={DBTableCreate(params.idDB as string)} className="btn">Crear Tabla</Link>
      </center>
    </>
  )
}