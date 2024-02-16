import { auth } from "@/utilities/DBclient";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [showLogOut, setShowLogOut] = useState(false);
  function LogOut(){
    auth.signOut();
  }
  async function CheckUserStatus(){
    await auth.authStateReady();
    if(auth.currentUser == null) return;
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
      <div className="logo-container">
        <span>RELIRE</span>
        <img src="/svgs/Flechas.svg" height={70} />
      </div>
      <LogOutComponent/>
    </nav>
  );
}