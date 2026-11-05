"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";

type Booking = {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  createdAt?: Timestamp;
};

export default function AdminBookingsPage() {
  const [access, setAccess] = useState<"loading" | "admin" | "denied">("loading");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopBookings: (() => void) | undefined;
    let active = true;
    const stopAuth = onAuthStateChanged(auth, async (user) => {
      stopBookings?.();
      stopBookings = undefined;
      setBookings([]);
      setError("");
      if (!user) { if (active) setAccess("denied"); return; }
      try {
        const token = await user.getIdTokenResult();
        if (!active) return;
        if (token.claims.admin !== true) { setAccess("denied"); return; }
        setAccess("admin");
        stopBookings = onSnapshot(
          query(collection(db, "bookings"), orderBy("createdAt", "desc")),
          (snapshot) => {
            if (!active) return;
            setBookings(snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                eventId: String(data.eventId || ""),
                eventTitle: String(data.eventTitle || "Untitled event"),
                userId: String(data.userId || ""),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
              };
            }));
          },
          (err) => { if (active) setError(err.message); }
        );
      } catch (err) {
        console.error("Admin verification failed", err);
        if (active) setAccess("denied");
      }
    });
    return () => { active = false; stopAuth(); stopBookings?.(); };
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
      <Sidebar />
      <div className="p-6 lg:ml-64 md:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Manage Bookings</h1>
              <p className="mt-2 text-slate-500">Student registrations for your campus events.</p>
            </div>
            <Link href="/admin/manage-events" className="rounded-xl border border-violet-200 bg-white px-5 py-3 font-semibold text-violet-700">Back to Manage Events</Link>
          </div>
          {access === "loading" ? (
            <p>Checking administrator access...</p>
          ) : access === "denied" ? (
            <div className="rounded-2xl bg-white p-8">Access denied. Administrator login required.</div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total confirmed registrations</p>
                <p className="mt-1 text-4xl font-bold text-violet-700">{bookings.length}</p>
              </div>
              {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">Unable to load bookings: {error}</p>}
              {!error && bookings.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-slate-500">No student bookings yet.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-violet-50 text-violet-900"><tr><th className="p-4">Event</th><th className="p-4">Student ID</th><th className="p-4">Booked on</th><th className="p-4">Status</th></tr></thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="border-t border-slate-100">
                          <td className="p-4 font-semibold">{booking.eventTitle}</td>
                          <td className="p-4 break-all">{booking.userId}</td>
                          <td className="p-4">{booking.createdAt ? booking.createdAt.toDate().toLocaleString() : "Pending"}</td>
                          <td className="p-4 text-emerald-700">Confirmed</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}