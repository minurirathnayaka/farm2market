import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { auth, db } from "../../js/firebase";
import { toast } from "sonner";

export default function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  uid,
  onUpdated,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, profile]);

  const handleSave = async () => {
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
        toast.error("Password too short");
        return;
      }
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "users", uid), {
        firstName,
        lastName,
      });

      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }

      onUpdated({ ...profile, firstName, lastName });
      toast.success("Profile updated");
      onOpenChange(false);
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />

        <Dialog.Content className="dialog-content glass">
          <Dialog.Title className="dialog-title">
            Edit Profile
          </Dialog.Title>

          <Dialog.Description className="dialog-description">
            Update your name or change your password. Email cannot be edited.
          </Dialog.Description>

          <div className="dialog-form">
            <label>
              First Name
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>

            <label>
              Last Name
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>

            <label>
              New Password
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>

            <label>
              Confirm Password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
          </div>

          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button type="button" className="profile-btn">
                Cancel
              </button>
            </Dialog.Close>

            <button
              type="button"
              className="profile-btn"
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
