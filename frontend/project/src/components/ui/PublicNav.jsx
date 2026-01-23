import { NavLink } from "react-router-dom";

export default function PublicNav() {
  return (
    <nav className="nav">
      <div className="nav-glass glass">
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/about" className="nav-link">
          About
        </NavLink>
        <NavLink to="/contact" className="nav-link">
          Contact
        </NavLink>
      </div>
    </nav>
  );
}
