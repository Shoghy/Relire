import { useNavigate, useParams, Link } from "react-router-dom";
import { GetDataInTable, GetTables, auth } from "../../utilities/DBclient";
import { LogIn } from "../../utilities/PageLocations";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { useEffect, useState } from "react";
import { ColumnValue, Dictionary, IColumn, TableInsert } from "../../utilities/types";
import { AsyncAttempter } from "../../utilities/functions";

export default function DataInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [columns, setColumns] = useState<Dictionary<IColumn>>({});
  const [cValues, setCValues] = useState<TableInsert>({});

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user === undefined || user === null) {
        navigate(LogIn);
        return;
      }
    });

  (async () => {

    let [tableStructure, tableStrunctureError] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName
      )
    )

    if(tableStrunctureError){
      DBGetDefaultCath(tableStrunctureError, errorElement, setErrorElement, navigate);
      return;
    }

    if(!tableStructure){
      setErrorElement(<h1>Something went wrong </h1>);
      return;
    }

    setColumns(tableStructure.val());

    let [tableData, tableDataError] = await AsyncAttempter(
      () => GetDataInTable(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName as string
      )
    )

    if(tableDataError){
      DBGetDefaultCath(
        tableDataError,
        errorElement,
        setErrorElement,
        navigate
      )
      return;
    }
    setCValues(tableData?.val())
  })()}, [])

  if(errorElement){
    return errorElement;
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
              tableValuesColumns.push(<tr key={insertUID}>
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
                    tableValuesRows.push(<td key={`${insertUID}-${columnName}`}>{value}</td>);
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