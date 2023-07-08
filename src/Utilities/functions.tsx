import { ColumValue, IColumn } from "./types";
import React from "react";

export function TitleCase(val: string): string {
  val = val.toLowerCase();
  let words = val.split(" ");

  let text: string = "";
  words.forEach((value, index) => {
    text += value.charAt(0).toUpperCase() + value.slice(1);
    if (index + 1 < words.length) text += " ";
  })
  return text;
}

export function GetEnumValues(val: string): string[] {
  if (!val) return [];

  let vals = val.split(",");
  let uniqueVals: string[] = [];
  vals.forEach((value) => {
    while (value.startsWith(" ")) {
      value = value.substring(1);
    }
    if (uniqueVals.indexOf(value) === -1) uniqueVals.push(value)
  })
  return uniqueVals;
}

export function RandomString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

interface IColumnToInput{
  column: IColumn,
  value: ColumValue,
  setValue: (value: ColumValue) => any,
  props?: React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>
}

export function ColumnToInput({column, value, setValue, props}: IColumnToInput) {
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
        if(isNaN(parseInt(e.target.value))) return;
        setValue(e.target.value);
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