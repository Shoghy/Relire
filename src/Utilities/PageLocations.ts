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
  }
};

export default PageLocations;