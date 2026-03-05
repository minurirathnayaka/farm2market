const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({
  region: "asia-south1",
  maxInstances: 10,
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

const RESERVATION_TTL_MS = 30 * 60 * 1000;
const ACTIVE_TRANSPORT_STATUSES = ["accepted", "paused"];
const DELIVERY_STATUS_INPUTS = new Set([
  "accepted",
  "paused",
  "resumed",
  "picked_up",
  "completed",
  "cancelled",
]);

const ORDER_STATUS = {
  REQUESTED: "requested",
  FARMER_ACCEPTED: "farmer_accepted",
  FARMER_REJECTED: "farmer_rejected",
  AWAITING_TRANSPORTER: "awaiting_transporter",
  IN_DELIVERY: "in_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  return request.auth.uid;
}

function asPositiveNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} must be a positive number.`
    );
  }
  return n;
}

function asNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", `${fieldName} is required.`);
  }
  return value.trim();
}

async function getUserProfile(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "User profile not found.");
  }

  const data = snap.data() || {};
  if (!data.role) {
    throw new HttpsError("failed-precondition", "User role is missing.");
  }

  return {
    uid,
    ...data,
  };
}

async function assertRole(uid, expectedRole) {
  const profile = await getUserProfile(uid);
  if (profile.role !== expectedRole) {
    throw new HttpsError("permission-denied", `Only ${expectedRole}s can do this.`);
  }
  return profile;
}

function getStockBuckets(stock) {
  const total = Number(stock?.quantity || 0);

  const hasAvailable = Number.isFinite(Number(stock?.availableQtyKg));
  const hasReserved = Number.isFinite(Number(stock?.reservedQtyKg));

  const available = hasAvailable ? Number(stock.availableQtyKg) : Math.max(0, total);
  const reserved = hasReserved
    ? Number(stock.reservedQtyKg)
    : Math.max(0, total - available);

  return {
    total,
    available: Math.max(0, available),
    reserved: Math.max(0, reserved),
  };
}

function appendTimeline(existing, entries) {
  const base = Array.isArray(existing) ? existing : [];
  return [...base, ...entries];
}

function queueNotification(tx, payload, now) {
  const ref = db.collection("notifications").doc();
  tx.set(ref, {
    recipientId: payload.recipientId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    entityType: payload.entityType || null,
    entityId: payload.entityId || null,
    actionUrl: payload.actionUrl || null,
    readAt: null,
    createdAt: now,
  });
}

function deriveDisplayName(profile, fallback = "User") {
  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  return fullName || profile?.displayName || profile?.email || fallback;
}

exports.createOrderRequest = onCall(async (request) => {
  const buyerId = requireAuth(request);
  const buyerProfile = await assertRole(buyerId, "buyer");

  const stockId = asNonEmptyString(request.data?.stockId, "stockId");
  const requestedQtyKg = asPositiveNumber(request.data?.requestedQtyKg, "requestedQtyKg");
  const initialMessage =
    typeof request.data?.initialMessage === "string"
      ? request.data.initialMessage.trim().slice(0, 500)
      : "";

  const stockRef = db.collection("stocks").doc(stockId);
  const orderRef = db.collection("orders").doc();
  const threadRef = db.collection("threads").doc();

  await db.runTransaction(async (tx) => {
    const stockSnap = await tx.get(stockRef);
    if (!stockSnap.exists) {
      throw new HttpsError("not-found", "Stock listing not found.");
    }

    const stock = stockSnap.data() || {};
    const farmerId = stock.farmerId;
    if (!farmerId) {
      throw new HttpsError("failed-precondition", "Stock is missing farmer owner.");
    }

    if (farmerId === buyerId) {
      throw new HttpsError("failed-precondition", "You cannot request your own stock.");
    }

    const { available, reserved } = getStockBuckets(stock);
    if (available < requestedQtyKg) {
      throw new HttpsError("failed-precondition", "Requested quantity is not available.");
    }

    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + RESERVATION_TTL_MS);
    const timeline = [
      {
        status: ORDER_STATUS.REQUESTED,
        byUserId: buyerId,
        at: now,
      },
    ];

    tx.set(orderRef, {
      stockId,
      buyerId,
      farmerId,
      transporterId: null,
      requestedQtyKg,
      pricePerKg: Number(stock.price || 0),
      market: stock.market || null,
      status: ORDER_STATUS.REQUESTED,
      reservationExpiresAt: expiresAt,
      threadId: threadRef.id,
      transportRequestId: null,
      statusTimeline: timeline,
      createdAt: now,
      updatedAt: now,
    });

    tx.update(stockRef, {
      availableQtyKg: Math.max(0, available - requestedQtyKg),
      reservedQtyKg: reserved + requestedQtyKg,
      transportStatus: "reserved",
      updatedAt: now,
    });

    tx.set(threadRef, {
      orderId: orderRef.id,
      participantIds: [buyerId, farmerId],
      lastMessage: initialMessage || "Order requested",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    if (initialMessage) {
      const msgRef = threadRef.collection("messages").doc();
      tx.set(msgRef, {
        senderId: buyerId,
        senderRole: buyerProfile.role,
        text: initialMessage,
        createdAt: now,
      });
    }

    queueNotification(
      tx,
      {
        recipientId: farmerId,
        type: "order_requested",
        title: "New order request",
        body: `${deriveDisplayName(buyerProfile, "Buyer")} requested ${requestedQtyKg} kg from your stock.`,
        entityType: "order",
        entityId: orderRef.id,
        actionUrl: `/dashboard/orders/${orderRef.id}`,
      },
      now
    );
  });

  return {
    ok: true,
    orderId: orderRef.id,
    threadId: threadRef.id,
  };
});

exports.respondToOrder = onCall(async (request) => {
  const farmerId = requireAuth(request);
  await assertRole(farmerId, "farmer");

  const orderId = asNonEmptyString(request.data?.orderId, "orderId");
  const action = asNonEmptyString(request.data?.action, "action").toLowerCase();
  if (action !== "accept" && action !== "reject") {
    throw new HttpsError("invalid-argument", "action must be accept or reject.");
  }

  let acceptedPayload = null;

  await db.runTransaction(async (tx) => {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const order = orderSnap.data() || {};
    if (order.farmerId !== farmerId) {
      throw new HttpsError("permission-denied", "You cannot respond to this order.");
    }

    if (order.status !== ORDER_STATUS.REQUESTED) {
      throw new HttpsError("failed-precondition", "Order is no longer awaiting response.");
    }

    const stockRef = db.collection("stocks").doc(order.stockId);
    const stockSnap = await tx.get(stockRef);
    if (!stockSnap.exists) {
      throw new HttpsError("failed-precondition", "Linked stock is missing.");
    }

    const stock = stockSnap.data() || {};
    const { available, reserved } = getStockBuckets(stock);
    const requestedQtyKg = asPositiveNumber(order.requestedQtyKg, "requestedQtyKg");

    const now = Timestamp.now();
    const timelineBase = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];

    if (action === "reject") {
      tx.update(orderRef, {
        status: ORDER_STATUS.FARMER_REJECTED,
        updatedAt: now,
        statusTimeline: appendTimeline(timelineBase, [
          {
            status: ORDER_STATUS.FARMER_REJECTED,
            byUserId: farmerId,
            at: now,
          },
        ]),
      });

      tx.update(stockRef, {
        availableQtyKg: available + requestedQtyKg,
        reservedQtyKg: Math.max(0, reserved - requestedQtyKg),
        transportStatus: available + requestedQtyKg > 0 ? "available" : "delivered",
        updatedAt: now,
      });

      queueNotification(
        tx,
        {
          recipientId: order.buyerId,
          type: "order_rejected",
          title: "Order request rejected",
          body: "The farmer rejected your request.",
          entityType: "order",
          entityId: orderId,
          actionUrl: `/dashboard/orders/${orderId}`,
        },
        now
      );

      return;
    }

    const transportRef = db.collection("transport_requests").doc();

    tx.update(orderRef, {
      status: ORDER_STATUS.AWAITING_TRANSPORTER,
      updatedAt: now,
      transportRequestId: transportRef.id,
      statusTimeline: appendTimeline(timelineBase, [
        {
          status: ORDER_STATUS.FARMER_ACCEPTED,
          byUserId: farmerId,
          at: now,
        },
        {
          status: ORDER_STATUS.AWAITING_TRANSPORTER,
          byUserId: farmerId,
          at: now,
        },
      ]),
    });

    tx.set(transportRef, {
      orderId,
      stockId: order.stockId,
      buyerId: order.buyerId,
      farmerId: order.farmerId,
      transporterId: null,
      requestedQtyKg,
      reservationExpiresAt: order.reservationExpiresAt || null,
      status: "open",
      deliveryStage: "queued",
      vegetable: stock.vegetable || null,
      market: order.market || stock.market || null,
      pickupLocation: stock.pickupLocation || null,
      phone: stock.phone || null,
      createdAt: now,
      updatedAt: now,
    });

    tx.update(stockRef, {
      transportStatus: "awaiting_transporter",
      updatedAt: now,
    });

    queueNotification(
      tx,
      {
        recipientId: order.buyerId,
        type: "order_accepted",
        title: "Order accepted",
        body: "The farmer accepted your request. Finding a transporter now.",
        entityType: "order",
        entityId: orderId,
        actionUrl: `/dashboard/orders/${orderId}`,
      },
      now
    );

    acceptedPayload = {
      orderId,
      transportRequestId: transportRef.id,
      requestedQtyKg,
    };
  });

  if (action === "accept" && acceptedPayload) {
    const transporterSnap = await db.collection("users").where("role", "==", "transporter").get();

    const now = Timestamp.now();
    let batch = db.batch();
    let count = 0;

    for (const docSnap of transporterSnap.docs) {
      const recipientId = docSnap.id;
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        recipientId,
        type: "transport_request_open",
        title: "New transport job",
        body: `A buyer order is ready to claim (${acceptedPayload.requestedQtyKg} kg).`,
        entityType: "transport_request",
        entityId: acceptedPayload.transportRequestId,
        actionUrl: "/dashboard/transporter",
        readAt: null,
        createdAt: now,
      });
      count += 1;

      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  }

  return {
    ok: true,
    orderId,
    action,
  };
});

exports.claimTransportRequest = onCall(async (request) => {
  const transporterId = requireAuth(request);
  await assertRole(transporterId, "transporter");

  const transportRequestId = asNonEmptyString(request.data?.transportRequestId, "transportRequestId");

  let orderId = null;

  await db.runTransaction(async (tx) => {
    const activeSnap = await tx.get(
      db
        .collection("transport_requests")
        .where("transporterId", "==", transporterId)
        .where("status", "in", ACTIVE_TRANSPORT_STATUSES)
    );

    const hasOtherActive = activeSnap.docs.some((snap) => snap.id !== transportRequestId);
    if (hasOtherActive) {
      throw new HttpsError("failed-precondition", "You already have an active delivery.");
    }

    const transportRef = db.collection("transport_requests").doc(transportRequestId);
    const transportSnap = await tx.get(transportRef);
    if (!transportSnap.exists) {
      throw new HttpsError("not-found", "Transport request not found.");
    }

    const transport = transportSnap.data() || {};
    if (!transport.orderId) {
      throw new HttpsError("failed-precondition", "This is a legacy transport request.");
    }

    if (transport.status !== "open") {
      throw new HttpsError("failed-precondition", "Transport request is already claimed.");
    }

    const orderRef = db.collection("orders").doc(transport.orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError("failed-precondition", "Linked order does not exist.");
    }

    const order = orderSnap.data() || {};
    if (order.status !== ORDER_STATUS.AWAITING_TRANSPORTER) {
      throw new HttpsError("failed-precondition", "Order is not awaiting a transporter.");
    }

    const stockRef = db.collection("stocks").doc(order.stockId);
    const stockSnap = await tx.get(stockRef);
    if (!stockSnap.exists) {
      throw new HttpsError("failed-precondition", "Linked stock does not exist.");
    }

    const now = Timestamp.now();

    tx.update(transportRef, {
      status: "accepted",
      deliveryStage: "accepted",
      transporterId,
      claimedAt: now,
      updatedAt: now,
    });

    tx.update(orderRef, {
      status: ORDER_STATUS.IN_DELIVERY,
      transporterId,
      updatedAt: now,
      statusTimeline: appendTimeline(order.statusTimeline, [
        {
          status: ORDER_STATUS.IN_DELIVERY,
          byUserId: transporterId,
          at: now,
        },
      ]),
    });

    tx.update(stockRef, {
      transportStatus: "in_delivery",
      updatedAt: now,
    });

    if (order.threadId) {
      tx.update(db.collection("threads").doc(order.threadId), {
        participantIds: FieldValue.arrayUnion(transporterId),
        updatedAt: now,
      });
    }

    queueNotification(
      tx,
      {
        recipientId: order.buyerId,
        type: "transporter_claimed",
        title: "Transporter assigned",
        body: "A transporter claimed your delivery.",
        entityType: "order",
        entityId: orderSnap.id,
        actionUrl: `/dashboard/orders/${orderSnap.id}`,
      },
      now
    );

    queueNotification(
      tx,
      {
        recipientId: order.farmerId,
        type: "transporter_claimed",
        title: "Transporter assigned",
        body: "A transporter claimed this order.",
        entityType: "order",
        entityId: orderSnap.id,
        actionUrl: `/dashboard/orders/${orderSnap.id}`,
      },
      now
    );

    orderId = orderSnap.id;
  });

  return {
    ok: true,
    orderId,
    transportRequestId,
  };
});

exports.updateDeliveryStatus = onCall(async (request) => {
  const transporterId = requireAuth(request);
  await assertRole(transporterId, "transporter");

  const transportRequestId = asNonEmptyString(request.data?.transportRequestId, "transportRequestId");
  const deliveryStatus = asNonEmptyString(request.data?.status, "status").toLowerCase();

  if (!DELIVERY_STATUS_INPUTS.has(deliveryStatus)) {
    throw new HttpsError("invalid-argument", "Unsupported delivery status.");
  }

  let orderId = null;

  await db.runTransaction(async (tx) => {
    const transportRef = db.collection("transport_requests").doc(transportRequestId);
    const transportSnap = await tx.get(transportRef);
    if (!transportSnap.exists) {
      throw new HttpsError("not-found", "Transport request not found.");
    }

    const transport = transportSnap.data() || {};
    if (transport.transporterId !== transporterId) {
      throw new HttpsError("permission-denied", "You are not assigned to this transport request.");
    }

    if (!transport.orderId) {
      throw new HttpsError("failed-precondition", "Legacy requests are not supported here.");
    }

    const orderRef = db.collection("orders").doc(transport.orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError("failed-precondition", "Linked order not found.");
    }

    const order = orderSnap.data() || {};
    if (order.transporterId !== transporterId) {
      throw new HttpsError("permission-denied", "You are not assigned to this order.");
    }

    const stockRef = db.collection("stocks").doc(order.stockId);
    const stockSnap = await tx.get(stockRef);
    if (!stockSnap.exists) {
      throw new HttpsError("failed-precondition", "Linked stock not found.");
    }

    const stock = stockSnap.data() || {};
    const buckets = getStockBuckets(stock);
    const requestedQtyKg = asPositiveNumber(order.requestedQtyKg, "requestedQtyKg");

    const now = Timestamp.now();
    const timelineBase = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];

    const transportUpdates = {
      updatedAt: now,
    };

    const orderUpdates = {
      updatedAt: now,
    };

    const stockUpdates = {
      updatedAt: now,
    };

    let notifyTitle = "Delivery update";
    let notifyBody = "There is an update on your order.";

    if (deliveryStatus === "accepted" || deliveryStatus === "resumed") {
      transportUpdates.status = "accepted";
      transportUpdates.deliveryStage = deliveryStatus === "resumed" ? "resumed" : "accepted";
      orderUpdates.status = ORDER_STATUS.IN_DELIVERY;
      stockUpdates.transportStatus = "in_delivery";
      notifyTitle = deliveryStatus === "resumed" ? "Delivery resumed" : "Delivery started";
      notifyBody = deliveryStatus === "resumed"
        ? "The transporter resumed this delivery."
        : "The transporter has started this delivery.";
    } else if (deliveryStatus === "paused") {
      transportUpdates.status = "paused";
      transportUpdates.deliveryStage = "paused";
      orderUpdates.status = ORDER_STATUS.IN_DELIVERY;
      stockUpdates.transportStatus = "in_delivery";
      notifyTitle = "Delivery paused";
      notifyBody = "The transporter paused this delivery.";
    } else if (deliveryStatus === "picked_up") {
      transportUpdates.status = "accepted";
      transportUpdates.deliveryStage = "picked_up";
      transportUpdates.pickedUpAt = now;
      orderUpdates.status = ORDER_STATUS.IN_DELIVERY;
      stockUpdates.transportStatus = "in_delivery";
      notifyTitle = "Stock picked up";
      notifyBody = "The stock has been picked up and is on the way.";
    } else if (deliveryStatus === "completed") {
      transportUpdates.status = "completed";
      transportUpdates.deliveryStage = "completed";
      transportUpdates.completedAt = now;
      orderUpdates.status = ORDER_STATUS.DELIVERED;
      orderUpdates.deliveredAt = now;
      stockUpdates.reservedQtyKg = Math.max(0, buckets.reserved - requestedQtyKg);
      stockUpdates.transportStatus = buckets.available > 0 ? "available" : "delivered";
      notifyTitle = "Delivery completed";
      notifyBody = "The transporter marked this order as delivered.";
    } else if (deliveryStatus === "cancelled") {
      transportUpdates.status = "open";
      transportUpdates.deliveryStage = "queued";
      transportUpdates.transporterId = null;
      orderUpdates.status = ORDER_STATUS.AWAITING_TRANSPORTER;
      orderUpdates.transporterId = null;
      stockUpdates.transportStatus = "awaiting_transporter";
      notifyTitle = "Transport reassignment needed";
      notifyBody = "The transporter cancelled this run. Waiting for a new transporter.";
    }

    tx.update(transportRef, transportUpdates);

    tx.update(orderRef, {
      ...orderUpdates,
      statusTimeline: appendTimeline(timelineBase, [
        {
          status:
            deliveryStatus === "completed"
              ? ORDER_STATUS.DELIVERED
              : deliveryStatus === "cancelled"
              ? ORDER_STATUS.AWAITING_TRANSPORTER
              : ORDER_STATUS.IN_DELIVERY,
          deliveryStatus,
          byUserId: transporterId,
          at: now,
        },
      ]),
    });

    tx.update(stockRef, stockUpdates);

    queueNotification(
      tx,
      {
        recipientId: order.buyerId,
        type: `delivery_${deliveryStatus}`,
        title: notifyTitle,
        body: notifyBody,
        entityType: "order",
        entityId: orderSnap.id,
        actionUrl: `/dashboard/orders/${orderSnap.id}`,
      },
      now
    );

    queueNotification(
      tx,
      {
        recipientId: order.farmerId,
        type: `delivery_${deliveryStatus}`,
        title: notifyTitle,
        body: notifyBody,
        entityType: "order",
        entityId: orderSnap.id,
        actionUrl: `/dashboard/orders/${orderSnap.id}`,
      },
      now
    );

    orderId = orderSnap.id;
  });

  return {
    ok: true,
    orderId,
    transportRequestId,
    status: deliveryStatus,
  };
});

exports.sendThreadMessage = onCall(async (request) => {
  const senderId = requireAuth(request);
  const senderProfile = await getUserProfile(senderId);

  const threadId = asNonEmptyString(request.data?.threadId, "threadId");
  const text = asNonEmptyString(request.data?.text, "text").slice(0, 1000);

  const threadRef = db.collection("threads").doc(threadId);
  const msgRef = threadRef.collection("messages").doc();

  await db.runTransaction(async (tx) => {
    const threadSnap = await tx.get(threadRef);
    if (!threadSnap.exists) {
      throw new HttpsError("not-found", "Thread not found.");
    }

    const thread = threadSnap.data() || {};
    const participantIds = Array.isArray(thread.participantIds) ? thread.participantIds : [];

    if (!participantIds.includes(senderId)) {
      throw new HttpsError("permission-denied", "You are not part of this thread.");
    }

    const now = Timestamp.now();

    tx.set(msgRef, {
      senderId,
      senderRole: senderProfile.role,
      text,
      createdAt: now,
    });

    tx.update(threadRef, {
      lastMessage: text,
      lastMessageAt: now,
      updatedAt: now,
    });

    for (const recipientId of participantIds) {
      if (recipientId === senderId) continue;

      queueNotification(
        tx,
        {
          recipientId,
          type: "thread_message",
          title: "New message",
          body: `${deriveDisplayName(senderProfile, "User")}: ${text.slice(0, 80)}`,
          entityType: "thread",
          entityId: threadId,
          actionUrl: `/dashboard/orders/${thread.orderId}`,
        },
        now
      );
    }
  });

  return {
    ok: true,
    messageId: msgRef.id,
  };
});

exports.expireSoftReservations = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Asia/Colombo",
  },
  async () => {
    const now = Timestamp.now();

    const snap = await db
      .collection("orders")
      .where("status", "==", ORDER_STATUS.REQUESTED)
      .where("reservationExpiresAt", "<=", now)
      .limit(50)
      .get();

    if (snap.empty) {
      logger.info("No expirable orders found.");
      return;
    }

    let expiredCount = 0;

    for (const orderDoc of snap.docs) {
      await db.runTransaction(async (tx) => {
        const latestOrderSnap = await tx.get(orderDoc.ref);
        if (!latestOrderSnap.exists) return;

        const order = latestOrderSnap.data() || {};
        if (order.status !== ORDER_STATUS.REQUESTED) return;

        const expiresAt = order.reservationExpiresAt;
        if (!expiresAt || expiresAt.toMillis() > Date.now()) return;

        const stockRef = db.collection("stocks").doc(order.stockId);
        const stockSnap = await tx.get(stockRef);
        if (!stockSnap.exists) return;

        const stock = stockSnap.data() || {};
        const { available, reserved } = getStockBuckets(stock);
        const requestedQtyKg = asPositiveNumber(order.requestedQtyKg, "requestedQtyKg");
        const ts = Timestamp.now();

        tx.update(orderDoc.ref, {
          status: ORDER_STATUS.EXPIRED,
          updatedAt: ts,
          statusTimeline: appendTimeline(order.statusTimeline, [
            {
              status: ORDER_STATUS.EXPIRED,
              byUserId: "system",
              at: ts,
            },
          ]),
        });

        tx.update(stockRef, {
          availableQtyKg: available + requestedQtyKg,
          reservedQtyKg: Math.max(0, reserved - requestedQtyKg),
          transportStatus: available + requestedQtyKg > 0 ? "available" : "delivered",
          updatedAt: ts,
        });

        queueNotification(
          tx,
          {
            recipientId: order.buyerId,
            type: "order_expired",
            title: "Order request expired",
            body: "The request expired before the farmer responded.",
            entityType: "order",
            entityId: orderDoc.id,
            actionUrl: `/dashboard/orders/${orderDoc.id}`,
          },
          ts
        );

        queueNotification(
          tx,
          {
            recipientId: order.farmerId,
            type: "order_expired",
            title: "Order request expired",
            body: "A pending request expired automatically.",
            entityType: "order",
            entityId: orderDoc.id,
            actionUrl: `/dashboard/orders/${orderDoc.id}`,
          },
          ts
        );

        expiredCount += 1;
      });
    }

    logger.info(`Expired ${expiredCount} order reservations.`);
  }
);
