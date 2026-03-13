import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import "../styles/components/public-header.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/components/liquid-glass.css";

import LoginModal from "../components/modals/LoginModal";
import SignupModal from "../components/modals/SignupModal";
import { useAuth } from "../state/authStore";

import Logo from "../components/ui/Logo";
import PublicNav from "../components/ui/PublicNav";
import Avatar from "../components/ui/Avatar";
import ProfileDropdown from "../components/ui/ProfileDropdown";
import Chatbot from "../components/ai/Chatbot";

export default function PublicLayout() {
  const [authModal, setAuthModal] = useState(null);
  const {
    user,
    loading,
    logout,
    justLoggedOut,
    clearJustLoggedOut,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const showChatbot = location.pathname !== "/test";

  // Pages that use transparent + glass header
  const overlayHeaderPages = ["/", "/about", "/contact", "/profile"];
  const useOverlayHeader = overlayHeaderPages.includes(location.pathname);

  // 🔹 NEW: react to logout signal
  useEffect(() => {
    if (justLoggedOut) {
      setAuthModal("login");
      navigate("/", { replace: true });
      clearJustLoggedOut();
    }
  }, [justLoggedOut, navigate, clearJustLoggedOut]);

  return (
    <>
      <header className={`header ${useOverlayHeader ? "header-overlay" : ""}`}>
        <div className="header-inner">
          <Logo />
          <PublicNav />

          <div className="header-buttons">
            {loading && (
              <button className="profile-btn" disabled>
                <Avatar loading />
              </button>
            )}

            {!loading && !user && (
              <button className="btn" onClick={() => setAuthModal("login")}>
                Login
              </button>
            )}

            {!loading && user && (
              <ProfileDropdown
                trigger={
                  <button className="profile-btn">
                    <Avatar name={user.displayName || user.email} />
                  </button>
                }
                onViewProfile={() => navigate("/profile")}
                onLogout={async () => {
                  await logout();
                  navigate("/");
                }}
              />
            )}
          </div>
        </div>
      </header>

      <Outlet />

      {authModal === "login" && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSignup={() => setAuthModal("signup")}
        />
      )}

      {authModal === "signup" && (
        <SignupModal
          onClose={() => setAuthModal(null)}
          onLogin={() => setAuthModal("login")}
        />
      )}
      {showChatbot && <Chatbot />}
    </>
  );
}
