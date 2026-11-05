const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");

const uid = process.argv[2];

if (!uid) {
  console.error("ERROR: Administrator UID is required.");
  process.exit(1);
}

const keyPath = path.join(
  __dirname,
  "..",
  "eventease-firebase-admin-key.json"
);

if (!fs.existsSync(keyPath)) {
  console.error("ERROR: Firebase Admin key file not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(keyPath, "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

async function setAdmin() {
  const auth = getAuth();

  const user = await auth.getUser(uid);

  if (!user.email || user.disabled) {
    throw new Error("Invalid or disabled administrator account.");
  }

  let pageToken;

  do {
    const page = await auth.listUsers(1000, pageToken);

    for (const account of page.users) {
      if (
        account.uid !== uid &&
        account.customClaims?.admin === true
      ) {
        throw new Error(
          "Another administrator already exists. No changes made."
        );
      }
    }

    pageToken = page.pageToken;
  } while (pageToken);

  await auth.setCustomUserClaims(uid, {
    ...user.customClaims,
    admin: true,
  });

  console.log("SUCCESS: Admin role assigned!");
  console.log("Admin UID:", uid);
  console.log("Admin Email:", user.email);
}

setAdmin().catch((error) => {
  console.error("ERROR:", error.message);
  process.exitCode = 1;
});
