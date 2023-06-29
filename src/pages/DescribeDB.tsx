import { Link, useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { auth, realtimeDB } from "../DBclient";
import PageLocations from "../Utilities/PageLocations";
import { useState, useEffect } from "react";
import { IDataBase, IPageContent } from "../Utilities/types";
import DBGetDefaultCath from "../Utilities/DBGetDefaultCatch";

export default function DescribeDB(){
  const navigate = useNavigate();
  let params = useParams();

  const [content, setContent] = useState<IPageContent>({
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

    Object.keys(db.tables).forEach((tableName) => {
      let cantEntries = 0;
      if(db.tablesData !== undefined && tableName in db.tablesData){
        cantEntries = Object.keys(db.tablesData[tableName]).length;
      }
      tables.push(
        <tr>
          <td>{tableName}</td>
          <td>{cantEntries}</td>
        </tr>
      );
    });

    setContent({
      element: (
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
      ),
      todoBien: true
    });
  }, [db]);

  auth.onAuthStateChanged((user) => {
    if(user === undefined || user === null){
      navigate(PageLocations.LogIn);
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
        <center><Link to={PageLocations.DBTableCreate(params.idDB as string)} className="btn">Crear Tabla</Link></center>}
    </>
  )
}