export const LogIn = "/login";

export const MainPage = "/";

export const DB = (db:string) => {
  if(!db) return "";
  return `/db/${db}`;
}

export const DBTableCreate = (db:string) => {
  if(!db) return "";
  return `/db/${db}/create-table`;
}

export const DataInTable = (db: string, table: string) => {
  if(!db || !table) return "";
  return `/db/${db}/t/${table}`;
}