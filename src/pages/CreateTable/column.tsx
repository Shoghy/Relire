import XButton from "@/components/x_btn";
import styles from "./create_table.module.css";
import { CreateColumnInfo, CreateForeignKey } from ".";
import { useEffect, useState } from "react";
import { ColumnType, Dictionary } from "@/utilities/types";
import { GetEnumValues, RandomString, RemoveIndexOfArray, TitleCase } from "../../utilities/functions";
import ColumnInput from "@/components/ColumnInput";
import CheckButton from "@/components/check_button";

export interface ColumnComponentProps {
  index: number
  readonly self: SelfColumnComponentObject
}

const ColumTypeArray = Object.values(ColumnType);
function ColumnComponent({
  index, self
}: ColumnComponentProps) {
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

    return num;
  }

  function ShowDefaultInput() {
    if (!column.useDefault) return false;
    if (column.useForeingKey) {
      return column.foreingKey.column !== "" && column.foreingKey.tableName !== "";
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
        if (column.columnType !== type) return;
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
              onChange={(e) => SetColumnInfo("enum", e.currentTarget.value)}
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
        <div>Use Default</div>
        <CheckButton
          style={{ backgroundColor: "var(--nyanza)" }}
          value={column.useDefault}
          onClick={() => SetColumnInfo("useDefault", !column.useDefault)}
        />
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
              value={column.useDefault}
              onClick={() => SetColumnInfo("useDefault", !column.useDefault)}
            />
          </>
        }
        {
          column.useForeingKey
          &&
          <>
            <div>Table Name</div>
            <select
              value={column.foreingKey.column}
            >
              <option value={""}></option>
            </select>
          </>
        }
      </div>
      <XButton onClick={() => DeleteColumn()} />
    </div>
  );
}

interface ShowColumnsProps {
  foreignUniqueColumns: Dictionary<CreateForeignKey[]>
}

interface SelfColumnComponentObject {
  columns: CreateColumnInfo[]
  ShowColumns(props: ShowColumnsProps): React.JSX.Element[]
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

  function ShowColumns({ foreignUniqueColumns }: ShowColumnsProps) {
    const [, update] = useState(false);
    o.Update = () => update((c) => !c);
    o.foreignUniqueColumns = foreignUniqueColumns;

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