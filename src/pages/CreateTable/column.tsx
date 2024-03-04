import XButton from "@/components/x_btn";
import styles from "./create_table.module.css";
import { CreateColumnInfo, CreateForeignKey } from ".";
import { useEffect, useState } from "react";
import { ColumnType, Dictionary } from "@/utilities/types";
import { GetEnumValues, RandomString, RemoveIndexOfArray, TitleCase } from "@/utilities/functions";
import ColumnInput from "@/components/ColumnInput";
import CheckButton from "@/components/check_button";
import { GetDataInTable, auth } from "@/utilities/DBclient";
import { useParams } from "react-router-dom";

export interface ColumnComponentProps {
  index: number
  readonly self: SelfColumnComponentObject
}

const ColumTypeArray = Object.values(ColumnType);
function ColumnComponent({
  index, self
}: ColumnComponentProps) {
  const params = useParams();

  const dbUID = params.idDB as string;
  const [column, setColumn] = useState(self.columns[index]);
  const [foreignValues, setForeignValues] = useState<string[]>([]);
  const [posibleForeignKey, setPosibleForeignKey] = useState<Dictionary<string[]>>();
  self.columns[index] = column;

  useEffect(() => {
    CanUseForeignKey(column.type);
  }, [self.foreignUniqueColumns]);

  function SetColumnInfo<K extends keyof CreateColumnInfo>(key: K, value: CreateColumnInfo[K]) {
    setColumn((current) => {
      current[key] = value;
      return { ...current };
    });
  }

  function DeleteColumn() {
    self.columns = RemoveIndexOfArray(self.columns, index);
    self.Update();
  }

  function OnTypeChange(value: ColumnType) {
    CanUseForeignKey(value);
    SetColumnInfo("useForeingKey", false);
    SetColumnInfo("type", value as ColumnType);
    SetColumnInfo("default", "");
    if (value === ColumnType.ENUM || value === ColumnType.BOOL) {
      SetColumnInfo("unique", false);
    }
  }

  function Unique() {
    if (column.type === ColumnType.ENUM || column.type === ColumnType.BOOL) return <></>;
    return (
      <>
        <div>Unique</div>
        <CheckButton
          style={{ backgroundColor: "var(--nyanza)" }}
          value={column.unique}
          onClick={() => SetColumnInfo("unique", !column.unique)}
        />
      </>
    );
  }

  function AutoIncrement() {
    if (column.type !== ColumnType.INT) return <></>;
    return (
      <>
        <div>Auto Increment</div>
        <CheckButton
          style={{ backgroundColor: "var(--nyanza)" }}
          value={column.autoIncrement}
          onClick={() => SetColumnInfo("autoIncrement", !column.autoIncrement)}
        />
      </>
    );
  }

  function CountFields() {
    let num = 6;
    if (column.type !== ColumnType.BOOL) {
      num += 1;
    }
    if (column.type === ColumnType.INT) {
      num += 1;
    }
    if (column.useDefault) {
      num += 1;
    }
    if(posibleForeignKey){
      num += 1;
    }
    if(column.useForeingKey){
      num += 1;
    }
    if(column.foreingKey.tableName){
      num += 1;
    }

    return num;
  }

  function ShowDefaultInput() {
    if (!column.useDefault) return false;
    if (column.useForeingKey) {
      if(foreignValues.length === 0) return false;
      return column.foreingKey.column !== "" && column.foreingKey.tableName !== "";
    }
    return true;
  }

  function ShowUseDefault() {
    if(!column.useForeingKey) return true;
    if(column.unique){
      if(column.useDefault){
        SetColumnInfo("useDefault", false);
      }
      return false;
    }
    return true;
  }

  function CanUseForeignKey(type: ColumnType) {
    if (type === ColumnType.BOOL || type === ColumnType.ENUM) {
      setPosibleForeignKey(undefined);
      return;
    }

    const posibleForeignKey: Dictionary<string[]> = {};
    let hasSomething = false;

    for (const tableName in self.foreignUniqueColumns) {
      const columns = self.foreignUniqueColumns[tableName];
      const posibleColumns: string[] = [];

      for (let i = 0; i < columns.length; ++i) {
        const column = columns[i];
        if (column.columnType !== type) continue;
        posibleColumns.push(column.columnName);
      }

      if (posibleColumns.length > 0) {
        posibleForeignKey[tableName] = posibleColumns;
        hasSomething = true;
      }
    }

    if (!hasSomething) {
      setPosibleForeignKey(undefined);
      return;
    }

    setPosibleForeignKey(posibleForeignKey);
  }

  function OnEnumChange(value: string){
    SetColumnInfo("enum", value);
    const values = GetEnumValues(value);
    if(values.indexOf(column.default as string) === -1){
      SetColumnInfo("default", values[0]);
    }
  }

  async function GetForeignValues(columnName: string){
    const data = await GetDataInTable(
      auth.currentUser?.uid as string,
      dbUID,
      column.foreingKey.tableName
    );
    
    if("error" in data){
      return;
    }
    data.forEach((x) => {
      setForeignValues((c) => [...c, x.val()[columnName]]);
    });
  }

  function EnumTablesNames(){
    const tables: React.JSX.Element[] = [
      <option key={""} value=""></option>
    ];
    for(const tableName in self.foreignUniqueColumns){
      tables.push(<option key={tableName} value={tableName}>{tableName}</option>);
    }
    return tables;
  }

  function EnumarateTablesColumns(){
    if(!column.useForeingKey) return <></>;
    if(column.foreingKey.tableName === "") return <></>;
    const tableName = column.foreingKey.tableName;
    const columns = self.foreignUniqueColumns[tableName];

    const columnsElement: React.JSX.Element[] = [
      <option key={""} value={""}></option>
    ];
    for(const fColumn of columns){
      if(fColumn.columnType !== column.type) continue;
      columnsElement.push(
        <option key={fColumn.columnName} value={fColumn.columnName}>{fColumn.columnName}</option>
      );
    }
    return (
      <>
        <div>Column Name</div>
        <select
          value={column.foreingKey.column}
          onChange={
            (e) => {
              SetColumnInfo("foreingKey", {
                tableName: column.foreingKey.tableName,
                column: e.currentTarget.value
              });
              GetForeignValues(e.currentTarget.value);
            }
          }
        >
          {columnsElement}
        </select>
      </>
    );
  }

  return (
    <div
      className={styles["column-background"]}
      style={{
        gridRowEnd: `span ${CountFields()}`
      }}
    >
      <div className={styles["column-info-container"]}>
        <div>#</div>
        <div>{index}</div>
        <div>Name</div>
        <input
          type="text"
          value={column.name}
          onChange={(e) => {
            SetColumnInfo("name", e.currentTarget.value);
          }}
        />
        <div>Column Type</div>
        <select
          value={column.type}
          onChange={(e) => OnTypeChange(e.currentTarget.value as ColumnType)}
        >
          {ColumTypeArray.map((k, i) => <option key={i} value={k}>{TitleCase(k)}</option>)}
        </select>
        <AutoIncrement />
        {
          column.type === ColumnType.ENUM
          &&
          <>
            <div>Enum Values</div>
            <input
              type="text"
              value={column.enum}
              onChange={(e) => OnEnumChange(e.currentTarget.value)}
            />
          </>
        }
        <Unique />
        <div>Not Null</div>
        <CheckButton
          style={{ backgroundColor: "var(--nyanza)" }}
          value={column.notNull}
          onClick={() => SetColumnInfo("notNull", !column.notNull)}
        />
        {
          ShowUseDefault()
        &&
        <>
          <div>Use Default</div>
          <CheckButton
            style={{ backgroundColor: "var(--nyanza)" }}
            value={column.useDefault}
            onClick={() => SetColumnInfo("useDefault", !column.useDefault)}
          />
        </>
        }
        {
          ShowDefaultInput()
          &&
          <>
            <div>Default</div>
            <ColumnInput
              type={column.useForeingKey ? ColumnType.ENUM : column.type}
              Enum={column.useForeingKey ? foreignValues : GetEnumValues(column.enum)}
              notNull={column.notNull}
              value={column.default}
              setValue={(value) => SetColumnInfo("default", value)}
              style={column.type === ColumnType.BOOL ? { backgroundColor: "var(--nyanza)" } : undefined}
            />
          </>
        }
        {
          !!posibleForeignKey
          &&
          <>
            <div>Use ForeignKey</div>
            <CheckButton
              style={{ backgroundColor: "var(--nyanza)" }}
              value={column.useForeingKey}
              onClick={() => SetColumnInfo("useForeingKey", !column.useForeingKey)}
            />
          </>
        }
        {
          column.useForeingKey
          &&
          <>
            <div>Table Name</div>
            <select
              value={column.foreingKey.tableName}
              onChange={(e) => SetColumnInfo("foreingKey", {tableName: e.currentTarget.value, column: ""})}
            >
              <EnumTablesNames/>
            </select>
          </>
        }
        <EnumarateTablesColumns/>
      </div>
      <XButton onClick={() => DeleteColumn()} />
    </div>
  );
}

interface SelfColumnComponentObject {
  columns: CreateColumnInfo[]
  ShowColumns(): React.JSX.Element[]
  Update: () => void
  AddNewColumn(): void
  foreignUniqueColumns: Dictionary<CreateForeignKey[]>
}

export function selfColumnComponent() {
  const o: SelfColumnComponentObject = {
    columns: [],
    ShowColumns,
    Update: () => { return; },
    AddNewColumn,
    foreignUniqueColumns: {}
  };

  function AddNewColumn() {
    o.columns.push({
      name: "",
      type: ColumnType.STRING,
      default: "",
      unique: false,
      notNull: false,
      useDefault: false,
      autoIncrement: false,
      enum: "",
      foreingKey: { column: "", tableName: "" },
      useForeingKey: false,
      key: RandomString(6)
    });
    o.Update();
  }

  function ShowColumns() {
    const [, update] = useState(false);
    o.Update = () => update((c) => !c);

    const columnsElements: React.JSX.Element[] = [];

    for (let i = 0; i < o.columns.length; ++i) {
      columnsElements.push(
        <ColumnComponent
          key={o.columns[i].key}
          index={i}
          self={o}
        />
      );
    }

    return columnsElements;
  }

  return o;
}