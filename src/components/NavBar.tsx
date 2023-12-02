import { auth } from "../utilities/DBclient";

export default function NavBar(){
  function btnLogOut(){
    auth.signOut();
  }

  return (
    <nav className="nav-bar">
      <div></div>
      <button onClick={btnLogOut} className="btn">Log Out</button>
    </nav>
  );
}