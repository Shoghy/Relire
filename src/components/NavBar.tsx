import { auth } from "../utilities/DBclient";

export default function NavBar(){
  function btnLogOut(){
    auth.signOut();
  }

  return (
    <nav
      className="nav-bar"
    >
      <div className="logo-container">
        
      </div>
    </nav>
  );
}