import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

function callable(name) {
  return httpsCallable(functions, name);
}

export function toFirebaseCallableMessage(error, fallback) {
  const message =
    error?.details?.message ||
    error?.message ||
    fallback;

  if (typeof message !== "string") return fallback;

  return message.replace(/^functions\//, "").trim() || fallback;
}

export async function createOrderRequest(payload) {
  const fn = callable("createOrderRequest");
  const result = await fn(payload);
  return result?.data || {};
}

export async function respondToOrder(payload) {
  const fn = callable("respondToOrder");
  const result = await fn(payload);
  return result?.data || {};
}

export async function claimTransportRequest(payload) {
  const fn = callable("claimTransportRequest");
  const result = await fn(payload);
  return result?.data || {};
}

export async function updateDeliveryStatus(payload) {
  const fn = callable("updateDeliveryStatus");
  const result = await fn(payload);
  return result?.data || {};
}

export async function sendThreadMessage(payload) {
  const fn = callable("sendThreadMessage");
  const result = await fn(payload);
  return result?.data || {};
}
