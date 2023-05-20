import {Route, Routes, NavLink} from "react-router-dom";


export default function App(){
  return <Routes>
    <Route
    path="/"
    element={<h1><NavLink to="/adios-mundo">Hola mundo</NavLink></h1>}
    />
    <Route
    path="/adios-mundo"
    element={<h1><NavLink to="/">Adiós mundo</NavLink></h1>}
    />
  </Routes>
}
