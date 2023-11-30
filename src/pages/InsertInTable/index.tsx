import { useNavigate, useParams } from "react-router-dom";
import { GetDataInTable, GetTables, auth, InsertRow } from '../../utilities/DBclient';
import { LogIn } from "../../utilities/PageLocations";
import { ColumnType, ColumnValue, Dictionary, IColumn } from "../../utilities/types";
import React, { useEffect, useState } from "react";
import DBGetDefaultCath from "../../utilities/DBGetDefaultCatch";
import { AsyncAttempter, IsValidDate, RandomString } from "../../utilities/functions";
import ColumnInput from "../../components/ColumnInput";

export default function InsertInTable(){
  const navigate = useNavigate();
  const params = useParams();

  const [errorElement, setErrorElement] = useState<React.JSX.Element>();
  const [columns, setColumns] = useState<Dictionary<IColumn>>({});
  const [inserts, setInserts] = useState<Dictionary<ColumnValue>[]>([]);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if(user === undefined || user === null){
        navigate(LogIn);
        return;
      }
      Start();
    });
  }, []);

  async function Start(){
    let [tableData, tableDataError] = await AsyncAttempter(
      () => GetTables(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName
      )
    )
    if(tableDataError){
      DBGetDefaultCath(tableDataError, errorElement, setErrorElement, navigate)
      return;
    }

    if(!(tableData instanceof Object)){
      setErrorElement(<h1>Something went wrong</h1>);
      return;
    }

    setColumns(tableData.val());
  }

  function AddRow(){
    setInserts((currentInsert) => {
      let newInsert : Dictionary<ColumnValue> = {};
  
      for(let columnName in columns){
        let value : ColumnValue = "";
        let column = columns[columnName];

        if(column.enum !== undefined && column.notNull){
          value = column.enum[0];
        }else if(column.type === ColumnType.BOOL){
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

    let [table, tableError] = await AsyncAttempter(
      () => GetDataInTable(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName as string
      )
    )

    if(tableError){
      DBGetDefaultCath(
        tableError,
        errorElement,
        setErrorElement,
        navigate
      )
      return;
    }

    if(!(table instanceof Object)){
      setErrorElement(<h1>Something went wrong</h1>)
      return;
    }

    table.forEach((insert) => {
      let insertValue: Dictionary<ColumnValue> = insert.val();
      columnsName.forEach((columnName) => {
        if(insertValue[columnName] > columnsWithAutoIncrement[columnName]){
          columnsWithAutoIncrement[columnName] = insertValue[columnName];
        }
      });
    });

    return columnsWithAutoIncrement;
  }

  async function InsertValues(){
    let removeIndices: number[] = [];
    let errors: [number[], string[]] = [[], []];
    let autoIncrements = (await GetAutoIncrementsLastValues()) as Dictionary<ColumnValue>;

    inserts.forEach((rowValues, index) => {
      let insert: Dictionary<ColumnValue> = {};
      for(let columnName in columns){
        let column = columns[columnName];
        let value = rowValues[columnName];

        if(value === undefined || value === null || value === ""){
          if(column.type === ColumnType.INT && column.autoIncrement){
            (autoIncrements[columnName] as number) += 1;
            insert[columnName] = autoIncrements[columnName];
          }else if(column.notNull){
            errors[0].push(index);
            errors[1].push(`(${columnName}) Value can't be null`);
          }
          continue;
        }

        switch(column.type){
          case ColumnType.BOOL:{
            if(typeof(value) !== "boolean"){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a boolean`);
              continue;
            }
            break;
          }
          case ColumnType.DATE:
          case ColumnType.DATETIME:{
            if(!IsValidDate(value as string)){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a valid date`);
              continue;
            }
            break;
          }
          case ColumnType.ENUM:{
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
          case ColumnType.FLOAT:{
            if(typeof(value) !== "number"){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a number.`);
              continue;
            }
            break;
          }
          case ColumnType.INT:{
            if(typeof(value) !== "number"){
              errors[0].push(index);
              errors[1].push(`(${columnName}) Value is not a number.`);
              continue;
            }
            value = value.toFixed(0);
            break;
          }
          case ColumnType.STRING:{
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

      InsertRow(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName as string,
        insert
      ).catch(() => {
        setErrorElement(
          <h1>No fue posible insertar los datos en la base de datos</h1>
        )
      })
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

  if(errorElement){
    return errorElement;
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