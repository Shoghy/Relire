import {Route, Routes, Navigate} from "react-router-dom";
import LogInForm from "./pages/LogIn";

export default function App(){
  return <Routes>
    <Route
    path="/"
    element={<Navigate replace to={"/login"}/>}
    />
    <Route
    path="/login"
    element={<LogInForm/>}/>
  </Routes>
}
