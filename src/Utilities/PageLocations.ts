const PageLocations = {
  LogIn: "/login",
  MainPage: "/",
  db: (db:string) => {
    return `db/${db}`
  }
};

export default PageLocations;