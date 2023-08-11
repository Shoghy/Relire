import { MainPage } from "./PageLocations";
import { NavigateFunction } from "react-router-dom";

export default function DBGetDefaultCath(
  error: Error | null,
  errorElement: React.JSX.Element | undefined,
  setErrorElement: React.Dispatch<React.SetStateAction<React.JSX.Element | undefined>>,
  navigate: NavigateFunction
){
  if(errorElement) return;

  let message = error ? error.message : "";
  let contenido: React.JSX.Element | undefined = undefined;
  switch(message){
    case "Permission denied":{
      contenido = <h1>No tienes permiso para acceder a esta base de datos</h1>
      break;
    }
    default:{
      contenido = <h1>Algo salió mal</h1>;
      break;
    }
  }

  setErrorElement(contenido);
  setTimeout(() => {
    navigate(MainPage);
  }, 3000);
}