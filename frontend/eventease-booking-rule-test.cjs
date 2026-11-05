const fs = require("fs");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");

async function main() {
  const projectId = "demo-event-ease-booking-test";

  const env = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8")
    }
  });

  try {
    const eventId = "test-diwali-event";
    const uid = "test-student-001";

    await env.withSecurityRulesDisabled(async (context) => {
      await context.firestore()
        .collection("events")
        .doc(eventId)
        .set({
          title: "Diwali",
          description: "Come and Enjoy the Program",
          category: "Cultural",
          date: "2026-11-08",
          time: "06:00",
          location: "Kshatriya College Of Engineering",
          seats: 100,
          bookedCount: 0,
          status: "published",
          createdBy: "test-admin",
          createdAt: new Date()
        });
    });

    const db = env.authenticatedContext(uid, {
      admin: false
    }).firestore();

    const eventRef = db.collection("events").doc(eventId);
    const bookingRef = db.collection("bookings").doc(
      `${eventId}_${uid}`
    );

    async function book() {
      return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(eventRef);

        if (!snapshot.exists) {
          throw new Error("Event not found");
        }

        const data = snapshot.data();

        transaction.update(eventRef, {
          bookedCount: Number(data.bookedCount || 0) + 1
        });

        transaction.set(bookingRef, {
          userId: uid,
          eventId,
          eventTitle: data.title,
          createdAt: require("firebase/compat/app")
            .firestore.FieldValue.serverTimestamp()
        });
      });
    }

    console.log("Testing first booking...");

    await assertSucceeds(book());

    console.log("PASS: First booking succeeded.");

    console.log("Testing duplicate booking...");

    await assertFails(book());

    console.log("PASS: Duplicate booking rejected.");

    await env.withSecurityRulesDisabled(async (context) => {
      const eventDoc = await context.firestore()
        .collection("events")
        .doc(eventId)
        .get();

      const bookingDoc = await context.firestore()
        .collection("bookings")
        .doc(`${eventId}_${uid}`)
        .get();

      console.log("Booked count:", eventDoc.data().bookedCount);
      console.log("Booking exists:", bookingDoc.exists);
    });

  } finally {
    await env.cleanup();
  }
}

main().catch((error) => {
  console.error("TEST FAILED:", error);
  process.exitCode = 1;
});