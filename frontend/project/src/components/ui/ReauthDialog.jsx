import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { toast } from "sonner";

export default function ReauthDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReauth = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setLoading(true);

      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );

      await reauthenticateWithCredential(user, credential);

      toast.success("Re-authentication successful");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error("Invalid password");
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />

        <Dialog.Content className="dialog-content glass">
          <Dialog.Title className="dialog-title">
            Confirm Your Identity
          </Dialog.Title>

          <Dialog.Description className="dialog-description">
            For security reasons, please re-enter your password to continue.
          </Dialog.Description>

          <div className="dialog-form">
            <label className="dialog-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </label>
          </div>

          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="profile-btn">Cancel</button>
            </Dialog.Close>

            <button
              className="profile-btn"
              onClick={handleReauth}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
