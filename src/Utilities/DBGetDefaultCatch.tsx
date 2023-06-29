import { IPageContent } from "./types";
import { NavigateFunction } from "react-router-dom";
import PageLocations from "./PageLocations";

export default function DBGetDefaultCath(
  error: any,
  content: IPageContent,
  setContent: React.Dispatch<React.SetStateAction<IPageContent>>,
  navigate: NavigateFunction
){
  if(!content.todoBien) return;

  let message : string = error.message;
  let contenido: IPageContent = {element:<></>, todoBien:false};
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
    navigate(PageLocations.MainPage);
  }, 3000);
}