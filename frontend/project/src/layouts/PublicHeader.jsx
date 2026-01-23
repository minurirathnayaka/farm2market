import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../js/firebase";

export default function PublicHeader({
  active,
  onLoginClick,
  profileClickMode = "modal" // modal | none
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleProfileClick = () => {
    if (!user && profileClickMode === "modal") {
      onLoginClick();
    }
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <span className="logo-text">Farm2Market</span>
        </Link>

        <nav className="nav">
          <div className="nav-glass glass">
            <Link
              to="/"
              className={`nav-link ${active === "home" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`nav-link ${active === "about" ? "active" : ""}`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`nav-link ${active === "contact" ? "active" : ""}`}
            >
              Contact
            </Link>
          </div>
        </nav>

        <div className="header-buttons glass">
          {user ? (
            <div className="profile-icon">
              <img src={user.photoURL || "/avatar.png"} alt="Profile" />
            </div>
          ) : profileClickMode === "modal" ? (
            <div className="profile-icon" onClick={handleProfileClick}>
              <img src="/avatar.png" alt="Login" />
            </div>
          ) : (
            <button className="btn" onClick={onLoginClick}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
