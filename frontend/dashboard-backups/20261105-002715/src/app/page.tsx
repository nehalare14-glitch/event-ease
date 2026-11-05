"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import {
  ArrowRight,
  CalendarDays,
  CalendarClock,
  Code2,
  GraduationCap,
  Grid2X2,
  MapPin,
  Music,
  PlusCircle,
  Sparkles,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

type CampusEvent = {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  seats: number;
  bookedCount: number;
};

const categoryIcons = {
  Technology: Code2,
  Cultural: Music,
  Sports: Trophy,
  Workshops: GraduationCap,
};

function eventDate(event: CampusEvent): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return null;

  const time = /^\d{2}:\d{2}$/.test(event.time)
    ? event.time
    : "23:59";

  const value = new Date(`${event.date}T${time}:00`);

  return Number.isNaN(value.getTime()) ? null : value;
}

function readableDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value || "Date TBA";
  }

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }

      try {
        const token = await user.getIdTokenResult();
        if (active) setIsAdmin(token.claims.admin === true);
      } catch {
        if (active) setIsAdmin(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("status", "==", "published")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        setEvents(
          snapshot.docs
            .filter((item) => item.id !== "_setup")
            .map((item) => {
              const data = item.data();

              return {
                id: item.id,
                title: String(data.title ?? ""),
                category: String(data.category ?? ""),
                date: String(data.date ?? ""),
                time: String(data.time ?? ""),
                location: String(data.location ?? ""),
                seats: Number(data.seats ?? 0),
                bookedCount: Number(data.bookedCount ?? 0),
              };
            })
        );

        setLoading(false);
        setError("");
      },
      (reason) => {
        console.error("Dashboard events error:", reason);
        setError("Unable to load events right now.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, "categories"),
        where("active", "==", true)
      ),
      (snapshot) => {
        setCategories(
          snapshot.docs
            .filter((item) => item.id !== "_setup")
            .map((item) => item.id)
            .sort()
        );
      },
      (reason) => {
        console.error("Dashboard categories error:", reason);
      }
    );
  }, []);

  const upcoming = useMemo(() => {
    return events
      .filter((event) => {
        const date = eventDate(event);
        return date !== null && (now === null || date >= now);
      })
      .sort((a, b) => {
        const first = eventDate(a)?.getTime() ?? 0;
        const second = eventDate(b)?.getTime() ?? 0;
        return first - second;
      });
  }, [events, now]);

  const availableEvents = upcoming.filter(
    (event) => event.seats > event.bookedCount
  );

  const categoryNames = Array.from(
    new Set([
      ...categories,
      ...events.map((event) => event.category).filter(Boolean),
    ])
  ).sort();

  const featured = upcoming.slice(0, 3);

  const stats = [
    {
      label: "Upcoming Events",
      value: upcoming.length,
      icon: CalendarClock,
    },
    {
      label: "Categories",
      value: categoryNames.length,
      icon: Grid2X2,
    },
    {
      label: "Events With Seats",
      value: availableEvents.length,
      icon: Ticket,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
      <Sidebar />

      <div className="px-4 py-8 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">

          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-purple-900 to-indigo-950 p-8 text-white md:p-12">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-200">
              <Sparkles size={18} />
              EVENT EASE · CAMPUS HUB
            </div>

            <h1 className="mt-6 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
              Your Campus. Your Events.
              <span className="block text-violet-200">
                One Platform.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-violet-100">
              From technical workshops to cultural celebrations,
              discover campus experiences and reserve your spot.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/explore-events"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-violet-800 transition hover:bg-violet-100"
              >
                Explore Events
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/my-bookings"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-bold text-white transition hover:bg-white/10"
              >
                <Ticket size={18} />
                My Bookings
              </Link>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-violet-100 p-3 text-violet-700">
                    <Icon size={23} />
                  </div>

                  <p className="text-3xl font-extrabold">
                    {loading ? "—" : stat.value}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">
                  Explore Categories
                </h2>
                <p className="mt-1 text-slate-500">
                  Find events that match your interests.
                </p>
              </div>

              <Link
                href="/explore-events"
                className="inline-flex items-center gap-2 font-semibold text-violet-700"
              >
                Browse Events
                <ArrowRight size={17} />
              </Link>
            </div>

            {categoryNames.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
                No active categories available yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {categoryNames.map((name) => {
                  const Icon =
                    categoryIcons[
                      name as keyof typeof categoryIcons
                    ] ?? Grid2X2;

                  return (
                    <Link
                      key={name}
                      href={`/explore-events?category=${encodeURIComponent(name)}`}
                      className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-md"
                    >
                      <div className="mb-5 inline-flex rounded-xl bg-violet-100 p-4 text-violet-700">
                        <Icon size={27} />
                      </div>

                      <h3 className="text-lg font-bold">{name}</h3>

                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-violet-700">
                        Explore events
                        <ArrowRight
                          size={16}
                          className="transition group-hover:translate-x-1"
                        />
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">
                  Upcoming Events
                </h2>
                <p className="mt-1 text-slate-500">
                  Discover your next campus experience.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {isAdmin && (
                  <Link
                    href="/admin/add-event"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <PlusCircle size={17} />
                    Add Event
                  </Link>
                )}

                <Link
                  href="/explore-events"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700"
                >
                  View All
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-4 text-red-700"
              >
                {error}
              </p>
            )}

            {loading ? (
              <div
                role="status"
                className="rounded-2xl bg-white p-10 text-center text-slate-500"
              >
                Loading upcoming events...
              </div>
            ) : featured.length === 0 && !error ? (
              <div className="rounded-3xl border border-slate-100 bg-white px-6 py-14 text-center">
                <CalendarDays
                  size={44}
                  className="mx-auto mb-4 text-violet-600"
                />

                <h3 className="text-xl font-bold">
                  No upcoming events yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
                  Upcoming published events will appear here
                  automatically when they're available.
                </p>

                <Link
                  href="/explore-events"
                  className="mt-6 inline-flex rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white"
                >
                  Explore All Events
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featured.map((event) => {
                  const remaining = Math.max(
                    0,
                    event.seats - event.bookedCount
                  );

                  return (
                    <article
                      key={event.id}
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                    >
                      <div className="flex h-28 items-center justify-center bg-gradient-to-br from-violet-700 to-indigo-950 text-white">
                        <CalendarDays size={42} />
                      </div>

                      <div className="space-y-4 p-5">
                        <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                          {event.category || "General"}
                        </span>

                        <h3 className="text-xl font-bold">
                          {event.title}
                        </h3>

                        <div className="space-y-2 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            {readableDate(event.date)}
                            {event.time ? ` · ${event.time}` : ""}
                          </p>

                          <p className="flex items-center gap-2">
                            <MapPin size={16} />
                            {event.location || "Venue TBA"}
                          </p>

                          <p className="flex items-center gap-2">
                            <Users size={16} />
                            {remaining} seats available
                          </p>
                        </div>

                        <Link
                          href={`/events/${encodeURIComponent(event.id)}`}
                          className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 font-semibold text-white hover:bg-violet-800"
                        >
                          View Details
                          <ArrowRight size={17} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
            Event Ease — Discover. Connect. Experience.
          </footer>
        </div>
      </div>
    </main>
  );
}