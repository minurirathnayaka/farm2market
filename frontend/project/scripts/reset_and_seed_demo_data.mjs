#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const PROJECT_ID = "farm2market-2026";
const IMAGE_DIR = "/Users/minadadehiwala/App/minuri/pics";
const FIREBASE_CONFIG_PATH = path.join(
  process.env.HOME,
  ".config",
  "configstore",
  "firebase-tools.json"
);

const TOTAL_FARMERS = 20;
const TOTAL_BUYERS = 10;
const TOTAL_TRANSPORTERS = 10;
const STOCKS_PER_FARMER = 20;
const USER_PASSWORD = "123456";

const VEGETABLES = [
  "Big Onion (Local)",
  "Big Onion (Imported)",
  "Red Onion (Imported)",
  "Carrot",
  "Potato (Local)",
  "Potato (Imported)",
  "Green Chilli",
  "Tomato",
  "Lime",
  "Snake Gourd",
];

const VEGETABLE_IMAGE_MAP = {
  "Big Onion (Local)": "Onion.jpg",
  "Big Onion (Imported)": "Imported onion.jpg",
  "Red Onion (Imported)": "imported red onion.jpg",
  Carrot: "carrot.jpg",
  "Potato (Local)": "local potatoes.jpg",
  "Potato (Imported)": "local potatoes.jpg",
  "Green Chilli": "chilli.jpg",
  Tomato: "tomatoes.jpg",
  Lime: "lime.jpg",
  "Snake Gourd": "snake-gourd.jpg",
};

const MARKETS = ["Pettah", "Narahenpita"];
const PICKUP_LOCATIONS = [
  "Dambulla Main Yard",
  "Nuwara Eliya Farm Gate",
  "Embilipitiya Collection Point",
  "Anuradhapura Coop Center",
  "Kurunegala Packing Shed",
  "Matale Wholesale Shed",
  "Badulla Farm Junction",
  "Monaragala Rural Hub",
];

const BASE_PRICES = {
  "Big Onion (Local)": 210,
  "Big Onion (Imported)": 245,
  "Red Onion (Imported)": 330,
  Carrot: 270,
  "Potato (Local)": 220,
  "Potato (Imported)": 255,
  "Green Chilli": 390,
  Tomato: 180,
  Lime: 310,
  "Snake Gourd": 160,
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logStep(msg) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${msg}`);
}

function parseEnv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  }

  return env;
}

function ensureFirebaseTokenFresh() {
  execSync(`firebase projects:list --project ${PROJECT_ID} --json`, {
    stdio: "ignore",
  });
}

function getFirebaseCliToken() {
  const cfg = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_PATH, "utf8"));
  const token = cfg?.tokens?.access_token;
  if (!token) {
    throw new Error("No Firebase CLI access token found. Run: firebase login");
  }
  return token;
}

function firestoreFields(data) {
  const out = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      out[key] = { nullValue: null };
    } else if (Array.isArray(value)) {
      out[key] = {
        arrayValue: {
          values: value.map((entry) =>
            typeof entry === "string"
              ? { stringValue: entry }
              : typeof entry === "number"
              ? Number.isInteger(entry)
                ? { integerValue: String(entry) }
                : { doubleValue: entry }
              : typeof entry === "boolean"
              ? { booleanValue: entry }
              : { stringValue: String(entry) }
          ),
        },
      };
    } else if (typeof value === "string") {
      out[key] = { stringValue: value };
    } else if (typeof value === "number") {
      out[key] = Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    } else if (typeof value === "boolean") {
      out[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      out[key] = { timestampValue: value.toISOString() };
    } else {
      out[key] = { stringValue: JSON.stringify(value) };
    }
  }

  return out;
}

async function callJson(url, options = {}, retries = 4) {
  let attempt = 0;

  while (true) {
    const response = await fetch(url, options);
    const text = await response.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (response.ok) {
      return payload;
    }

    attempt += 1;
    if (attempt > retries) {
      throw new Error(
        `Request failed ${response.status} ${response.statusText}: ${JSON.stringify(payload)}`
      );
    }

    await wait(300 * attempt);
  }
}

async function listAllAuthUserIds(accessToken) {
  let offset = 0;
  const limit = 500;
  const allIds = [];

  while (true) {
    const body = {
      returnUserInfo: true,
      limit,
      offset,
      sortBy: "USER_ID",
      order: "ASC",
    };

    const result = await callJson(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const userInfo = result.userInfo || [];
    allIds.push(...userInfo.map((u) => u.localId).filter(Boolean));

    if (userInfo.length < limit) {
      break;
    }

    offset += limit;
  }

  return allIds;
}

async function deleteAuthUsers(accessToken, userIds) {
  if (userIds.length === 0) return;

  const batchSize = 100;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const chunk = userIds.slice(i, i + batchSize);
    await callJson(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchDelete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ localIds: chunk, force: true }),
      }
    );
  }
}

async function deleteStoragePrefix(accessToken, bucket, prefix = "") {
  let pageToken = "";

  while (true) {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${bucket}/o`);
    url.searchParams.set("maxResults", "1000");
    if (prefix) url.searchParams.set("prefix", prefix);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const page = await callJson(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const items = page.items || [];
    for (const item of items) {
      const name = encodeURIComponent(item.name);
      await callJson(`https://storage.googleapis.com/storage/v1/b/${bucket}/o/${name}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }
}

async function createAuthUser(apiKey, email, password, displayName) {
  return callJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      displayName,
      returnSecureToken: true,
    }),
  });
}

async function createUserProfile(accessToken, uid, profile) {
  const docUrl =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users` +
    `?documentId=${encodeURIComponent(uid)}`;

  await callJson(docUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: firestoreFields(profile) }),
  });
}

async function uploadImage(accessToken, bucket, objectName, filePath, contentType) {
  const encodedName = encodeURIComponent(objectName);
  const bytes = fs.readFileSync(filePath);

  await callJson(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodedName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
      },
      body: bytes,
    }
  );

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedName}?alt=media`;
}

function contentTypeFromName(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function createFirestoreDocument(accessToken, collectionName, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}`;
  const payload = await callJson(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: firestoreFields(data) }),
  });

  const docName = payload?.name || "";
  return docName.split("/").pop();
}

async function mapLimit(items, limit, worker) {
  const queue = [...items];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      await worker(item);
    }
  });

  await Promise.all(workers);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(array) {
  return array[randomInt(0, array.length - 1)];
}

async function main() {
  const rootEnv = parseEnv(path.join(process.cwd(), ".env"));
  const apiKey = rootEnv.VITE_FIREBASE_API_KEY;
  const storageBucket =
    rootEnv.VITE_FIREBASE_STORAGE_BUCKET ||
    `${rootEnv.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`;

  if (!apiKey) {
    throw new Error("Missing VITE_FIREBASE_API_KEY in .env");
  }

  logStep("Refreshing Firebase CLI access token...");
  ensureFirebaseTokenFresh();
  const accessToken = getFirebaseCliToken();

  logStep("Deleting all Firestore collections...");
  execSync(
    `firebase firestore:delete --project ${PROJECT_ID} --all-collections -f`,
    { stdio: "inherit" }
  );

  logStep("Deleting all Firebase Storage objects...");
  await deleteStoragePrefix(accessToken, storageBucket, "");

  logStep("Deleting all Auth users...");
  const existingUserIds = await listAllAuthUserIds(accessToken);
  await deleteAuthUsers(accessToken, existingUserIds);
  logStep(`Deleted ${existingUserIds.length} auth users.`);

  logStep("Uploading seed vegetable images...");
  const imageUrlByVegetable = {};
  for (const vegetable of VEGETABLES) {
    const fileName = VEGETABLE_IMAGE_MAP[vegetable];
    const filePath = path.join(IMAGE_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing image for ${vegetable}: ${filePath}`);
    }

    const objectName = `stock_photos/seed-assets/${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
    const url = await uploadImage(
      accessToken,
      storageBucket,
      objectName,
      filePath,
      contentTypeFromName(fileName)
    );
    imageUrlByVegetable[vegetable] = url;
  }

  const users = [];

  logStep("Creating farmer accounts + profiles...");
  for (let i = 1; i <= TOTAL_FARMERS; i += 1) {
    const email = `farmer${i}@gmail.com`;
    const firstName = `Farmer${i}`;
    const lastName = "Demo";
    const displayName = `${firstName} ${lastName}`;
    const phone = `077${String(1000000 + i).slice(-7)}`;

    const auth = await createAuthUser(apiKey, email, USER_PASSWORD, displayName);

    const profile = {
      uid: auth.localId,
      firstName,
      lastName,
      email,
      phone,
      role: "farmer",
      avatarUrl: "",
      avgResponseMin: 10,
      completedDeliveries: randomInt(5, 35),
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };

    await createUserProfile(accessToken, auth.localId, profile);

    users.push({ ...profile });
  }

  logStep("Creating buyer accounts + profiles...");
  for (let i = 1; i <= TOTAL_BUYERS; i += 1) {
    const email = `buyer${i}@gmail.com`;
    const firstName = `Buyer${i}`;
    const lastName = "Demo";
    const displayName = `${firstName} ${lastName}`;
    const phone = `071${String(2000000 + i).slice(-7)}`;

    const auth = await createAuthUser(apiKey, email, USER_PASSWORD, displayName);

    const profile = {
      uid: auth.localId,
      firstName,
      lastName,
      email,
      phone,
      role: "buyer",
      avatarUrl: "",
      avgResponseMin: 8,
      completedDeliveries: 0,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };

    await createUserProfile(accessToken, auth.localId, profile);

    users.push({ ...profile });
  }

  logStep("Creating transporter accounts + profiles...");
  for (let i = 1; i <= TOTAL_TRANSPORTERS; i += 1) {
    const email = `transporter${i}@gmail.com`;
    const firstName = `Transporter${i}`;
    const lastName = "Demo";
    const displayName = `${firstName} ${lastName}`;
    const phone = `075${String(3000000 + i).slice(-7)}`;

    const auth = await createAuthUser(apiKey, email, USER_PASSWORD, displayName);

    const profile = {
      uid: auth.localId,
      firstName,
      lastName,
      email,
      phone,
      role: "transporter",
      avatarUrl: "",
      avgResponseMin: 12,
      completedDeliveries: randomInt(12, 80),
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };

    await createUserProfile(accessToken, auth.localId, profile);

    users.push({ ...profile });
  }

  const farmers = users.filter((u) => u.role === "farmer");

  logStep("Generating stock and transport request records...");
  const stockJobs = [];

  for (const [farmerIndex, farmer] of farmers.entries()) {
    for (let stockIndex = 0; stockIndex < STOCKS_PER_FARMER; stockIndex += 1) {
      stockJobs.push({ farmer, farmerIndex, stockIndex });
    }
  }

  let createdStocks = 0;
  let createdRequests = 0;

  await mapLimit(stockJobs, 10, async ({ farmer, farmerIndex, stockIndex }) => {
    const vegetable = VEGETABLES[(farmerIndex + stockIndex) % VEGETABLES.length];
    const market = MARKETS[(farmerIndex + stockIndex) % MARKETS.length];
    const pickupLocation = randomFrom(PICKUP_LOCATIONS);
    const quality = randomInt(0, 4) === 0 ? "bad" : "good";

    const basePrice = BASE_PRICES[vegetable] || 200;
    const price = Math.max(50, basePrice + randomInt(-30, 45));
    const quantity = randomInt(80, 650);

    const createdAt = new Date(Date.now() - randomInt(0, 1000 * 60 * 60 * 24 * 20));

    const stockPayload = {
      vegetable,
      market,
      pickupLocation,
      quality,
      quantity,
      availableQtyKg: quantity,
      reservedQtyKg: 0,
      price,
      phone: farmer.phone,
      photoUrls: [imageUrlByVegetable[vegetable]],
      photoUrl: imageUrlByVegetable[vegetable],
      farmerId: farmer.uid,
      transportStatus: "available",
      createdAt,
    };

    const stockId = await createFirestoreDocument(accessToken, "stocks", stockPayload);
    createdStocks += 1;

    const requestPayload = {
      stockId,
      vegetable,
      market,
      pickupLocation,
      farmerId: farmer.uid,
      transporterId: null,
      status: "open",
      phone: farmer.phone,
      createdAt,
    };

    await createFirestoreDocument(accessToken, "transport_requests", requestPayload);
    createdRequests += 1;
  });

  const userCount = users.length;
  const farmerCount = farmers.length;
  const buyerCount = users.filter((u) => u.role === "buyer").length;
  const transporterCount = users.filter((u) => u.role === "transporter").length;

  logStep("Seed complete.");
  console.log("---------------- DEMO SEED SUMMARY ----------------");
  console.log(`Users total: ${userCount}`);
  console.log(`Farmers: ${farmerCount}`);
  console.log(`Buyers: ${buyerCount}`);
  console.log(`Transporters: ${transporterCount}`);
  console.log(`Stocks: ${createdStocks}`);
  console.log(`Transport requests: ${createdRequests}`);
  console.log(`Password for all seeded users: ${USER_PASSWORD}`);
  console.log("---------------------------------------------------");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
