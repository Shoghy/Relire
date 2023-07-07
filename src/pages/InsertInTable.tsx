import { useNavigate, useParams } from "react-router-dom";
import { auth, realtimeDB } from "../DBclient";
import { LogIn } from "../Utilities/PageLocations";
import { ColumValue, Dictionary, IColumn, IErrorElement } from "../Utilities/types";
import { useState } from "react";
import DBGetDefaultCath from "../Utilities/DBGetDefaultCatch";
import { RandomString } from "../Utilities/functions";

export default function InsertInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [erros, setErrors] = useState<IErrorElement>({element: <></>, todoBien: true});
  const [columns, setColumns] = useState<Dictionary<IColumn>>({});
  const [inserts, setInserts] = useState<Dictionary<ColumValue>[]>([]);

  auth.onAuthStateChanged((user) => {
    if(user === undefined || user === null){
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
    });
  }

  function AddRow(){
    setInserts((currentInsert) => {
      let newInsert : Dictionary<ColumValue> = {};
  
      for(let columnName in columns){
        let value : ColumValue = "";
        let column = columns[columnName];

        if(column.enum !== undefined){
          value = column.enum[0];
        }
        let dValue = column.default;
        if(dValue !== undefined){
          value = dValue;
        }
        newInsert[columnName] = value;
      }
  
      return [... currentInsert, newInsert]
    });
  }

  function ChangeRowValue(index: number, columnName: string, value: ColumValue){
    setInserts((currentInsert) => {
      currentInsert[index][columnName] = value;
      return [... currentInsert];
    });
  }

  return (
    <>
    <table>
      <thead>
        <tr>
          {(() => {
            let tableColumns : React.JSX.Element[] = [];
            for(let columnName in columns){
              tableColumns.push(<th key={columnName}>{columnName}</th>)
            }
            tableColumns.push(<th key={RandomString(6)}>btnDelete</th>);
            return tableColumns;
          })()}
        </tr>
      </thead>
      <tbody>
        {(() => {
          let tableRows : React.JSX.Element[] = [];
          inserts.forEach((rowValue, index) => {
            tableRows.push(<tr key={index}>
              {(() => {
                let rowsValue : React.JSX.Element[] = [];
                for(let columnName in columns){
                  let columnType = columns[columnName].type;
                  let inp: React.JSX.Element = <></>;

                  switch(columnType){
                    case "bool":{
                      inp = <input type="checkbox"
                      checked={rowValue[columnName] as boolean}
                      onChange={(e) => ChangeRowValue(index, columnName, e.target.checked)}/>
                      break;
                    }
                    case "date":{
                      inp = <input
                      type="date"
                      value={rowValue[columnName] as string}
                      onChange={(e) => ChangeRowValue(index, columnName, e.target.value)}
                      />
                      break;
                    }
                    case "datetime":{
                      inp = <input
                      type="datetime-local"
                      value={rowValue[columnName] as string}
                      onChange={(e) => ChangeRowValue(index, columnName, e.target.value)}
                      />
                      break;
                    }
                    case "enum":{

                      inp = (
                        <select
                        value={rowValue[columnName] as string}
                        onChange={(e) => ChangeRowValue(index, columnName, e.target.value)}
                        >
                          {(() => {
                            let options : React.JSX.Element[] = [];
                            let enumValues = columns[columnName].enum;
                            if(enumValues === undefined){}

                            return <option></option>;
                          })()}
                        </select>
                      )
                      break;
                    }
                  }
                  rowsValue.push(
                    <td key={`${index}-${columnName}`}>
                      {inp}
                    </td>
                  );
                }
                rowsValue.push(<td key={`${index}-btnDelete-${index}`}><button className="btn">Delete</button></td>);
                return rowsValue
              })()}
            </tr>);
          });
          return tableRows;
        })()}
      </tbody>
    </table>
    <button onClick={AddRow} className="btn">Add Row</button>
    </>
  )
}