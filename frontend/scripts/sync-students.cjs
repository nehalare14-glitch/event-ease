const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const keyPath = path.join(
  __dirname,
  "..",
  "eventease-firebase-admin-key.json"
);

if (!fs.existsSync(keyPath)) {
  console.error("Firebase Admin key file not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(keyPath, "utf8")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

async function syncStudentProfiles() {
  const auth = getAuth();
  const db = getFirestore();

  let nextPageToken;
  let created = 0;
  let skipped = 0;

  do {
    const page = await auth.listUsers(1000, nextPageToken);

    for (const user of page.users) {
      // Never create student profiles for administrators.
      if (user.customClaims?.admin === true) {
        skipped++;
        continue;
      }

      // Skip accounts without an email address.
      if (!user.email) {
        skipped++;
        continue;
      }

      const profileRef = db.collection("users").doc(user.uid);
      const existing = await profileRef.get();

      // Never overwrite existing profiles.
      if (existing.exists) {
        skipped++;
        continue;
      }

      const name =
        user.displayName?.trim() ||
        user.email.split("@")[0];

      await profileRef.create({
        uid: user.uid,
        name,
        email: user.email,
        role: "student",
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log("Created student profile:", user.email);
      created++;
    }

    nextPageToken = page.pageToken;
  } while (nextPageToken);

  console.log("Completed.");
  console.log("Profiles created:", created);
  console.log("Accounts skipped:", skipped);
}

syncStudentProfiles().catch((error) => {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
});
