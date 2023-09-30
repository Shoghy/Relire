export interface Dictionary<T> {
  [Key: string]: T;
}

export interface IDataBase{
  author:string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<TableRow>
}

export enum ColumnType{
  /**Plain text */
  STRING = "string",
  /**Numbers without decimal part */
  INT = "int",
  /**Numbers with decimal part */
  FLOAT = "float",
  /**True or False values */
  BOOL = "bool",
  /**DD/MM/YYYY */
  DATE = "date",
  /**DD/MM/YYYY HH:mm */
  DATETIME = "datetime",
  /**Confines the value of the variable to a limited number of options */
  ENUM = "enum"
}

export type ColumnValue = string | number | boolean;

export interface IApiRequest extends Dictionary<any>{
  auth: string,
  type: "user" | "key"
}

export interface DefaultReturnedError extends Error{
  code: string
}

export interface IApiResponse extends Dictionary<any>{
  ok: boolean,
  error?: DefaultReturnedError
}

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