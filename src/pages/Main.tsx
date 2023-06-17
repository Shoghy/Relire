import { useNavigate } from "react-router-dom";
import { auth } from "../DBclient";
import NavBar from "../components/navbar";
import PageLocations from "../components/PageLocations";

export default function Main(){
  const navigate = useNavigate();

  if(auth.currentUser === undefined){
    navigate(PageLocations.LogIn);
  }

  return (
    <>
      <NavBar/>
      <button></button>
    </>
  )
}