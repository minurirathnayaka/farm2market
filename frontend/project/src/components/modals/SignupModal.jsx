import "../../styles/loginsignup.css";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../js/firebase";
import { toast } from "sonner";

export default function SignupModal({ onClose, onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const form = e.target;

    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const role = form.role.value;
    const phone = form.phone.value.trim();

    if (!firstName || !lastName || !email || !password || !role || !phone) {
      toast.error("All fields are required");
      return;
    }

    // basic phone sanity check (not country-specific yet)
    if (phone.length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      setLoading(true);

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName,
        lastName,
        email: user.email,
        phone,
        role,
        createdAt: serverTimestamp(),
      });

      toast.success("Account created successfully");
      onClose();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already in use");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password too weak");
      } else {
        toast.error("Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay show" onClick={onClose}>
      <div className="login-container" onClick={(e) => e.stopPropagation()}>
        <div className="login-card">
          <div className="login-header">
            <h2>Create an Account</h2>
            <p>Select your role carefully</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper">
                <input name="firstName" type="text" required />
                <label>First Name</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input name="lastName" type="text" required />
                <label>Last Name</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input name="email" type="email" required />
                <label>Email</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input
                  name="phone"
                  type="tel"
                  placeholder=" "
                  required
                />
                <label>Phone Number</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input name="password" type="password" required />
                <label>Password</label>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <select name="role" required>
                  <option value=""></option>
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                  <option value="transporter">Transporter</option>
                </select>
                <label>Role</label>
              </div>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <div className="signup-link">
            <p>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onLogin();
                }}
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
