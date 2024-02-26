export const LogIn = "/login";

export const MainPage = "/";

export const Registro = "/registro";

export function DB(db: string) {
  if (!db) return "";
  return `/db/${db}`;
}

export function DBTableCreate(db: string) {
  if (!db) return "";
  return `/db/${db}/create-table`;
}

export function DataInTable(db: string, table: string) {
  if (!db || !table) return "";
  return `/db/${db}/t/${table}`;
}

export function InsertInTable(db: string, table: string){
  if (!db || !table) return "";
  return `/db/${db}/t/${table}/insert`;
}