import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { db } from "../../js/firebase";
import { useAuth } from "../../state/authStore";
import { formatTimestamp } from "../../js/orders";

import "../../styles/components/notification-inbox.css";

const MAX_NOTIFICATIONS = 60;

export default function NotificationInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);

  const initializedRef = useRef(false);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(MAX_NOTIFICATIONS)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        if (initializedRef.current) {
          const newRows = rows.filter(
            (row) => !seenIdsRef.current.has(row.id) && !row.readAt
          );

          newRows.forEach((row) => {
            const title = row.title || "New notification";
            toast.info(title, {
              description: row.body || "You have a new update.",
            });
          });
        }

        initializedRef.current = true;
        seenIdsRef.current = new Set(rows.map((row) => row.id));
        setNotifications(rows);
      },
      () => {
        toast.error("Failed to load notifications");
      }
    );

    return () => unsub();
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.readAt);
    }
    return notifications;
  }, [filter, notifications]);

  const markRead = async (notification) => {
    if (notification.readAt) return;

    try {
      await updateDoc(doc(db, "notifications", notification.id), {
        readAt: serverTimestamp(),
      });
    } catch {
      toast.error("Unable to mark notification as read");
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.readAt);
    if (unread.length === 0) return;

    await Promise.all(
      unread.map((item) =>
        updateDoc(doc(db, "notifications", item.id), {
          readAt: serverTimestamp(),
        }).catch(() => null)
      )
    );
  };

  const handleOpenNotification = async (notification) => {
    await markRead(notification);

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div className="notif-wrapper">
      <button className="notif-bell" onClick={() => setOpen((prev) => !prev)}>
        Notifications
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel liquid-glass">
          <div className="notif-head">
            <h4>Inbox</h4>
            <button className="notif-mark-read" onClick={markAllRead}>
              Mark all read
            </button>
          </div>

          <div className="notif-filter-row">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={filter === "unread" ? "active" : ""}
              onClick={() => setFilter("unread")}
            >
              Unread
            </button>
          </div>

          <div className="notif-list">
            {visibleNotifications.length === 0 && (
              <p className="notif-empty">No notifications yet.</p>
            )}

            {visibleNotifications.map((item) => (
              <button
                key={item.id}
                className={`notif-item ${item.readAt ? "read" : "unread"}`}
                onClick={() => handleOpenNotification(item)}
              >
                <div>
                  <p className="notif-title">{item.title || "Update"}</p>
                  <p className="notif-body">{item.body || "-"}</p>
                </div>
                <span className="notif-time">{formatTimestamp(item.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
