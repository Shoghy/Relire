import { ColumnType, ColumnValue, IColumn, IForeingKey, TableRow } from "../utilities/types";
import { RandomString, TitleCase } from "../utilities/functions";
import React, { useEffect, useState } from "react";
import { auth, database } from "../utilities/DBclient";
import { get, ref } from "firebase/database";
import { useParams } from "react-router-dom";

export interface IColumnToInput {
  column: IColumn,
  value: ColumnValue,
  setValue: (value: ColumnValue) => any,
  props?: React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>
}

export default function ColumnInput({ column, value, setValue, props }: IColumnToInput) {
  if (props === undefined) {
    props = {};
  }

  props.value = value as string;
  props.onChange = (e) => setValue((e as React.ChangeEvent<HTMLInputElement>).target.value)

  if (column.foreingKey) {
    return ForeingKeyColumn({ column, value, setValue, props });
  }

  switch (column.type) {
    case ColumnType.BOOL: {
      props.type = "checkbox";
      props.checked = value as boolean;
      props.value = undefined;
      props.onChange = (e) => setValue((e as React.ChangeEvent<HTMLInputElement>).target.checked)
      break;
    }
    case ColumnType.DATE: {
      props.type = "date";
      break;
    }
    case ColumnType.DATETIME: {
      props.type = "datetime-local";
      break;
    }
    case ColumnType.ENUM: {
      props.type = undefined;
      let key = RandomString(6);
      return (
        <select {...props} key={key}>
          {!column.notNull && <option value="" key={`$Nada-${key}`}></option>}
          {(() => {
            if (column.enum === undefined) return <></>;
            let options: React.JSX.Element[] = [];

            column.enum.forEach((value, index) => {
              options.push(<option value={value} key={`${index}-${key}`}>{TitleCase(value)}</option>)
            });

            return options
          })()}
        </select>
      )
    }
    case ColumnType.FLOAT: {
      props.type = "number";
      props.onChange = (e) => {
        e = e as React.ChangeEvent<HTMLInputElement>;
        if (e.target.value === "") setValue(e.target.value);

        if (isNaN(parseFloat(e.target.value))) {
          let character = e.target.value[e.target.value.length - 1];
          if (character !== ".") return;
        }
        setValue(e.target.valueAsNumber);
      }
      break;
    }
    case ColumnType.INT: {
      props.type = "number";
      props.onChange = (e) => {
        e = e as React.ChangeEvent<HTMLInputElement>;
        if (e.target.value === "") setValue(e.target.value);
        let value = parseInt(e.target.value);
        if (isNaN(value)) return;
        setValue(value);
      }
      break;
    }
    case ColumnType.STRING: {
      props.type = "text";
      break;
    }
  }
  return <input {...props} />
}

function ForeingKeyColumn({ column, props }: IColumnToInput) {
  const [options, setOptions] = useState<React.ReactNode[]>([]);
  const params = useParams();

  useEffect(() => {
    if (!column.notNull) {
      setOptions((current) => {
        current.push(<option value={""} key={"nullValue"}></option>)
        return [...current];
      });
    }
    Start();
  }, []);

  async function Start() {
    await auth.authStateReady();
    let foreignKey = column.foreingKey as IForeingKey;
    let tableData: TableRow = (await get(
      ref(database, `${auth.currentUser?.uid}/${params.idDB}/tablesData/${foreignKey.tableName}`)
    )).val();

    let options: React.ReactNode[] = [];
    for (let rowUID in tableData) {
      let row = tableData[rowUID];
      options.push(
        <option value={`${row[foreignKey.column]}`} key={rowUID}>
          {row[foreignKey.column]}
        </option>
      )
    }
    setOptions(options);
  }

  return (
    <select {...props} >
      {options}
    </select>
  )
}