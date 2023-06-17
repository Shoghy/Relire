import { useNavigate } from "react-router-dom";
import { logOut } from "../DBclient";
import PageLocations from "./PageLocations";

export default function NavBar(){
  const navigate = useNavigate();

  function btnLogOut(){
    logOut()
    .then(() => {
      navigate(PageLocations.LogIn);
    });
  }

  return (
    <nav>
      <img src="#" alt=""/>
      <button onClick={btnLogOut}>Log Out</button>
    </nav>
  );
}