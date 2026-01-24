import { useEffect, useState } from "react";
import "../../styles/profile.css";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  updatePassword,
  deleteUser,
} from "firebase/auth";
import { db, auth } from "../../js/firebase";
import { useAuth } from "../../state/authStore";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deleteText, setDeleteText] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
      }
    };

    loadProfile();
  }, [user]);

  if (loading || !user || !profile) return null;

  const initials =
    profile.firstName && profile.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`
      : "U";

  /* =========================
     EDIT PROFILE
  ========================= */

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Name fields cannot be empty");
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    try {
      setWorking(true);

      await updateDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
      });

      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }

      toast.success("Profile updated");
      setEditOpen(false);
      setNewPassword("");
      setConfirmPassword("");

      const refreshed = await getDoc(doc(db, "users", user.uid));
      setProfile(refreshed.data());
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please log in again to change your password");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setWorking(false);
    }
  };

  /* =========================
     DELETE ACCOUNT
  ========================= */

  const handleDelete = async () => {
    if (deleteText !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }

    try {
      setWorking(true);

      // delete Firestore profile
      await deleteDoc(doc(db, "users", user.uid));

      // delete Auth user
      await deleteUser(user);

      toast.success("Account deleted successfully");

      // final verification redirect
      window.location.href = "/";
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please log in again to delete your account");
      } else {
        toast.error("Failed to delete account");
      }
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="page-hero-bg profile-hero">
      <div className="profile-glass-card">
        <h1>My Profile</h1>

        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2>
              {profile.firstName} {profile.lastName}
            </h2>
            <span className="profile-email">{profile.email}</span>
          </div>
        </div>

        <div className="profile-meta">
          <div><strong>Role:</strong> {profile.role}</div>
          <div>
            <strong>Joined:</strong>{" "}
            {profile.createdAt?.toDate().toLocaleDateString()}
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-btn" onClick={() => setEditOpen(true)}>
            Edit Profile
          </button>
          <button
            className="profile-btn danger"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ================= EDIT DIALOG ================= */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content glass">
            <Dialog.Title className="dialog-title">
              Edit Profile
            </Dialog.Title>

            <Dialog.Description className="dialog-description">
              Update your name or password. Email cannot be changed.
            </Dialog.Description>

            <form onSubmit={handleEditSubmit}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />

              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="dialog-actions">
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-btn"
                  disabled={working}
                >
                  {working ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ================= DELETE DIALOG ================= */}
      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="dialog-content glass">
            <AlertDialog.Title className="dialog-title danger">
              Delete Account
            </AlertDialog.Title>

            <AlertDialog.Description className="dialog-description">
              This action is permanent.  
              Type <strong>DELETE</strong> to confirm.
            </AlertDialog.Description>

            <input
              placeholder="DELETE"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
            />

            <div className="dialog-actions">
              <AlertDialog.Cancel asChild>
                <button className="profile-btn">Cancel</button>
              </AlertDialog.Cancel>

              <AlertDialog.Action asChild>
                <button
                  className="profile-btn danger"
                  onClick={handleDelete}
                  disabled={working}
                >
                  {working ? "Deleting..." : "Delete"}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
