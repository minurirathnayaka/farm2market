import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db } from "../../js/firebase";
import { toast } from "sonner";
import { useState } from "react";

export default function DeleteProfileDialog({
  open,
  onOpenChange,
  user,
  onDeleted,
}) {
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      toast.success("Account deleted");
      onDeleted();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />

        <AlertDialog.Content className="dialog-content glass">
          <AlertDialog.Title className="dialog-title danger">
            Delete Account
          </AlertDialog.Title>

          <AlertDialog.Description className="dialog-description">
            This action is permanent. Type <strong>DELETE</strong> to confirm.
          </AlertDialog.Description>

          <input
            className="dialog-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />

          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <button type="button" className="profile-btn">
                Cancel
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                type="button"
                className="profile-btn danger"
                onClick={handleDelete}
              >
                Delete Account
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
