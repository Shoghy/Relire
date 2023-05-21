import {Route, Routes} from "react-router-dom";
import FormComponent, { ValidationResults } from "./components/FormComponent";
import { InputText, InputState, InputPassword, InputEmail } from "./components/FormInputs";
import { useState } from "react";

export default function App(){
  const [nombre, setNombre] = useState<InputState<string>>({value:""});
  const [apellido, setApellido] = useState<InputState<string>>({value:""});
  const [email, setEmail] = useState<InputState<string>>({value:""});

  function onValidate(results: ValidationResults){
    if(results.success){
      console.log("hola mundo")
    }else{
      console.log(results.errors)
    }
  }

  return <Routes>
    <Route
    path="/"
    element={<FormComponent onValidate={onValidate}>
      <InputPassword required={true} setState={setNombre} state={nombre} name="Hola perros"/>
      <button></button>
      <div>
        <InputText required={false} state={apellido} setState={setApellido}/>
        <h1>Hola perros</h1>
        <InputEmail required={false} state={email} setState={setEmail}/>
      </div>
    </FormComponent>}
    />
  </Routes>
}
