import {Route, Routes} from "react-router-dom";
import FormComponent from "./components/FormComponent";
import { InputText, InputState } from "./components/FormInputs";
import { useState } from "react";

export default function App(){
  const [nombre, setNombre] = useState<InputState<string>>({value:""});
  const [apellido, setApellido] = useState<InputState<string>>({value:""});

  return <Routes>
    <Route
    path="/"
    element={<FormComponent>
      <InputText required={true} setState={setNombre} state={nombre} name="Hola perros" maxLength={150}/>
      <button></button>
      <div>
        <InputText required={false} state={apellido} setState={setApellido}/>
        <h1>Hola perros</h1>
      </div>
    </FormComponent>}
    />
  </Routes>
}
