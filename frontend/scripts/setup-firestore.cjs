const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(
  __dirname,
  "..",
  "eventease-firebase-admin-key.json"
);

if (!fs.existsSync(keyPath)) {
  console.error("ERROR: Firebase service account key not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(keyPath, "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function setupFirestore() {
  const collections = [
    "users",
    "events",
    "bookings",
    "categories",
    "announcements",
  ];

  for (const collectionName of collections) {
    await db.collection(collectionName).doc("_setup").set({
      setup: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log("Created: " + collectionName);
  }

  console.log("SUCCESS: All 5 Firestore collections created!");
}

setupFirestore().catch((error) => {
  console.error("Firestore error:", error);
  process.exitCode = 1;
});
