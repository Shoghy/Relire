import { Route, Routes } from "react-router-dom";
import LogInForm from "./pages/LogIn";
import Main from "./pages/Main";
import DescribeDB from "./pages/DescribeDB";
import CreateTable from "./pages/CreateTable";
import DataInTable from "./pages/DataInTable";
import InsertInTable from "./pages/InsertInTable";
import RegistroPage from "./pages/registro";

export default function App(){
  return(
    <Routes>
      <Route
        path="/"
        element={<Main/>}
      />
      <Route
        path="/login"
        element={<LogInForm/>}
      />
      <Route
        path="/registro"
        element={<RegistroPage/>}
      />
      <Route
        path="/db/:idDB"
        element={<DescribeDB/>}
      />
      <Route
        path="/db/:idDB/create-table"
        element={<CreateTable/>}
      />
      <Route
        path="/db/:idDB/t/:tbName"
        element={<DataInTable/>}
      />
      <Route
        path="/db/:idDB/t/:tbName/insert"
        element={<InsertInTable/>}
      />
    </Routes>
  );
}
