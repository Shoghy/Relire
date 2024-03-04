import XButton from "@/components/x_btn";
import styles from "./insert_in_table.module.css";
import { ColumnType, ColumnValue, Dictionary, IColumn, IForeingKey, TableRow } from "@/utilities/types";
import { ReactNode, useState } from "react";
import { RandomString } from "@/utilities/functions";
import ColumnInput from "@/components/ColumnInput";

interface ColumnProps {
  columns: [string, IColumn][]
  self: SelfRowComponentObject
  k: string,
  foreignValues: Dictionary<TableRow>
}

export function RowComponent({ columns, self, k, foreignValues }: ColumnProps) {
  const [values, setValues] = useState<Dictionary<ColumnValue>>(self.rows[k]);
  self.rows[k] = values;

  function RemoveRow(){
    delete self.rows[k];
    self.Update();
  }

  function SetCellValue(columnName: string, value: ColumnValue){
    setValues((c) => {
      c[columnName] = value;
      return {...c};
    });
  }

  function GetForeignKeyEnum(foreignKey: IForeingKey){
    const values: string[] = [];
    const table = foreignValues[foreignKey.tableName];
    for(const rowUID in table){
      const row = table[rowUID];
      const value = row[foreignKey.column];
      values.push(`${value}`);
    }
    return values;
  }

  function EnumarateColumns(){
    const elements: React.JSX.Element[] = [];
    for(const column of columns){
      const columnName = column[0];
      const columnInfo = column[1];

      elements.push(
        <div key={columnName}>{columnName}</div>
      );

      if(column[1].foreingKey){
        elements.push(
          <ColumnInput
            key={columnName + "1"}
            type={ColumnType.ENUM}
            value={values[columnName]}
            setValue={(v) => SetCellValue(columnName, v)}
            Enum={GetForeignKeyEnum(column[1].foreingKey)}
            notNull={columnInfo.notNull}
          />
        );
      }else{
        elements.push(
          <ColumnInput
            key={columnName + "1"}
            type={columnInfo.type}
            value={values[columnName]}
            setValue={(v) => SetCellValue(columnName, v)}
            Enum={columnInfo.enum}
            notNull={columnInfo.notNull}
            style={columnInfo.type === ColumnType.BOOL ? { backgroundColor: "var(--nyanza)" } : undefined}
          />
        );
      }
    }

    return elements;
  }

  return (
    <div
      className={styles["column-background"]}
      style={{
        gridRowEnd: `span ${columns.length + 2}`
      }}
    >
      <div className={styles["column-info-container"]}>
        <div>#</div>
        <div>{k}</div>
        {EnumarateColumns()}
      </div>
      <XButton onClick={() => RemoveRow()}/>
    </div>
  );
}

interface SelfRowComponentObject {
  //    Key        Column     Value
  rows: Dictionary<Dictionary<ColumnValue>>
  Element: (props: {foreignValues: Dictionary<TableRow>}) => ReactNode
  Update: () => void
  AddRow: () => void
  columnsInfo: [string, IColumn][]
}

export function selfRowComponent(){
  const o: SelfRowComponentObject = {
    rows: {},
    Element,
    Update: () => {return;},
    AddRow,
    columnsInfo: []
  };

  function AddRow(){
    const defValues: Dictionary<ColumnValue> = {};
    for(const column of o.columnsInfo){
      const columnName = column[0];
      const conlumnInfo = column[1];

      if(conlumnInfo.type === ColumnType.ENUM && conlumnInfo.notNull){
        defValues[columnName] = conlumnInfo.enum![0];
      }else if(conlumnInfo.type === ColumnType.BOOL){
        defValues[columnName] = false;
      }else{
        defValues[columnName] = "";
      }
    }
    const key = RandomString(8);
    o.rows[key] = defValues;
    o.Update();
  }

  function Element({foreignValues}: {foreignValues: Dictionary<TableRow>}){
    const [, update] = useState(true);
    o.Update = () => update((c) => !c);
    const columnsArr: React.JSX.Element[] = [];

    for(const key in o.rows){
      columnsArr.push(
        <RowComponent
          key={key}
          columns={o.columnsInfo}
          self={o}
          foreignValues={foreignValues}
          k={key}
        />
      );
    }

    return columnsArr;
  }

  return o;
}