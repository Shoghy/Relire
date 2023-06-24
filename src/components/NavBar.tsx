import { logOut } from "../DBclient";

export default function NavBar(){
  function btnLogOut(){
    logOut();
  }

  return (
    <nav className="nav-bar">
      <div></div>
      <button onClick={btnLogOut}>Log Out</button>
    </nav>
  );
}