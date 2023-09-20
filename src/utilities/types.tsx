import React from "react";

export interface Dictionary<T> {
  [Key: string]: T;
}

export interface IDataBase {
  author: string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<TableRow>
}

interface ExtraFields<T> extends React.InputHTMLAttributes<HTMLInputElement & HTMLSelectElement> {
  columnValue: T,
  setColumnValue: (value: T) => any,
}


export class ColumnType<T> extends React.Component<ExtraFields<T>>{
  static types: ColumnDerived[] = [];
  static typeName = "";
  static canBeUnique = true;

  constructor(props: ExtraFields<T>) {
    super(props);
  }

  verify() {
    return true
  }

  render(): React.ReactNode {
    return null
  }
}

export type ColumnDerived = typeof ColumnType;

export class IntColumn extends ColumnType<number>{
  static dummy = ColumnType.types.push(this as any);
  static typeName: string = "int";

  autoIncrement = ({columnValue, setColumnValue, ...props}: ExtraFields<boolean>) => {
    let onChange = props.onChange;

    props.onChange = (e) => {
      if (onChange) onChange(e);
      if (e.defaultPrevented) return;
      setColumnValue(e.target.checked);
    }

    return (
      <input type="checkbox"
        checked={columnValue}
        {...props}
      />
    )
  }

  constructor(props: ExtraFields<number>) {
    super(props);
  }

  verify(): boolean {
    return !isNaN(parseInt(`${this.props.columnValue}`));
  }

  render() {
    let { columnValue, setColumnValue, ... props } = this.props;

    let onChange = props.onChange;
    props.onChange = (e) => {
      if(onChange) onChange(e);
      if(e.defaultPrevented) return;
      
      if (e.target.value === "") setColumnValue(e.target.value as any);
      let value = parseInt(e.target.value);
      if (isNaN(value)) return;
      setColumnValue(value);
    }

    return (
      <input
        type="number"
        value={columnValue}
        {... props}
      />
    )
  }
}

export type ColumnTypeString = "string" | "int" | "float" | "bool" | "date" | "datetime" | "enum";

export type ColumnValue = string | number | boolean;

export interface IApiRequest extends Dictionary<any> {
  auth: string,
  type: "user" | "key"
}

export interface DefaultReturnedError extends Error {
  code: string
}

export interface IApiResponse extends Dictionary<any> {
  ok: boolean,
  error?: DefaultReturnedError
}

export interface IColumn {
  type: ColumnTypeString,
  notNull: boolean,
  default?: ColumnValue,
  unique: boolean,
  foreingKey?: IForeingKey,
  enum?: string[],
  autoIncrement?: boolean
}

//                     UID        Column     Value
export type TableRow = Dictionary<Dictionary<ColumnValue>>;

export interface IForeingKey {
  tableName: string,
  column: string
}

export interface IErrorElement {
  element: React.JSX.Element,
  todoBien: boolean
}

export type AsyncFunc<T> = (...args: any) => Promise<T>;