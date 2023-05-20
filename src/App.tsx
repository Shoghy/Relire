import {Route, Routes} from "react-router-dom";
import FormComponent from "./components/FormComponent";
import { InputText, InputState } from "./components/FormInputs";
import { useState } from "react";

export default function App(){
  const [state, setState] = useState<InputState<string>>({value:""});
  return <Routes>
    <Route
    path="/"
    element={<FormComponent>
      <InputText required={true} setState={setState} state={state} name="Hola perros"/>
      <div>
        <h1>Hola perros</h1>
      </div>
    </FormComponent>}
    />
  </Routes>
}
