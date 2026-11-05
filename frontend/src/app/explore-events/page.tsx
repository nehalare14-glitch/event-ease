"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import {
  CalendarDays,
  Search,
  MapPin,
  Clock3,
  Ticket,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Users,
  RotateCcw,
  CalendarCheck,
  CalendarClock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  seats: number;
  bookedCount: number;
  organizer: string;
  registrationDeadline: string;
};

type DateFilter = "upcoming" | "past" | "all";
type AvailabilityFilter = "all" | "available" | "full";
type SortOption = "date-asc" | "date-desc" | "title" | "seats";

const PAGE_SIZE = 9;

const gradients: Record<string, string> = {
  Technology: "from-violet-600 to-indigo-900",
  Cultural: "from-pink-600 to-purple-900",
  Sports: "from-blue-600 to-cyan-800",
  Workshops: "from-emerald-600 to-teal-900",
};

function dateValue(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? Number.POSITIVE_INFINITY
    : parsed.getTime();
}

function formatDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value || "Date to be announced";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return value || "Time to be announced";
  }

  const [hour, minute] = value.split(":").map(Number);

  if (hour > 23 || minute > 59) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function isPast(event: EventItem, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
    return false;
  }

  const time = /^\d{2}:\d{2}$/.test(event.time)
    ? event.time
    : "23:59";

  const eventDate = new Date(`${event.date}T${time}:00`);

  return !Number.isNaN(eventDate.getTime()) &&
    eventDate.getTime() < now.getTime();
}

function seatsLeft(event: EventItem): number {
  return Math.max(0, event.seats - event.bookedCount);
}

export default function ExploreEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const requestedCategory = new URLSearchParams(
      window.location.search
    ).get("category");

    if (requestedCategory) {
      setCategory(requestedCategory);
    }
  }, []);
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("upcoming");
  const [availability, setAvailability] =
    useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortOption>("date-asc");
  const [page, setPage] = useState(1);

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const eventsQuery = query(
      collection(db, "events"),
      where("status", "==", "published")
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const results: EventItem[] = snapshot.docs
          .filter((item) => item.id !== "_setup")
          .map((item) => {
            const data = item.data();

            return {
              id: item.id,
              title: String(data.title ?? ""),
              description: String(data.description ?? ""),
              category: String(data.category ?? ""),
              date: String(data.date ?? ""),
              time: String(data.time ?? ""),
              location: String(data.location ?? ""),
              seats: Number(data.seats ?? 0),
              bookedCount: Number(data.bookedCount ?? 0),
              organizer: String(data.organizer ?? ""),
              registrationDeadline: String(
                data.registrationDeadline ?? ""
              ),
            };
          });

        setEvents(results);
        setLoading(false);
        setError("");
      },
      (reason) => {
        console.error("Explore Events error:", reason);
        setError(
          "Unable to load events. Please check your connection or access permissions."
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          events.map((event) => event.category).filter(Boolean)
        )
      ).sort(),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();

    const results = events.filter((event) => {
      const searchable = [
        event.title,
        event.description,
        event.category,
        event.location,
        event.organizer,
      ].join(" ").toLowerCase();

      if (!searchable.includes(term)) return false;

      if (category !== "All" && event.category !== category) {
        return false;
      }

      const past = now ? isPast(event, now) : false;

      if (dateFilter === "upcoming" && past) return false;
      if (dateFilter === "past" && !past) return false;

      const remaining = seatsLeft(event);

      if (availability === "available" && remaining <= 0) {
        return false;
      }

      if (availability === "full" && remaining > 0) {
        return false;
      }

      return true;
    });

    results.sort((a, b) => {
      if (sort === "title") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "seats") {
        return seatsLeft(b) - seatsLeft(a);
      }

      const difference = dateValue(a.date) - dateValue(b.date);

      if (Number.isNaN(difference)) return 0;

      if (difference !== 0) {
        return sort === "date-desc"
          ? -difference
          : difference;
      }

      return sort === "date-desc"
        ? b.time.localeCompare(a.time)
        : a.time.localeCompare(b.time);
    });

    return results;
  }, [
    events,
    search,
    category,
    dateFilter,
    availability,
    sort,
    now,
  ]);

  const upcomingCount = events.filter(
    (event) => !now || !isPast(event, now)
  ).length;

  const availableCount = events.filter(
    (event) =>
      (!now || !isPast(event, now)) &&
      seatsLeft(event) > 0
  ).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleEvents = filteredEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setDateFilter("upcoming");
    setAvailability("all");
    setSort("date-asc");
    setPage(1);
  }

  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
    "text-sm text-slate-700 outline-none focus:border-violet-500";

  return (
    <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
      <Sidebar />

      <div className="px-4 py-8 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Hero */}
          <section className="rounded-3xl bg-gradient-to-r from-violet-800 to-indigo-950 p-7 text-white md:p-12">
            <div className="mb-4 flex items-center gap-2 text-violet-200">
              <Sparkles size={18} />
              <span className="text-sm font-medium">
                Discover campus experiences
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Explore Events
            </h1>

            <p className="mt-4 max-w-2xl text-violet-100">
              Discover upcoming events, explore your interests,
              and reserve your spot.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Upcoming Events",
                  value: upcomingCount,
                  icon: CalendarClock,
                },
                {
                  label: "Categories",
                  value: Math.max(0, categories.length - 1),
                  icon: CalendarDays,
                },
                {
                  label: "Events With Seats",
                  value: availableCount,
                  icon: Ticket,
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4"
                  >
                    <Icon size={21} className="mb-3 text-violet-200" />
                    <p className="text-2xl font-bold">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="mt-1 text-xs text-violet-200">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Search */}
          <section className="space-y-5">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                aria-label="Search events"
                type="search"
                placeholder="Search events, categories, organizers or venues..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-5 outline-none focus:border-violet-500"
              />
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => {
                    setCategory(item);
                    resetPage();
                  }}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    category === item
                      ? "bg-violet-700 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-violet-50"
                  }`}
                >
                  {item === "All" ? "All Categories" : item}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-bold">
                  <SlidersHorizontal size={18} className="text-violet-700" />
                  Filters & Sorting
                </h2>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
                >
                  <RotateCcw size={15} />
                  Clear Filters
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Event Date
                  </span>

                  <select
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value as DateFilter);
                      resetPage();
                    }}
                    className={selectClass}
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="past">Past Events</option>
                    <option value="all">All Dates</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Availability
                  </span>

                  <select
                    value={availability}
                    onChange={(event) => {
                      setAvailability(
                        event.target.value as AvailabilityFilter
                      );
                      resetPage();
                    }}
                    className={selectClass}
                  >
                    <option value="all">All Events</option>
                    <option value="available">Seats Available</option>
                    <option value="full">Fully Booked</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Sort By
                  </span>

                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as SortOption);
                      resetPage();
                    }}
                    className={selectClass}
                  >
                    <option value="date-asc">Date: Earliest First</option>
                    <option value="date-desc">Date: Latest First</option>
                    <option value="title">Event Name: A–Z</option>
                    <option value="seats">Most Available Seats</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {dateFilter === "upcoming"
                    ? "Upcoming Events"
                    : dateFilter === "past"
                    ? "Past Events"
                    : "All Events"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading events..."
                    : `${filteredEvents.length} event${
                        filteredEvents.length === 1 ? "" : "s"
                      } found`}
                </p>
              </div>

              <Link
                href="/my-bookings"
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                <Ticket size={17} />
                My Bookings
              </Link>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
              >
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            {loading && (
              <div
                role="status"
                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              >
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse overflow-hidden rounded-2xl bg-white"
                  >
                    <div className="h-40 bg-slate-200" />
                    <div className="space-y-4 p-5">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="h-6 w-3/4 rounded bg-slate-200" />
                      <div className="h-4 w-full rounded bg-slate-200" />
                      <div className="h-10 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && filteredEvents.length === 0 && (
              <div className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center">
                <CalendarDays
                  size={46}
                  className="mx-auto mb-4 text-violet-600"
                />

                <h3 className="text-xl font-bold">
                  {events.length === 0
                    ? "No published events yet"
                    : "No matching events"}
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
                  {events.length === 0
                    ? "New events will appear here once they are published by an administrator."
                    : "Try changing your search, date, category, or availability filters."}
                </p>

                {events.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-6 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800"
                  >
                    Show Upcoming Events
                  </button>
                )}
              </div>
            )}

            {!loading && !error && visibleEvents.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleEvents.map((event) => {
                  const remaining = seatsLeft(event);
                  const full = remaining === 0;
                  const past = now ? isPast(event, now) : false;

                  const percent =
                    event.seats > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (event.bookedCount / event.seats) * 100
                          )
                        )
                      : 0;

                  const deadlinePassed =
                    now !== null &&
                    /^\d{4}-\d{2}-\d{2}$/.test(
                      event.registrationDeadline
                    ) &&
                    new Date(
                      `${event.registrationDeadline}T23:59:59`
                    ).getTime() < now.getTime();

                  const bookingClosed =
                    past || deadlinePassed;

                  return (
                    <article
                      key={event.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div
                        className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${
                          gradients[event.category] ??
                          "from-violet-600 to-slate-900"
                        } text-white`}
                      >
                        <CalendarDays size={48} />

                        <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                          {event.category || "General"}
                        </span>

                        <span
                          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${
                            bookingClosed
                              ? "bg-slate-100 text-slate-700"
                              : full
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {past
                            ? "Past Event"
                            : deadlinePassed
                            ? "Registration Closed"
                            : full
                            ? "Fully Booked"
                            : "Seats Available"}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="line-clamp-2 text-xl font-bold">
                          {event.title}
                        </h3>

                        <p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-500">
                          {event.description ||
                            "Explore this campus event and view its details."}
                        </p>

                        <div className="mt-5 space-y-3 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <CalendarDays
                              size={17}
                              className="shrink-0 text-violet-600"
                            />
                            {formatDate(event.date)}
                          </p>

                          <p className="flex items-center gap-2">
                            <Clock3
                              size={17}
                              className="shrink-0 text-violet-600"
                            />
                            {formatTime(event.time)}
                          </p>

                          <p className="flex items-center gap-2">
                            <MapPin
                              size={17}
                              className="shrink-0 text-violet-600"
                            />
                            <span className="break-words">
                              {event.location || "Venue to be announced"}
                            </span>
                          </p>

                          {event.organizer && (
                            <p className="flex items-center gap-2">
                              <Users
                                size={17}
                                className="shrink-0 text-violet-600"
                              />
                              <span className="break-words">
                                {event.organizer}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-slate-500">
                              Available Seats
                            </span>

                            <span className="font-bold text-slate-900">
                              {remaining} / {event.seats}
                            </span>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-violet-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {event.bookedCount} booked
                          </p>
                        </div>

                        <div className="mt-auto pt-5">
                          <Link
                            href={`/events/${encodeURIComponent(
                              event.id
                            )}`}
                            className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 font-semibold text-white transition hover:bg-violet-800"
                          >
                            View Event Details
                            <ArrowRight size={17} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setPage(Math.max(1, currentPage - 1))
                  }
                  className="flex items-center gap-1 rounded-xl border bg-white px-4 py-2 font-semibold disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage(Math.min(totalPages, currentPage + 1))
                  }
                  className="flex items-center gap-1 rounded-xl border bg-white px-4 py-2 font-semibold disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </section>

          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <CalendarCheck size={15} />
              Event Ease — Discover. Explore. Participate.
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}