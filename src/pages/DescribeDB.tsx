import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { auth, realtimeDB } from "../DBclient";
import { DBTableCreate, DataInTable, LogIn } from "../Utilities/PageLocations";
import { useState, useEffect } from "react";
import { IDataBase, IErrorElement } from "../Utilities/types";
import DBGetDefaultCath from "../Utilities/DBGetDefaultCatch";
import { RandomString } from "../Utilities/functions";

export default function DescribeDB(){
  const navigate = useNavigate();
  let params = useParams();

  const [content, setContent] = useState<IErrorElement>({
    element: (
        <h1>Aún no hay tablas, crea una</h1>
    ),
    todoBien: true
  });

  const [db, setDB] = useState<IDataBase>();
  useEffect(() => {
    if(db === undefined) return;
    if(db.tables === undefined) return;

    let tables: React.JSX.Element[] = [];
    let key = RandomString(6);
    Object.keys(db.tables).forEach((tableName, index) => {
      let cantEntries = 0;
  
      if(db.tablesData !== undefined && tableName in db.tablesData){
        cantEntries = Object.keys(db.tablesData[tableName]).length;
      }
      tables.push(
        <tr key={`${index}-${key}`}>
          <td key={`${index}-1-${key}`}><Link to={DataInTable(params.idDB as string, tableName)}>{tableName}</Link></td>
          <td key={`${index}-2-${key}`}>{cantEntries}</td>
        </tr>
      );
    });

    setContent({
      element: (
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
      ),
      todoBien: true
    });
  }, [db]);

  auth.onAuthStateChanged((user) => {
    if(user === undefined || user === null){
      navigate(LogIn);
      return;
    }
  });

  if(!db){
    realtimeDB.get(params.idDB as string)
    .catch((error) => DBGetDefaultCath(error, content, setContent, navigate))
    .then((value) => {
      if(!(value instanceof Object)) return;
  
      setDB(value.val());
    });
  }

  return (
    <>
      <NavBar/>
      <center>
        {content.element}
      </center>
      <br/>
      <br/>
      {content.todoBien &&
        <center><Link to={DBTableCreate(params.idDB as string)} className="btn">Crear Tabla</Link></center>}
    </>
  )
}