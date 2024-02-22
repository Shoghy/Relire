import NavBar from "@/components/NavBar";
import { ChangeBodyColor, GetEnumValues } from "@/utilities/functions";
import styles from "./create_table.module.css";
import { selfColumnComponent } from "./column";
import { ColumnType, IForeingKey, ColumnValue, Dictionary, IColumn, IColumForRequest } from "@/utilities/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GetTables, auth } from "@/utilities/DBclient";
import { LogIn } from "@/utilities/PageLocations";
import { selfTextInput } from "@/components/TextInput";
import { selfDAlert } from "@/components/custom_alert";
import { selfLoadingCurtain } from "@/components/loading_curtain";
import * as DBClient from "@/utilities/DBclient";

export interface CreateColumnInfo{
  name: string
  type: ColumnType
  notNull: boolean
  default: ColumnValue
  useDefault: boolean
  enum: string
  autoIncrement: boolean
  unique: boolean
  useForeingKey: boolean
  foreingKey: IForeingKey
  key: string
}

export interface CreateForeignKey{
  columnName: string
  columnType: ColumnType
}

const SelfColumn = selfColumnComponent();
const tableName = selfTextInput();
const DAlert = selfDAlert();
const load = selfLoadingCurtain();
let otherTableNames: string[] = [];
export default function CreateTable() {
  ChangeBodyColor("var(--nyanza)");
  
  const navigate = useNavigate();
  const params = useParams();
  const dbUID = params.idDB as string;
  const [foreignUniqueColumns, setForeignUniqueColumns] = useState<Dictionary<CreateForeignKey[]>>({});
  SelfColumn.foreignUniqueColumns = foreignUniqueColumns;

  useEffect(() => {
    SelfColumn.columns = [];
    SelfColumn.AddNewColumn();
    addEventListener("resize", () => CalculateSize());
    CalculateSize();
    GetUniqueColumns();
  }, []);

  async function GetUniqueColumns(){
    await auth.authStateReady();
    if(auth.currentUser === null){
      navigate(LogIn);
      return;
    }
    const tableResponse = await GetTables(
      auth.currentUser.uid,
      dbUID
    );

    if("error" in tableResponse){
      alert("An error occurred on trying to get other's table foreing key. You will be able to create this table, but will not be able to use ForeignKeys.");
      return;
    }
    
    //               TableName  ColumnName ColumnValue
    const tableData: Dictionary<Dictionary<IColumn>> = tableResponse.val();
    otherTableNames = Object.keys(tableData);
    const foreignUniqueColumns: Dictionary<CreateForeignKey[]> = {};
    
    for(const tableName in tableData){
      const columns = tableData[tableName];
      const uniqueColumns: CreateForeignKey[] = [];
      
      for(const columnName in columns){
        const column = columns[columnName];
        if(!column.unique) continue;
        uniqueColumns.push({
          columnName,
          columnType: column.type
        });
      }

      if(uniqueColumns.length > 0){
        foreignUniqueColumns[tableName] = uniqueColumns;
      }
    }

    setForeignUniqueColumns(foreignUniqueColumns);
  }

  function ValidateTable(){
    load.open();
    const errors: string[] = [];

    if(!tableName.value){
      errors.push("Table has no name.");
    }

    for(let i = 0; i < otherTableNames.length; ++i){
      if(otherTableNames[i] !== tableName.value) continue;
      errors.push("That table name is already in use.");
      break;
    }

    const tableColums: Dictionary<IColumForRequest> = {};
    const columns = SelfColumn.columns;
    if(columns.length === 0){
      errors.push("Your table has no columns.");
    }

    for(let i = 0; i < columns.length; ++i){
      const column = columns[i];
      if(column.name in tableColums){
        errors.push(`${i}: Repeated column name.`);
      }else if(!column.name){
        errors.push(`${i}: Column has no name.`);
        continue;
      }else{
        tableColums[column.name] = {
          type: column.type,
          notNull: column.notNull,
          unique: column.unique,
          name: column.name
        };
      }

      if(column.useDefault){
        if(!column.default){
          errors.push(`${i}: Disable default or add a value to it.`);
        }else{
          tableColums[column.name].default = column.default;
        }
      }

      switch(column.type){
        case ColumnType.INT:{
          tableColums[column.name].autoIncrement = column.autoIncrement;
          break;
        }
        case ColumnType.ENUM:{
          if (!column.enum) {
            errors.push(`${i}: You need to add at least one value on the enum.`);
          }else{
            tableColums[column.name].enum = GetEnumValues(column.enum);
          }
          break;
        }
      }

      if(column.useForeingKey){
        if(!column.foreingKey.tableName || !column.foreingKey.column){
          errors.push(`${i}: Select a table and a column in the foreign key or disable it.`);
        }else{
          tableColums[column.name].foreingKey = column.foreingKey;
        }
      }
    }

    if(errors.length > 0){
      DAlert.openWith({
        title: "Error",
        message: errors.join("\n")
      });
      load.close();
      return;
    }

    SendTableInfo(tableColums);
  }

  async function SendTableInfo(tableInfo: Dictionary<IColumForRequest>){
    const response = await DBClient.CreateTable(
      dbUID,
      tableName.value,
      Object.values(tableInfo)
    );

    load.close();

    if(!response.ok){    
      DAlert.openWith({
        title: "Error",
        message: response.error?.message
      });
      return;
    }

    SelfColumn.columns = [];
    SelfColumn.AddNewColumn();
    tableName.setValue("");
  
    DAlert.openWith({
      title: "Success",
      message: "The table was created successfully."
    });

  }

  return (
    <>
      <NavBar />
      <load.Element/>
      <div className={styles["top-panel"]}>
        <span>Table name:</span>
        <tableName.Element/>
        <button
          className={styles["btn-create-table"]}
          onClick={() => ValidateTable()}
        >
          Create
        </button>
      </div>
      <div className={styles.background} >
        <div id="container" className={styles.container}>
          <button onClick={() => SelfColumn.AddNewColumn()} className={styles["add-column-btn"]}>
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
          <SelfColumn.ShowColumns/>
        </div>
      </div>
      <DAlert.Element/>
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
