import { ColumnType, ColumnValue } from "@/utilities/types";
import { RandomString, TitleCase } from "@/utilities/functions";
import { CSSProperties } from "react";
import CheckButton from "./check_button";

export interface IColumnToInput {
  type: ColumnType
  value: ColumnValue
  setValue: (val: ColumnValue) => any
  notNull?: boolean
  Enum?: string[]
  className?: string
  style?: CSSProperties
}

export default function ColumnInput({ type, setValue, value, Enum = [], notNull = false, ...props}: IColumnToInput) {
  let inputType: React.HTMLInputTypeAttribute = "text";
  let onChange = (e: React.ChangeEvent<HTMLInputElement & HTMLSelectElement>) => setValue((e).currentTarget.value);

  switch (type) {
    case ColumnType.BOOL: {
      return (
        <CheckButton
          value={value as boolean}
          onClick={() => setValue(!value)}
          {...props}
        />
      );
    }
    case ColumnType.DATE: {
      inputType = "date";
      break;
    }
    case ColumnType.DATETIME: {
      inputType = "datetime-local";
      break;
    }
    case ColumnType.ENUM: {
      const key = RandomString(6);
      return (
        <select
          key={key}
          value={value as string}
          onChange={onChange}
          {...props}
        >
          {!notNull && <option value="" key={`$Nada-${key}`}></option>}
          {(() => {
            const options: React.JSX.Element[] = [];

            Enum.forEach((value, index) => {
              options.push(<option value={value} key={`${index}-${key}`}>{TitleCase(value)}</option>);
            });

            return options;
          })()}
        </select>
      );
    }
    case ColumnType.FLOAT: {
      inputType = "number";
      onChange = (e) => {
        if (e.currentTarget.value === "") setValue(e.currentTarget.value);

        if (isNaN(parseFloat(e.currentTarget.value))) {
          const character = e.currentTarget.value[e.currentTarget.value.length - 1];
          if (character !== ".") return;
        }
        setValue(e.currentTarget.valueAsNumber);
      };
      break;
    }
    case ColumnType.INT: {
      inputType = "number";
      onChange = (e) => {
        if (e.currentTarget.value === "") setValue(e.currentTarget.value);
        const value = parseInt(e.currentTarget.value);
        if (isNaN(value)) return;
        setValue(value);
      };
      break;
    }
    case ColumnType.STRING: {
      inputType = "text";
      break;
    }
  }
  return (
    <input
      type={inputType}
      onChange={onChange}
      value={value as string}
      {...props}
    />
  );
}