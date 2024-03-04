import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import { GetDataInTable, GetTables, InsertRow, auth } from "@/utilities/DBclient";
import { DataInTable } from "@/utilities/PageLocations";
import { IForeingKey, TableRow, Dictionary, IColumn, ColumnValue, ColumnType, CustomArray } from "@/utilities/types";
import { useEffect, useState } from "react";
import { ChangeBodyColor, IsValidDate } from "@/utilities/functions";
import NavBar from "@/components/NavBar";
import styles from "./insert_in_table.module.css";
import { selfLoadingCurtain } from "@/components/loading_curtain";
import { selfDAlert } from "@/components/custom_alert";
import { selfRowComponent } from "./column";

const loadingScreen = selfLoadingCurtain();
const DAlert = selfDAlert();
const rowsData = selfRowComponent();
export default function InsertInTable(){
  ChangeBodyColor("var(--nyanza)");
  const navigate = useNavigate();
  const params = useParams();

  const dbUID = params.idDB as string;
  const tableName = params.tbName as string;

  const [columns, setColumns] = useState<[string, IColumn][]>([]);
  const [foreignKeyTablesValues, setForeignKeyTablesValues] = useState<Dictionary<TableRow>>({});
  rowsData.columnsInfo = columns;

  useEffect(() => {
    loadingScreen.open();
    rowsData.rows = {};
    rowsData.Update();
    addEventListener("resize", () => CalculateSize());
    CalculateSize();
    GetColumnsInfo();
  }, []);

  async function GetColumnsInfo(){
    await auth.authStateReady();
    const user = auth.currentUser;
    if(user == null) return;

    const result = await GetTables(
      user.uid,
      dbUID,
      tableName
    );
    loadingScreen.close();

    if("error" in result){
      UnableToGetTheTableData(navigate, dbUID, tableName);
      return;
    }

    const columns = result.val();
    if(columns === null){
      UnableToGetTheTableData(navigate, dbUID, tableName);
      return;
    }

    setColumns(Object.entries(columns));

    const columnsWithForeignKeys: IColumn[] = [];

    for(const columnName in columns){
      const column: IColumn = columns[columnName];
      if(!column.foreingKey) continue;
      columnsWithForeignKeys.push(column);
    }

    if(columnsWithForeignKeys.length > 0) return;
    GetForeignKeys(columnsWithForeignKeys);
  }

  async function GetForeignKeys(columns: IColumn[]){
    loadingScreen.open();

    const tablesGetted: Dictionary<TableRow> = {};
    for(const column of columns){
      const foreignKey = column.foreingKey as IForeingKey;
      if(foreignKey.tableName in tablesGetted) continue;
      const tableRows = await GetDataInTable(
        auth.currentUser?.uid as string,
        dbUID,
        foreignKey.tableName
      );

      if("error" in tableRows){
        DAlert.openWith({
          title: "Error",
          message: "We were not able to get foreign keys info.",
          buttons: [{
            text: "Go back",
            onClick: () => navigate(DataInTable(dbUID, tableName))
          }]
        });
        continue;
      }

      const values = tableRows.val();
      if(values === null){
        DAlert.openWith({
          title: "Error",
          message: `The table "${foreignKey.tableName}" is empty, go fill it before adding values to this one.`,
          buttons: [{
            text: "Go back",
            onClick: () => navigate(DataInTable(dbUID, tableName))
          }]
        });
        return;
      }

      tablesGetted[foreignKey.tableName] = values;
    }

    setForeignKeyTablesValues(tablesGetted);

    loadingScreen.close();
  }

  async function GetAutoIncrementsLastValues(){
    const columnsWithAutoIncrement: Dictionary<ColumnValue> = {};
    const columnsName: string[] = [];

    for(const columnInfo of columns){
      const columnName = columnInfo[0];
      const column = columnInfo[1];
      if(!column.autoIncrement) continue;

      columnsWithAutoIncrement[columnName] = -1;
      columnsName.push(columnName);
    }

    if(Object.keys(columnsWithAutoIncrement).length === 0){
      return columnsWithAutoIncrement;
    }

    const table = await GetDataInTable(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName as string
    );

    if("error" in table){
      DAlert.openWith({
        title: "Error",
        message: "We were not able to get the last autoincrement value, try again later",
        buttons:[{
          text: "Close",
          onClick: (s) => s.close()
        }]
      });
      return;
    }

    table.forEach((insert) => {
      const insertValue: Dictionary<ColumnValue> = insert.val();
      columnsName.forEach((columnName) => {
        if(insertValue[columnName] < columnsWithAutoIncrement[columnName]) return;
        columnsWithAutoIncrement[columnName] = insertValue[columnName];
      });
    });

    return columnsWithAutoIncrement;
  }

  async function InsertValues(){
    const removeKeys = new CustomArray<string>();
    const errors: string[] = [];
    const autoIncrements = (await GetAutoIncrementsLastValues());
    if(autoIncrements === undefined) return;
    
    for(const rowKey in rowsData.rows){
      const row = rowsData.rows[rowKey];
      const insert: Dictionary<ColumnValue> = {};
      const errorsLength = errors.length;

      for(const columnInfo of columns){
        const columnName = columnInfo[0];
        const column = columnInfo[1];
        let value = row[columnName];

        if(value === undefined || value === null || value === ""){
          if(column.type === ColumnType.INT && column.autoIncrement){
            (autoIncrements[columnName] as number) += 1;
            insert[columnName] = autoIncrements[columnName];
          }else if(column.notNull){
            errors.push(`(${rowKey} : ${columnName}) Value can't be null`);
          }
          continue;
        }

        switch(column.type){
          case ColumnType.BOOL:{
            if(typeof(value) !== "boolean"){
              errors.push(`(${rowKey} : ${columnName}) Value is not a boolean`);
              continue;
            }
            break;
          }
          case ColumnType.DATE:
          case ColumnType.DATETIME:{
            if(!IsValidDate(value as string)){
              errors.push(`(${rowKey} : ${columnName}) Value is not a valid date`);
              continue;
            }
            break;
          }
          case ColumnType.ENUM:{
            if(column.enum === undefined || column.enum.length === 0){
              errors.push(`(${rowKey} : ${columnName}) Error not yet resolved, empty enum in the database.`);
              continue;
            }
            if(column.enum.indexOf(value as string) === -1){
              errors.push(`(${rowKey} : ${columnName}) Value not in enum.`);
              continue;
            }
            break;
          }
          case ColumnType.FLOAT:{
            if(typeof(value) !== "number"){
              errors.push(`(${rowKey} : ${columnName}) Value is not a number.`);
              continue;
            }
            break;
          }
          case ColumnType.INT:{
            if(typeof(value) !== "number"){
              errors.push(`(${rowKey} : ${columnName}) Value is not a number.`);
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
                errors.push(`(${rowKey} : ${columnName}) Value is not a string or value that can be transform into a string.`);
                continue;
              }
            }
            break;
          }
        }
        insert[columnName] = value;
      }

      if(errors.length > errorsLength){
        continue;
      }

      removeKeys.push(rowKey);

      InsertRow(
        auth.currentUser?.uid as string,
        params.idDB as string,
        params.tbName as string,
        insert
      ).catch(() => {
        removeKeys.removeItem(rowKey);
        errors.push(`(${rowKey}) An error ocurred while trying to upload the data.`);
      });
    }

    for(const key of removeKeys){
      delete rowsData.rows[key];
    }
    rowsData.Update();

    if(errors.length === 0) return;

    DAlert.openWith({
      title: "Error",
      message: errors.join("\n"),
      buttons: [{
        text: "Close",
        onClick: (e) => e.close()
      }]
    });
  }

  return (
    <>
      <NavBar/>
      <button
        className={styles["insert-btn"]}
        onClick={() => InsertValues()}
      >
        Insert Rows
      </button>
      <div className={styles.background}>
        <div id="container" className={styles.container}>
          <button
            className={styles["add-column-btn"]}
            onClick={() => rowsData.AddRow()}
          >
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
          <rowsData.Element
            foreignValues={foreignKeyTablesValues}
          />
        </div>
      </div>
      <loadingScreen.Element/>
      <DAlert.Element
        showCloseButton={false}
      />
    </>
  );
}

function CalculateSize(){
  const container = document.getElementById("container");
  if(!container) return;
  const computedStyles = window.getComputedStyle(container);
  const paddingLeft = parseInt(computedStyles.getPropertyValue("padding-left").replace("px", ""));
  const paddingRight = parseInt(computedStyles.getPropertyValue("padding-right").replace("px", ""));

  const parent = container.parentElement!;
  const maxWidth = parent.clientWidth;
  container.style.width = `${(370 * Math.floor((maxWidth - (paddingLeft + paddingRight))/370))}px`;
}

function UnableToGetTheTableData(navigate: NavigateFunction, dbUID: string, table:string) {
  DAlert.openWith({
    title: "Error",
    message: "We were not able to get the data of this table",
    buttons: [{
      text: "Go Back",
      onClick: () => {
        navigate(DataInTable(dbUID, table));
      }
    }]
  });
}