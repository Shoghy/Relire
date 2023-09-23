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

export interface ExtraFields<T>
  extends
React.InputHTMLAttributes<HTMLInputElement & HTMLSelectElement> {
  columnName: string,
  columnValue: T,
  setColumnValue: (value: T) => any,
  [key: string]: any
}

export interface VerifyReturn{
  bien: boolean,
  error?: string,
  value?: any
}

export class ColumnType extends React.Component<ExtraFields<any>>{
  static types: ColumnDerived[] = [];
  static typeName = "";
  static canBeUnique = true;
  name = ""

  constructor(props: ExtraFields<any>) {
    super(props);
  }

  verify(_: TableRow): VerifyReturn {
    return {
      bien: true
    }
  }

  render(): React.ReactNode {
    return null
  }
}

export type ColumnDerived = typeof ColumnType;

export class IntColumn extends ColumnType{
  static dummy = ColumnType.types.push(this);
  static typeName: string = "int";

  autoIncrement = ({columnValue, setColumnValue, columnName, ...props}: ExtraFields<boolean>) => {
    let onChange = props.onChange;

    if(typeof columnValue !== "boolean"){
      setColumnValue(false);
      return;
    }

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

  constructor(props: ExtraFields<string>) {
    super(props);
  }

  verify(tableRows: TableRow): VerifyReturn {
    if(this.props.columnValue === ""){
      if(!this.props["autoIncrement"]){
        return {
          bien: false,
          error: "Null value"
        }
      }

      let maxValue = Number.NEGATIVE_INFINITY;
      let columnName = this.props.columnName;
      for(let rowUID in tableRows){
        let row = tableRows[rowUID];
        if(row[columnName] as number > maxValue){
          maxValue = row[columnName] as number;
        }
      }

      return {
        bien: true,
        value: ++maxValue
      }
    }

    let returnValue: VerifyReturn = {
      bien: !isNaN(parseInt(this.props.columnValue))
    }
    if(!returnValue.bien){
      returnValue.error = "Value is not a number";
    }
    return returnValue;
  }

  render() {
    let { columnValue, setColumnValue, columnName, ... props } = this.props;

    let onChange = props.onChange;
    props.onChange = (e) => {
      if(onChange) onChange(e);
      if(e.defaultPrevented) return;
      
      if (e.target.value === "") setColumnValue(e.target.value as any);
      let value = parseInt(e.target.value);
      if (isNaN(value)) return;
      setColumnValue(value.toString());
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