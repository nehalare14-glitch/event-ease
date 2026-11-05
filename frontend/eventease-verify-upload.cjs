const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const projectId = "event-ease-72da6";

async function main() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Firestore emulator detected. Stopping.");
  }

  initializeApp({
    credential: applicationDefault(),
    projectId
  });

  const db = getFirestore();

  console.log("\n=== FIREBASE PROJECT ===");
  console.log(projectId);

  console.log("\n=== CATEGORIES ===");

  const categories = await db.collection("categories").get();

  if (categories.empty) {
    console.log("No category documents found.");
  } else {
    categories.forEach(doc => {
      console.log(
        doc.id,
        "| active:",
        doc.data().active
      );
    });
  }

  console.log("\n=== EXISTING EVENT IDS ===");

  const ids = [
    "sports-championship-2026",
    "tech-innovation-expo-2026",
    "web-development-bootcamp-2026",
    "ai-ml-workshop-2026"
  ];

  for (const id of ids) {
    const doc = await db.collection("events").doc(id).get();

    console.log(
      id,
      doc.exists ? "ALREADY EXISTS" : "AVAILABLE"
    );
  }

  console.log("\n=== FIREBASE ADMIN USERS ===");

  const users = await getAuth().listUsers(1000);

  const administrators = users.users.filter(
    user => user.customClaims?.admin === true
  );

  console.log("Admin accounts found:", administrators.length);

  administrators.forEach(user => {
    console.log("Admin UID:", user.uid);
  });

  console.log("\nREAD-ONLY CHECK COMPLETE");
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});