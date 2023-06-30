export interface Dictionary<T> {
  [Key: string]: T;
}

export interface IDataBase{
  author:string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<Dictionary<Dictionary<unknown>>>
}

export type ColumnType = "string" | "int" | "float" | "bool" | "date" | "datetime" | "enum";

export type ColumValue = string | number | boolean;

export interface IColumn{
  type: ColumnType,
  notNull: boolean,
  default?: ColumValue,
  unique: boolean,
  foreingKey?: IForeingKey,
  enum?: string[],
  autoIncrement?: boolean
}

export type ITableInsert = Dictionary<Dictionary<ColumValue>>;

export interface IForeingKey{
  tableName: string,
  column: string
}

export interface IErrorElement{
  element: React.JSX.Element,
  todoBien: boolean
}