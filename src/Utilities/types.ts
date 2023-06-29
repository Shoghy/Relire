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

export interface IColumn{
  type: ColumnType,
  notNull: boolean,
  default?: string | boolean | number,
  unique: boolean,
  foreingKey?: IForeingKey,
  enum?: string[]
}

export interface IForeingKey{
  tableName: string,
  column: string
}

export interface IPageContent{
  element: React.JSX.Element,
  todoBien: boolean
}