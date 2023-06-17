import { Route, Routes } from "react-router-dom";
import LogInForm from "./pages/LogIn";
import Main from "./pages/Main";

export default function App(){
  return <Routes>
    <Route
    path="/"
    element={<Main/>}
    />
    <Route
    path="/login"
    element={<LogInForm/>}/>
  </Routes>
}
