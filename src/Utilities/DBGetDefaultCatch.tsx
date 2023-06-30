import { MainPage } from "./PageLocations";
import { IErrorElement } from "./types";
import { NavigateFunction } from "react-router-dom";

export default function DBGetDefaultCath(
  error: any,
  content: IErrorElement,
  setContent: React.Dispatch<React.SetStateAction<IErrorElement>>,
  navigate: NavigateFunction
){
  if(!content.todoBien) return;

  let message : string = error.message;
  let contenido: IErrorElement = {element:<></>, todoBien:false};
  switch(message){
    case "Permission denied":{
      contenido.element = (
        <h1>No tienes permiso para acceder a esta base de datos</h1>
      );
      break;
    }
    default:{
      contenido.element = (
        <h1>Algo salió mal</h1>
      );
      break;
    }
  }

  setContent(contenido);
  setTimeout(() => {
    navigate(MainPage);
  }, 3000);
}