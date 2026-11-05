const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");

const {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} = require("firebase/firestore");

const fs = require("node:fs");

async function main() {
  const env = await initializeTestEnvironment({
    projectId: "event-ease-72da6",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });

  try {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, "bookings", "event1_student1"), {
        eventId: "event1",
        eventTitle: "Test Event",
        userId: "student1",
      });

      await setDoc(doc(db, "bookings", "event2_student2"), {
        eventId: "event2",
        eventTitle: "Other Event",
        userId: "student2",
      });
    });

    const studentDb = env.authenticatedContext("student1").firestore();

    console.log("Testing student's own booking...");
    await assertSucceeds(
      getDoc(doc(studentDb, "bookings", "event1_student1"))
    );
    console.log("PASS: Student can read own booking.");

    console.log("Testing another student's booking...");
    await assertFails(
      getDoc(doc(studentDb, "bookings", "event2_student2"))
    );
    console.log("PASS: Other student's booking denied.");

    console.log("Testing My Bookings query...");
    const snapshot = await assertSucceeds(
      getDocs(
        query(
          collection(studentDb, "bookings"),
          where("userId", "==", "student1")
        )
      )
    );

    if (
      snapshot.size !== 1 ||
      snapshot.docs[0].data().userId !== "student1"
    ) {
      throw new Error("Unexpected query results.");
    }

    console.log("PASS: My Bookings query succeeded.");

    console.log("Testing unfiltered bookings query...");
    await assertFails(
      getDocs(collection(studentDb, "bookings"))
    );
    console.log("PASS: Unfiltered bookings query denied.");

    console.log("ALL BOOKING READ TESTS PASSED.");
  } finally {
    await env.cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
