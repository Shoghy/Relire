const PageLocations = {
  LogIn: "/login",
  MainPage: "/",
  DB: (db:string) => {
    if(!db) return "";
    return `/db/${db}`;
  },
  DBTableCreate: (db:string) => {
    if(!db) return "";
    return `/db/${db}/create-table`;
  },
  DataInTable: (db: string, table: string) => {
    if(!db || !table) return "";
    return `/db/${db}/${table}`;
  }
};

export default PageLocations;