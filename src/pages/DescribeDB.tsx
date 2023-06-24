import { useNavigate, useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import { auth, realtimeDB } from "../DBclient";
import PageLocations from "../components/PageLocations";
import { useState } from "react";

interface Dictionary<T> {
  [Key: string]: T;
}

interface IDataBase{
  author:string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<Dictionary<Dictionary<unknown>>>
}

interface IColumn{
  type: "string" | "int" | "float" | "bool" | "date" | "datetime" | "enum",
  notNull: boolean,
  default?: unknown,
  special?: string[],
  foreingKey?: IForeingKey,
  enum?: unknown[]
}

interface IForeingKey{
  tableName: string,
  column: string
}

export default function DescribeDB(){
  const navigate = useNavigate();
  let params = useParams();

  const [content, setContent] = useState(<></>);

  auth.onAuthStateChanged((user) => {
    if(user === undefined || user === null){
      navigate(PageLocations.LogIn);
      return;
    }
    realtimeDB.get(params.idDB as string)
    .catch((error) => {
      console.log(error);
    })
    .then((value) => {
      if(!(value instanceof Object)) return;
      let db : IDataBase = value.val();
      console.log(db);
    });
  });
  return (
    <>
      <NavBar/>
      {content}
    </>
  )
}