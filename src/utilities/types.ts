export interface Dictionary<T> {
  [Key: string]: T;
}

export interface IDataBase{
  author:string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<TableRow>
}

export type ColumnType = "string" | "int" | "float" | "bool" | "date" | "datetime" | "enum";

export type ColumnValue = string | number | boolean;

export interface IColumn{
  type: ColumnType,
  notNull: boolean,
  default?: ColumnValue,
  unique: boolean,
  foreingKey?: IForeingKey,
  enum?: string[],
  autoIncrement?: boolean
}

//                     UID        Column     Value
export type TableRow = Dictionary<Dictionary<ColumnValue>>;

export interface IForeingKey{
  tableName: string,
  column: string
}

export interface IErrorElement{
  element: React.JSX.Element,
  todoBien: boolean
}

export type AsyncFunc<T> = (... args: any) => Promise<T>;