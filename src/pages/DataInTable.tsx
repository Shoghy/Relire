import { useNavigate, useParams } from "react-router-dom";
import { auth, realtimeDB } from "../DBclient";
import { LogIn } from "../Utilities/PageLocations";
import DBGetDefaultCath from "../Utilities/DBGetDefaultCatch";
import { useState } from "react";
import { Dictionary, IColumn, IErrorElement } from "../Utilities/types";

export default function DataInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [erros, setErrors] = useState<IErrorElement>({element: <></>, todoBien: true});
  const [columns, setColumns] = useState<Dictionary<IColumn>>({});

  auth.onAuthStateChanged((user) => {
    if (user === undefined || user === null) {
      navigate(LogIn);
      return;
    }
  });

  if(erros.todoBien && Object.keys(columns).length === 0){
    realtimeDB.get(`${params.idDB}/tables/${params.tbName}`)
    .catch((error) => DBGetDefaultCath(error, erros, setErrors, navigate))
    .then((value) => {
      if (!(value instanceof Object)){
        setErrors({element: <h1>Something went wrong </h1>, todoBien: false});
        return;
      }
      setColumns(value.val());
      GetTableInserts();
    });
  }

  function GetTableInserts(){
    
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
              columnsArray.push(<th title={toolTip.join("\n")}>{columnName}</th>)
            }
            return columnsArray
          })()}
        </tr>
      </thead>
      <tbody>

      </tbody>
    </table>
    </>
  );
}