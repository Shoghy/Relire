import { ColumnValue, IColumn } from "../utilities/types";
import { RandomString, TitleCase } from "../utilities/functions";
import React from "react";

export interface IColumnToInput{
  column: IColumn,
  value: ColumnValue,
  setValue: (value: ColumnValue) => any,
  props?: React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>
}

export default function ColumnInput({column, value, setValue, props}: IColumnToInput) {
  if(props === undefined){
    props = {};
  }
  props.value = value as string;
  props.onChange = (e) => setValue((e as React.ChangeEvent<HTMLInputElement>).target.value)

  switch (column.type) {
    case "bool": {
      props.type = "checkbox";
      props.checked = value as boolean;
      props.value = undefined;
      props.onChange = (e) => setValue((e as React.ChangeEvent<HTMLInputElement>).target.checked)
      break;
    }
    case "date": {
      props.type = "date";
      break;
    }
    case "datetime": {
      props.type = "datetime-local";
      break;
    }
    case "enum":{
      props.type = undefined;
      props.onChange = (e) => setValue((e as React.ChangeEvent<HTMLSelectElement>).target.value)
      let key = RandomString(6);
      return (
        <select {... props} key={key}>
          {!column.notNull && <option value="" key={`$Nada-${key}`}></option>}
          {(() => {
            if(column.enum === undefined) return <></>;
            let options: React.JSX.Element[] = [];

            column.enum.forEach((value, index) => {
              options.push(<option value={value} key={`${index}-${key}`}>{TitleCase(value)}</option>)
            });

            return options
          })()}
        </select>
      )
    }
    case "float":{
      props.type = "number";
      props.onChange = (e) => {
        e = e as React.ChangeEvent<HTMLInputElement>;
        if(e.target.value === "") setValue(e.target.value);

        if(isNaN(parseFloat(e.target.value))){
          let character = e.target.value[e.target.value.length-1];
          if(character !== ".") return;
        }
        setValue(e.target.valueAsNumber);
      }
      break;
    }
    case "int":{
      props.type = "number";
      props.onChange = (e) => {
        e = e as React.ChangeEvent<HTMLInputElement>;
        if(e.target.value === "") setValue(e.target.value);
        let value = parseInt(e.target.value);
        if(isNaN(value)) return;
        setValue(value);
      }
      break;
    }
    case "string":{
      props.type = "text";
      break;
    }
  }
  return <input {... props}/>
}