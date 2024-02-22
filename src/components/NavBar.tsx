import { auth } from "@/utilities/DBclient";
import { LogIn, MainPage } from "@/utilities/PageLocations";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const [showLogOut, setShowLogOut] = useState(false);

  function LogOut(){
    auth.signOut();
    navigate(LogIn);
  }

  async function CheckUserStatus(){
    await auth.authStateReady();
    if(auth.currentUser == null){
      if(location.pathname !== "/login" && location.pathname !== "/registro"){
        navigate(LogIn);
      }
      return;
    }
    setShowLogOut(true);
  }

  useEffect(() => {
    CheckUserStatus();
  }, []);

  function LogOutComponent() {
    if(!showLogOut) return;

    return (
      <div className="log-out">
        <div onClick={() => LogOut()} style={{
          display: "inline-flex",
          cursor: "pointer"
        }}>

          <div className="peach-circle" style={{
            height: 18,
            marginRight: 3
          }}></div>
          <span>LogOut</span>
        </div>
      </div>
    );
  }

  return (
    <nav
      className="nav-bar"
    >
      <div
        className="logo-container"
        onClick={() => navigate(MainPage)}
      >
        <span>RELIRE</span>
        <img src="/svgs/Flechas.svg" height={70} />
      </div>
      <LogOutComponent/>
    </nav>
  );
}