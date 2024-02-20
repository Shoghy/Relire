import XButton from "@/components/x_btn";
import styles from "./create_table.module.css";
import { CreateColumnInfo } from ".";
import { useState } from "react";
import { ColumnType } from "@/utilities/types";
import { RandomString, RemoveIndexOfArray, TitleCase } from "../../utilities/functions";

export interface ColumnComponentProps{
  index: number
  readonly self: SelfColumnComponentObject
}

const ColumTypeArray = Object.values(ColumnType);
function ColumnComponent({
  index, self
}: ColumnComponentProps){
  const [column, setColumn] = useState(self.columns[index]);

  function SetColumnInfo<K extends keyof CreateColumnInfo>(key: K, value: CreateColumnInfo[K]){
    setColumn((current) => {
      current[key] = value;
      return {...current};
    });
  }

  function DeleteColumn(){
    self.columns = RemoveIndexOfArray(self.columns, index);
    self.Update();
  }

  function OnTypeChange(value: ColumnType){
    SetColumnInfo("useForeingKey", false);
    SetColumnInfo("type", value as ColumnType);
    SetColumnInfo("default", "");
    if(value === ColumnType.ENUM || value === ColumnType.BOOL){
      SetColumnInfo("unique", false);
    }
  }

  function Unique(){
    if (column.type === ColumnType.ENUM || column.type === ColumnType.BOOL) return <></>;
    return (
      <>
        <div>Unique</div>
        <CheckButton
          value={column.unique}
          onClick={() => SetColumnInfo("unique", !column.unique)}
        />
      </>
    );
  }

  function AutoIncrement(){
    if(column.type !== ColumnType.INT) return<></>;
    return (
      <>
        <div>Auto Increment</div>
        <CheckButton
          value={column.autoIncrement}
          onClick={() => SetColumnInfo("unique", !column.autoIncrement)}
        />
      </>
    );
  }

  return (
    <div className={styles["column-background"]}>
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
        <AutoIncrement/>
        {
          column.type === ColumnType.ENUM
          &&
          <>
            <div>Enum Values</div>
            <input
              type="text"
              value={column.enum}
              onChange={(e) => SetColumnInfo("enum", e.currentTarget.value)}
            />
          </>
        }
        <Unique/>
        <div>Not Null</div>
        <CheckButton
          value={column.notNull}
          onClick={() => SetColumnInfo("notNull", !column.notNull)}
        />
        <div>Use Default</div>
        <CheckButton
          value={column.useDefault}
          onClick={() => SetColumnInfo("useDefault", !column.useDefault)}
        />
      </div>
      <XButton onClick={() => DeleteColumn()}/>
    </div>
  );
}

interface CheckButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "style">{
  value: boolean
}

function CheckButton({value, className = "", ...props}: CheckButtonProps){
  return (
    <button
      className={`${styles["check-btn"]} ${className}`}
      style={{
        color: value ? "#DABA12" : "#222925"
      }}
      {...props}
    >
      <i className={`fa ${value ? "fa-check" : "fa-times"}`} aria-hidden="true"></i>
    </button>
  );
}

interface SelfColumnComponentObject{
  columns: CreateColumnInfo[]
  ShowColumns(): React.JSX.Element[]
  Update: () => void
  AddNewColumn(): void
}

export function selfColumnComponent(){
  const o: SelfColumnComponentObject = {
    columns: [],
    ShowColumns,
    Update: () => {return;},
    AddNewColumn
  };

  function AddNewColumn(){
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

  function ShowColumns(){
    const [, update] = useState(false);
    o.Update = () => update((c)=>!c);

    const columnsElements: React.JSX.Element[] = [];

    for(let i = 0; i < o.columns.length; ++i){
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