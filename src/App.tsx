import {Route, Routes, Link} from "react-router-dom";
import FormComponent from "./components/FormComponent";

export default function App(){
  return <Routes>
    <Route
    path="/"
    element={<h1><Link to="/adios-mundo">Hola mundo</Link></h1>}
    />
    <Route
    path="/adios-mundo"
    element={<h1><Link to="/">Adiós mundo</Link></h1>}
    />
    <Route
    path="/prueba"
    element={<FormComponent>
      <h1></h1>
      <h2></h2>
      <p></p>
    </FormComponent>}
    />
  </Routes>
}
