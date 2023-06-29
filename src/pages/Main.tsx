import { useNavigate, Link } from "react-router-dom";
import { auth } from "../DBclient";
import PageLocations from "../Utilities/PageLocations";
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
      <Link to="/db/prueba" className="btn">Prueba</Link>
      <button className="btn"><i className="fa fa-plus-circle" aria-hidden="true"></i></button>
    </>
  )
}