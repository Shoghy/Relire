import { auth } from "../utilities/DBclient";

export default function NavBar(){
  function btnLogOut(){
    auth.signOut();
  }

  return (
    <nav
      className="nav-bar"
      title="Despite everything, it's still You."
    >
      <i
        className="fa fa-user-circle-o"
        aria-hidden="true"
        style={{
          fontSize: "1.7em",
          color: "var(--peach)"
        }}
      />
      <button onClick={btnLogOut} className="btn">Log Out</button>
    </nav>
  );
}