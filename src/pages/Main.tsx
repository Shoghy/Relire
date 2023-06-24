import { useNavigate } from "react-router-dom";
import { auth } from "../DBclient";
import PageLocations from "../components/PageLocations";
import NavBar from "../components/NavBar";

export default function Main(){
  const navigate = useNavigate();

  auth.onAuthStateChanged((user) => {
    if(user === undefined || user === null){
      navigate(PageLocations.LogIn);
    }
  });
  return (
    <>
      <NavBar/>
      <button onClick={() => {
        navigate("/db/prueba")
      }}>Prueba</button>
      <button><i className="fa fa-plus-circle" aria-hidden="true"></i></button>
    </>
  )
}