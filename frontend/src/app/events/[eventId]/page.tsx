"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";

type EventData = {title: string; description: string; category: string; date: string; time: string; location: string; seats: number; bookedCount: number; status: string; organizer: string; schedule: string; eligibility: string; registrationDeadline: string; contactInfo: string; instructions: string};

function EventBookingContent() {
  const params = useParams<{eventId: string}>();
  const router = useRouter();
  const eventId = params.eventId;
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // EVENTEASE_AUTH_DIAGNOSTIC
  const [authDiagnostic, setAuthDiagnostic] = useState("Checking Firebase authentication...");

  useEffect(() => {
    return onAuthStateChanged(auth, async (current) => {
      if (!current) {
        setAuthDiagnostic("No user logged in");
        return;
      }

      try {
        const token = await current.getIdTokenResult(true);

        setAuthDiagnostic(JSON.stringify({
          projectId: auth.app.options.projectId,
          uid: current.uid,
          adminClaim: token.claims.admin ?? false,
          tokenProject: token.claims.aud
        }, null, 2));
      } catch (error) {
        setAuthDiagnostic(
          error instanceof Error ? error.message : "Authentication check failed"
        );
      }
    });
  }, []);

  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (current) => {
    setUser(current);
    if (!current) {setAdmin(false); return;}
    try {setAdmin((await current.getIdTokenResult()).claims.admin === true);} catch {setAdmin(false);}
  }), []);
  useEffect(() => {
    if (!eventId) return;
    return onSnapshot(doc(db, "events", eventId), (snapshot) => {
      if (!snapshot.exists()) {setEvent(null); setError("Event not found.");}
      else {const value = snapshot.data(); setEvent({
        title: String(value.title ?? ""), description: String(value.description ?? ""),
        category: String(value.category ?? ""), date: String(value.date ?? ""),
        time: String(value.time ?? ""), location: String(value.location ?? ""),
        seats: Number(value.seats ?? 0), bookedCount: Number(value.bookedCount ?? 0),
        status: String(value.status ?? ""),
        organizer: String(value.organizer ?? ""), schedule: String(value.schedule ?? ""),
        eligibility: String(value.eligibility ?? ""), registrationDeadline: String(value.registrationDeadline ?? ""),
        contactInfo: String(value.contactInfo ?? ""), instructions: String(value.instructions ?? ""),
      });}
      setLoading(false);
    }, (reason) => {setError("Unable to load event: " + reason.message); setLoading(false);});
  }, [eventId]);

  async function book() {
    if (!user || !event || admin || busy) return;
    setBusy(true); setError("");
    try {
      const eventRef = doc(db, "events", eventId);
      const bookingRef = doc(db, "bookings", `${eventId}_${user.uid}`);
      await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);

        if (!eventDoc.exists() || eventDoc.data().status !== "published") throw new Error("Event unavailable.");

        const data = eventDoc.data();
        const count = Number(data.bookedCount ?? 0);
        if (count >= Number(data.seats)) throw new Error("This event is fully booked.");
        transaction.update(eventRef, {bookedCount: count + 1});
        transaction.set(bookingRef, {
          userId: user.uid, eventId, eventTitle: String(data.title), createdAt: serverTimestamp(),
        });
      });
      router.push("/my-bookings");
    } catch (reason) {setError("Booking failed: " + (reason instanceof Error ? reason.message : "Unknown error"));}
    finally {setBusy(false);}
  }

  const available = event ? Math.max(0, event.seats - event.bookedCount) : 0;
  return <main className="min-h-screen bg-[#f8f9fd] text-slate-900"><Sidebar />
<aside className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-purple-300 bg-white p-4 text-xs text-black shadow-xl">
  <strong>Event Ease Firebase Diagnostic</strong>
  <pre className="mt-2 whitespace-pre-wrap">{authDiagnostic}</pre>
</aside>
    <div className="mx-auto max-w-3xl px-6 py-12 lg:ml-64">
      <Link href="/#events" className="text-violet-700 underline">Back to Events</Link>
      {loading ? <p className="mt-8">Loading event...</p> : event ? <article className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
        <p className="font-semibold text-violet-700">{event.category}</p>
        <h1 className="mt-3 text-3xl font-extrabold">{event.title}</h1>
        <p className="mt-4 text-slate-600">{event.description}</p>
        <p className="mt-5">{event.date} {" | "} {event.time} {" | "} {event.location}</p>
        <p className="mt-3 font-semibold">{available} of {event.seats} seats available</p>
        {(event.organizer || event.schedule || event.eligibility || event.registrationDeadline || event.contactInfo || event.instructions) && (
          <section className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/40 p-6">
            <h2 className="text-xl font-bold">Event Details</h2>
            <dl className="mt-4 grid gap-5">
              {([
                ["Organizer", event.organizer],
                ["Schedule / Activities", event.schedule],
                ["Eligibility", event.eligibility],
                ["Registration Deadline", event.registrationDeadline],
                ["Contact Information", event.contactInfo],
                ["Additional Instructions", event.instructions],
              ] as [string, string][]).filter(([, value]) => value.trim()).map(([label, value]) => (
                <div key={label}><dt className="text-sm font-bold text-violet-800">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-700">{value}</dd></div>
              ))}
            </dl>
          </section>
        )}
        {error && <p role="alert" className="mt-5 text-red-700">{error}</p>}
        {!user ? <Link href="/login" className="mt-6 inline-block rounded-xl bg-violet-700 px-6 py-3 text-white">Log in to book</Link> :
         admin ? <p className="mt-6 text-slate-500">Administrators cannot book events.</p> :
         <button disabled={busy || available === 0} onClick={book} className="mt-6 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Booking..." : available === 0 ? "Fully Booked" : "Confirm Booking"}</button>}
      </article> : <p className="mt-6">Event unavailable.</p>}
    </div></main>;
}

export default function EventBookingPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading booking...</p>}>
      <EventBookingContent />
    </Suspense>
  );
}