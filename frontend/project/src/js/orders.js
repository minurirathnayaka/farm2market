export const ORDER_STATUS_LABELS = {
  requested: "Requested",
  farmer_accepted: "Farmer Accepted",
  farmer_rejected: "Farmer Rejected",
  awaiting_transporter: "Awaiting Transporter",
  in_delivery: "In Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const ORDER_STATUS_COLORS = {
  requested: "#38bdf8",
  farmer_accepted: "#22c55e",
  farmer_rejected: "#ef4444",
  awaiting_transporter: "#f59e0b",
  in_delivery: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#f97316",
  expired: "#94a3b8",
};

export const VISIBLE_PHONE_ORDER_STATUSES = new Set(["in_delivery", "delivered"]);

export function toOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || "Unknown";
}

export function formatTimestamp(value) {
  if (!value) return "-";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
      ? value
      : null;

  if (!date) return "-";

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function maskPhone(phone) {
  const raw = String(phone || "").replace(/\D/g, "");
  if (!raw) return "Not available";
  if (raw.length <= 4) return raw;
  return `${raw.slice(0, 2)}••••${raw.slice(-2)}`;
}

export function canRevealPhone(orderStatus) {
  return VISIBLE_PHONE_ORDER_STATUSES.has(orderStatus);
}
