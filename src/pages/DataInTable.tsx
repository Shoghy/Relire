import { useNavigate, useParams, Link } from "react-router-dom";
import { GetDataInTable, GetTables, auth } from "../utilities/DBclient";
import { LogIn } from "../utilities/PageLocations";
import DBGetDefaultCath from "../utilities/DBGetDefaultCatch";
import { useEffect, useState } from "react";
import { ColumnValue, Dictionary, IColumn, TableInsert } from "../utilities/types";
import { AsyncAttempter } from "../utilities/functions";

export default function DataInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [columns, setColumns] = useState<Dictionary<IColumn>>({});
  const [cValues, setCValues] = useState<TableInsert>({});

  useEffect(() => { (async () => {
    auth.onAuthStateChanged((user) => {
      if (user === undefined || user === null) {
        navigate(LogIn);
        return;
      }
    });

    let [result, error] = await AsyncAttempter(() => realtimeDB.get(`${params.idDB}/tables/${params.tbName}`))

    if(error){
      DBGetDefaultCath(error, errorElement, setErrorElement, navigate);
      return;
    }

    if(!result){
      setErrorElement(<h1>Something went wrong </h1>);
      return;
    }

    setColumns(result.val());
    GetTableInserts();
  })()}, [])

  if(errorElement){
    return errorElement;
  }
  

  function GetTableInserts(){
    realtimeDB.get(`${params.idDB}/tablesData/${params.tbName}`)
    .catch((error) => DBGetDefaultCath(error, errorElement, setErrorElement, navigate))
    .then((value) => {
      if (!(value instanceof Object)) return;
      setCValues(value.val());
    });
  }

  return (
    <>
    <table>
      <thead>
        <tr>
          {(() => {
            let columnsArray: React.JSX.Element[] = [];
            for(let columnName in columns){
              let column = columns[columnName];
              let toolTip:string[] = [];
              toolTip.push(`Type: ${column.type}`);
              toolTip.push(`Unique: ${column.unique}`);
              toolTip.push(`Not-Null: ${column.notNull}`);
  
              switch(column.type){
                case "int":{
                  toolTip.push(`Auto-Increment: ${column.autoIncrement}`);
                  break;
                }
                case "enum":{
                  toolTip.push(`Enum: [${column.enum?.join(", ")}]`);
                  break;
                }
              }
              
              if(column.default !== undefined){
                toolTip.push(`Default: ${column.default}`);
              }
              columnsArray.push(<th title={toolTip.join("\n")} key={columnName}>{columnName}</th>)
            }
            return columnsArray
          })()}
        </tr>
      </thead>
      <tbody>
          {(() => {
            let tableValuesColumns: React.JSX.Element[] = [];
            for(let insertUID in cValues){
              let insert = cValues[insertUID];
              tableValuesColumns.push(<tr>
                {(() => {
                  let tableValuesRows: React.JSX.Element[] = [];
                  for(let columnName in columns){
                    let value: ColumnValue = "Null";
                    if(columnName in insert){
                      value = insert[columnName];
                      if(typeof(value) === "boolean"){
                        value = value ? "True" : "False";
                      }
                    }
                    tableValuesRows.push(<td>{value}</td>);
                  }
                  return tableValuesRows;
                })()}
              </tr>);
            }
            return tableValuesColumns
          })()}
      </tbody>
    </table>
    <br />
    <br />
    <Link to="insert">Insert Data</Link>
    </>
  );
}