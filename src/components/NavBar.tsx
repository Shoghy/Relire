import { logOut } from "../DBclient";

export default function NavBar(){
  function btnLogOut(){
    logOut();
  }

  return (
    <nav>
      <button onClick={btnLogOut}>Log Out</button>
    </nav>
  );
}