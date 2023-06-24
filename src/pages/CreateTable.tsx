import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { auth, realtimeDB } from "../DBclient";

export default function CreateTable(){
  const navigate = useNavigate();

  return (
    <>
    <NavBar/>
    </>
  )
}