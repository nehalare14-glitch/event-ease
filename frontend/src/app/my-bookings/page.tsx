"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Ticket,
  Trash2,
  AlertCircle,
  Search,
} from "lucide-react";

type Booking = {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  createdAt?: Timestamp | null;
};

type EventInfo = {
  date: string;
  time: string;
  location: string;
};

function bookingDate(value?: Timestamp | null): string {
  if (!value || typeof value.toDate !== "function") {
    return "Date unavailable";
  }

  return value.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value || "Date unavailable";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function BookingCard({
  booking,
  busy,
  onCancel,
}: {
  booking: Booking;
  busy: boolean;
  onCancel: (booking: Booking) => Promise<void>;
}) {
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [eventMissing, setEventMissing] = useState(false);

  useEffect(() => {
    return onSnapshot(
      doc(db, "events", booking.eventId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setEventMissing(true);
          setEventInfo(null);
          return;
        }

        const data = snapshot.data();

        setEventMissing(false);
        setEventInfo({
          date: String(data.date ?? ""),
          time: String(data.time ?? ""),
          location: String(data.location ?? ""),
        });
      },
      (reason) => {
        console.error("Unable to load booked event:", reason);
        setEventInfo(null);
      }
    );
  }, [booking.eventId]);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={15} />
          Confirmed
        </span>

        <span className="text-xs text-slate-500">
          Booked on {bookingDate(booking.createdAt)}
        </span>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {booking.eventTitle || "Campus Event"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your place is reserved for this event.
          </p>
        </div>

        {eventInfo && (
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays
                size={17}
                className="shrink-0 text-violet-600"
              />
              {displayDate(eventInfo.date)}
            </p>

            <p className="flex items-center gap-2">
              <Clock3
                size={17}
                className="shrink-0 text-violet-600"
              />
              {eventInfo.time || "Time unavailable"}
            </p>

            <p className="flex items-center gap-2 sm:col-span-2">
              <MapPin
                size={17}
                className="shrink-0 text-violet-600"
              />
              {eventInfo.location || "Venue unavailable"}
            </p>
          </div>
        )}

        {eventMissing && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            This event is no longer available.
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          {!eventMissing && (
            <Link
              href={`/events/${encodeURIComponent(booking.eventId)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              View Event
              <ArrowRight size={16} />
            </Link>
          )}

          <button
            type="button"
            disabled={busy || eventMissing}
            onClick={() => void onCancel(booking)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={16} />
            {busy ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MyBookingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      (reason) => {
        setError(reason.message);
        setAuthLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    setBookingsLoading(true);
    setError("");

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid)
    );

    return onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const items: Booking[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            eventId: String(data.eventId ?? ""),
            eventTitle: String(data.eventTitle ?? ""),
            userId: String(data.userId ?? ""),
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt
                : null,
          };
        });

        setBookings(items);
        setBookingsLoading(false);
        setError("");
      },
      (reason) => {
        console.error("Unable to load bookings:", reason);
        setBookings([]);
        setBookingsLoading(false);
        setError(
          reason.code === "permission-denied"
            ? "Firestore denied access to your bookings. Your query is already restricted to your account; check that the deployed booking rules match your local firestore.rules."
            : `Unable to load bookings: ${reason.message}`
        );
      }
    );
  }, [user]);

  const filtered = useMemo(() => {
    return bookings
      .filter((booking) =>
        booking.eventTitle
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
      .sort((a, b) => {
        const first = a.createdAt?.toMillis() ?? 0;
        const second = b.createdAt?.toMillis() ?? 0;
        return second - first;
      });
  }, [bookings, search]);

  async function cancel(booking: Booking) {
    if (!user || busy !== null) return;
    if (booking.userId !== user.uid) return;

    const confirmed = window.confirm(
      `Cancel your booking for "${booking.eventTitle}"?`
    );

    if (!confirmed) return;

    setBusy(booking.id);
    setError("");

    try {
      const bookingRef = doc(db, "bookings", booking.id);
      const eventRef = doc(db, "events", booking.eventId);

      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        const eventDoc = await transaction.get(eventRef);

        if (!bookingDoc.exists() || !eventDoc.exists()) {
          throw new Error("Booking or event not found.");
        }

        const bookingData = bookingDoc.data();

        if (
          bookingData.userId !== user.uid ||
          bookingData.eventId !== booking.eventId ||
          booking.id !== `${booking.eventId}_${user.uid}`
        ) {
          throw new Error("This booking does not belong to your account.");
        }

        const count = Number(eventDoc.data().bookedCount ?? 0);

        if (!Number.isInteger(count) || count < 1) {
          throw new Error(
            "Invalid booking count. Please contact an administrator."
          );
        }

        transaction.delete(bookingRef);
        transaction.update(eventRef, {
          bookedCount: count - 1,
        });
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? `Cancellation failed: ${reason.message}`
          : "Cancellation failed."
      );
    } finally {
      setBusy(null);
    }
  }

  const loading = authLoading || bookingsLoading;

  return (
    <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
      <Sidebar />

      <div className="px-4 py-8 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-7">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                <Ticket size={18} />
                MY EVENTS
              </div>

              <h1 className="text-3xl font-extrabold md:text-4xl">
                My Bookings
              </h1>

              <p className="mt-3 text-slate-500">
                View and manage your campus event reservations.
              </p>
            </div>

            <Link
              href="/explore-events"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800"
            >
              Explore Events
              <ArrowRight size={17} />
            </Link>
          </header>

          {user && !loading && !error && (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                  <Ticket size={23} />
                </div>

                <div>
                  <p className="text-2xl font-extrabold">
                    {bookings.length}
                  </p>
                  <p className="text-sm text-slate-500">
                    Confirmed Bookings
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  aria-label="Search my bookings"
                  placeholder="Search booked events..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500"
                />
              </div>
            </section>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div
              role="status"
              className="rounded-2xl bg-white p-10 text-center text-slate-500"
            >
              Loading your bookings...
            </div>
          ) : !user ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <Ticket
                size={42}
                className="mx-auto mb-4 text-violet-600"
              />

              <h2 className="text-xl font-bold">
                Log in to view your bookings
              </h2>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white"
              >
                Log In
              </Link>
            </div>
          ) : error && bookings.length === 0 ? null : bookings.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-14 text-center">
              <CalendarDays
                size={44}
                className="mx-auto mb-4 text-violet-600"
              />

              <h2 className="text-xl font-bold">
                No bookings yet
              </h2>

              <p className="mt-3 text-slate-500">
                Explore campus events and reserve your first spot.
              </p>

              <Link
                href="/explore-events"
                className="mt-6 inline-flex rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white"
              >
                Browse Events
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center">
              <h2 className="font-bold">No matching bookings</h2>
              <p className="mt-2 text-sm text-slate-500">
                Try another event name.
              </p>
            </div>
          ) : (
            <section className="grid gap-5">
              {filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  busy={busy === booking.id}
                  onCancel={cancel}
                />
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}