import NavBar from "@/components/NavBar";
import { ChangeBodyColor } from "@/utilities/functions";
import styles from "./create_table.module.css";
import { selfColumnComponent } from "./column";
import { ColumnType, IForeingKey, ColumnValue, Dictionary, IColumn } from "@/utilities/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GetTables, auth } from "@/utilities/DBclient";
import { LogIn } from "@/utilities/PageLocations";

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
SelfColumn.AddNewColumn();
export default function CreateTable() {
  ChangeBodyColor("var(--nyanza)");
  
  const navigate = useNavigate();
  const params = useParams();
  const dbUID = params.idDB as string;
  const [foreignUniqueColumns, setForeignUniqueColumns] = useState<Dictionary<CreateForeignKey[]>>({});

  useEffect(() => {
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

  return (
    <>
      <NavBar />
      <div className={styles.background} >
        <div id="container" className={styles.container}>
          <button onClick={() => SelfColumn.AddNewColumn()} className={styles["add-column-btn"]}>
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
          <SelfColumn.ShowColumns
            foreignUniqueColumns={foreignUniqueColumns}
          />
        </div>
      </div>
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
