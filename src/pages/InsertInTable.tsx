import { useNavigate, useParams } from "react-router-dom";
import { auth, realtimeDB } from "../DBclient";
import { LogIn } from "../Utilities/PageLocations";
import { ColumnValue, Dictionary, IColumn, IErrorElement } from "../Utilities/types";
import { useState } from "react";
import DBGetDefaultCath from "../Utilities/DBGetDefaultCatch";
import { IsValidDate, RandomString } from "../Utilities/functions";
import ColumnInput from "../components/ColumnInput";

export default function InsertInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [erros, setErrors] = useState<IErrorElement>({element: <></>, todoBien: true});
  const [columns, setColumns] = useState<Dictionary<IColumn>>({});
  const [inserts, setInserts] = useState<Dictionary<ColumnValue>[]>([]);

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
      let newInsert : Dictionary<ColumnValue> = {};
  
      for(let columnName in columns){
        let value : ColumnValue = "";
        let column = columns[columnName];

        if(column.enum !== undefined && column.notNull){
          value = column.enum[0];
        }else if(column.type === "bool"){
          value = false;
        }
        if(column.default !== undefined){
          value = column.default;
        }
        newInsert[columnName] = value;
      }
  
      return [... currentInsert, newInsert]
    });
  }

  async function GetAutoIncrementsLastValues(){
    let columnsWithAutoIncrement: Dictionary<ColumnValue> = {};
    let columnsName: string[] = [];

    for(let columnName in columns){
      let column = columns[columnName];
      if(!column.autoIncrement) continue;

      columnsWithAutoIncrement[columnName] = -1;
      columnsName.push(columnName);
    }

    if(Object.keys(columnsWithAutoIncrement).length == 0){
      return columnsWithAutoIncrement;
    }

    return await realtimeDB.get(`${params.idDB}/tablesData/${params.tbName}`)
    .catch((error) => DBGetDefaultCath(error, erros, setErrors, navigate))
    .then<Dictionary<ColumnValue>>((value) => {
      if (!(value instanceof Object)) return {};

      value.forEach((insert) => {
        let insertValue: Dictionary<ColumnValue> = insert.val();
        columnsName.forEach((columnName) =>{
          if(insertValue[columnName] > columnsWithAutoIncrement[columnName]){
            columnsWithAutoIncrement[columnName] = insertValue[columnName];
          }
        });
      });
      return columnsWithAutoIncrement;
    });
  }

  async function InsertValues(){
    let removeIndices: number[] = [];
    let errors: [number[], string[]] = [[], []];
    let autoIncrements = await GetAutoIncrementsLastValues();

    inserts.forEach((rowValues, index) => {
      let insert: Dictionary<ColumnValue> = {};
      for(let columnName in columns){
        let column = columns[columnName];
        let value = rowValues[columnName];

        if(value === undefined || value === null || value === ""){
          if(column.type === "int" && column.autoIncrement){
            (autoIncrements[columnName] as number) += 1;
            insert[columnName] = autoIncrements[columnName];
          }else if(column.notNull){
            errors[0].push(index);
            errors[1].push(`(${columnName}) Value can't be null`);
          }
          continue;
        }

        switch(column.type){
          case "bool":{
            if(typeof(value) !== "boolean"){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a boolean`);
              continue;
            }
            break;
          }
          case "date":
          case "datetime":{
            if(!IsValidDate(value as string)){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a valid date`);
              continue;
            }
            break;
          }
          case "enum":{
            if(column.enum === undefined || column.enum.length === 0){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Error not yet resolved, empty enum in the database.`);
              continue;
            }
            if(column.enum.indexOf(value as string) === -1){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value not in enum.`);
              continue;
            }
            break;
          }
          case "float":{
            if(typeof(value) !== "number"){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a number.`);
              continue;
            }
            break;
          }
          case "int":{
            if(typeof(value) !== "number"){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a number.`);
              continue;
            }
            value = value.toFixed(0);
            break;
          }
          case "string":{
            if(typeof(value) !== "string"){
              try{
                value = JSON.stringify(value);
              }catch(e){
                errors[0].push(index);
                errors[1].push(`(${columnName}) Value is not a string or value that can be transform into a string.`);
                continue;
              }
            }
            break;
          }
        }
        insert[columnName] = value;
      }

      if(errors[0].indexOf(index) > -1){
        return;
      }

      removeIndices.push(index);
      realtimeDB.push(`${params.idDB}/tablesData/${params.tbName}`, insert);
    });

    removeIndices.reverse();
    setInserts((currentInsert)=>{
      removeIndices.forEach((i) => {
        currentInsert.splice(i, 1);
      });
      return [... currentInsert]
    });

    let errorMessage: string = "";
    let lastIndex = -1;
  
    errors[1].forEach((value, index) => {
      if(index !== lastIndex){
        lastIndex = index;
        errorMessage += `\n(${index}): `
      }
      errorMessage += `${value}, `;
    });

    if(errorMessage) alert(errorMessage);
  }

  function CreateSetValue(index: number, columnName: string){
    return (value: ColumnValue) => {
      setInserts((currentInsert) => {
        currentInsert[index][columnName] = value;
        return [... currentInsert];
      });
    }
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
                  let column = columns[columnName];
                  rowsValue.push(
                    <td key={`${index}-${columnName}`}>
                      <ColumnInput
                      column={column}
                      value={rowValue[columnName]}
                      setValue={CreateSetValue(index, columnName)}
                      />
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
    <br />
    <br />
    <button onClick={AddRow} className="btn">Add Row</button>
    <br />
    <br />
    <button onClick={InsertValues} className="btn">Insert Values</button>
    </>
  )
}