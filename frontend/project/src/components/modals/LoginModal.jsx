import "../../styles/loginsignup.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../js/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function LoginModal({ onClose, onSignup }) {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      // 1. Auth login
      const { user } = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2. Fetch role
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        toast.error("User profile not found");
        return;
      }

      const { role } = snap.data();

      // 3. Redirect by role
      if (role === "farmer") {
        navigate("/dashboard/farmer", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

      toast.success("Login successful");
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-overlay show" onClick={onClose}>
      <div className="login-container" onClick={(e) => e.stopPropagation()}>
        <div className="login-card">
          <div className="login-header">
            <h2>Hello, Welcome Back</h2>
            <p>Login to manage your account.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper">
                <input name="email" type="email" required />
                <label>Email</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input name="password" type="password" required />
                <label>Password</label>
              </div>
            </div>

            <button className="btn" type="submit">
              Login
            </button>
          </form>

          <div className="signup-link">
            <p>
              Don&apos;t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSignup();
                }}
              >
                Signup
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
