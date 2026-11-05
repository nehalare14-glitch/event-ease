import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";



function adminApp() {
  return getApps()[0] ?? initializeApp({
    credential: applicationDefault(),
    projectId: "event-ease-72da6",
  });
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Sign in as administrator." }, { status: 401 });
    }

    const app = adminApp();
    const token = await getAuth(app).verifyIdToken(authorization.slice(7), true);

    if (token.admin !== true) {
      return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    }

    const body = await request.json();
    const categoryId = body?.categoryId;

    if (
      typeof categoryId !== "string" ||
      !/^[A-Za-z][A-Za-z0-9 &-]{1,49}$/.test(categoryId)
    ) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const db = getFirestore(app);
    const categoryRef = db.collection("categories").doc(categoryId);
    const category = await categoryRef.get();

    if (!category.exists) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    if (category.data()?.name !== categoryId) {
      return NextResponse.json({ error: "Category data mismatch." }, { status: 409 });
    }

    const events = await db.collection("events")
      .where("category", "==", categoryId)
      .limit(1)
      .get();

    if (!events.empty) {
      return NextResponse.json({
        error: "This category is used by events. Reassign those events first.",
      }, { status: 409 });
    }

    // Prevent new event assignments before the final check.
    await categoryRef.update({ active: false });

    // Recheck events after deactivation.
    const remainingEvents = await db.collection("events")
      .where("category", "==", categoryId)
      .limit(1)
      .get();

    if (!remainingEvents.empty) {
      return NextResponse.json({
        error: "This category is assigned to events and cannot be deleted.",
      }, { status: 409 });
    }

    await categoryRef.delete();

    return NextResponse.json({
      success: true,
      message: `Category "${categoryId}" deleted successfully.`,
    });

  } catch (error) {
    console.error("Category deletion error:", error);
    return NextResponse.json({
      error: "Unable to process category deletion. Check server configuration.",
    }, { status: 500 });
  }
}
