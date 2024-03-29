export interface Dictionary<T> {
  [Key: string]: T;
}

export interface BasicDBInfo {
  dbName: string,
  dbUID: string
}

export interface IDataBase {
  author: string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<TableRow>
}

export enum ColumnType {
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
  /**Confines the value to a limited number of options */
  ENUM = "enum"
}

export type ColumnValue = string | number | boolean;

export interface IApiRequest extends Dictionary<any> {
  auth: string,
  type: "user" | "key"
}

export interface DefaultReturnedError extends Error {
  code: string
}

export type IApiResponse<T = object> = T & {
  ok: boolean,
  error?: DefaultReturnedError
  [key: string]: boolean | object | string | number | undefined
}

export interface DatabaseListResponse extends IApiResponse {
  dbInfos: {
    dbUID: string,
    dbName: string
  }[]
}

export interface IColumn {
  type: ColumnType,
  notNull: boolean,
  default?: ColumnValue,
  unique: boolean,
  foreingKey?: IForeingKey,
  enum?: string[],
  autoIncrement?: boolean
}

export interface IColumForRequest extends IColumn {
  name: string
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

export type Func<A extends Array<unknown>, R> = (...args: A) => R;
export type AsyncFunc<A extends Array<unknown>, R> = Func<A, Promise<R>>;

export class CustomArray<T> extends Array<T>{
  removeIndex(index: number){
    return this.splice(index, 1)[0];
  }
  removeItem(item: T){
    const index = this.indexOf(item);
    if(index === -1) return false;
    this.removeIndex(index);
    return true;
  }
}