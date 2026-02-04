import { useAuth } from "../../state/authStore";

export default function AccountSetupGate({ children }) {
  const { loading, setupState, logout } = useAuth();

  if (!loading) return children;

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        {setupState === "network-error" && (
          <>
            <h3>Network issue</h3>
            <p>
              You appear to be offline. Please check your internet connection.
            </p>
            <div className="setup-actions">
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
              <button className="secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        )}

        {setupState === "timeout" && (
          <>
            <h3>Completing setup…</h3>
            <p>
              This is taking longer than expected. You can retry or log out and
              try again.
            </p>
            <div className="setup-actions">
              <button onClick={() => window.location.reload()}>
                Retry
              </button>
              <button className="secondary" onClick={logout}>
                Logout & retry
              </button>
            </div>
          </>
        )}

        {setupState === "loading" && (
          <>
            <div className="spinner" />
            <h3>Completing setup…</h3>
            <p>Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  );
}
