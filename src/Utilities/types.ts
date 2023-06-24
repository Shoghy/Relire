export interface Dictionary<T> {
  [Key: string]: T;
}

export interface IDataBase{
  author:string,
  dbName: string,
  tables?: Dictionary<Dictionary<IColumn>>,
  tablesData?: Dictionary<Dictionary<Dictionary<unknown>>>
}

export interface IColumn{
  type: "string" | "int" | "float" | "bool" | "date" | "datetime" | "enum",
  notNull: boolean,
  default?: unknown,
  special?: string[],
  foreingKey?: IForeingKey,
  enum?: unknown[]
}

export interface IForeingKey{
  tableName: string,
  column: string
}

export interface IPageContent{
  element: React.JSX.Element,
  todoBien: boolean
}