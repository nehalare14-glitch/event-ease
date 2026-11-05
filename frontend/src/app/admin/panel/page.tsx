"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, type DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import { CalendarDays, CalendarCheck, Users, Ticket, PlusCircle, Settings2, ClipboardList, Search, Download, RefreshCw, AlertCircle, ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";

type EventRow = { id: string; title: string; category: string; date: string; time: string; location: string; status: string; seats: number; bookedCount: number };
type BookingRow = { id: string; eventId: string; status: string };
const number = (value: unknown) => { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; };
const string = (value: unknown) => typeof value === "string" ? value : "";
const eventDate = (date: string) => { const d = new Date(`${date}T12:00:00`); return Number.isNaN(d.getTime()) ? null : d; };
const csvCell = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;

export default function AdminPanelPage() {
  const [access, setAccess] = useState<"loading" | "admin" | "denied">("loading");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [eventsReady, setEventsReady] = useState(false);
  const [bookingsReady, setBookingsReady] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [bookingsError, setBookingsError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (active) setAccess("denied"); return; }
      try {
        const token = await user.getIdTokenResult(true);
        if (active) setAccess(token.claims.admin === true ? "admin" : "denied");
      } catch { if (active) setAccess("denied"); }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (access !== "admin") return;
    const stopEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.filter((doc) => doc.id !== "_setup").map((doc) => {
        const data: DocumentData = doc.data();
        return { id: doc.id, title: string(data.title) || "Untitled event", category: string(data.category) || "Uncategorized", date: string(data.date), time: string(data.time), location: string(data.location), status: string(data.status) || "unspecified", seats: number(data.seats), bookedCount: number(data.bookedCount) };
      }));
      setEventsError(""); setEventsReady(true);
    }, (error) => { setEventsError(error.message); setEventsReady(true); });
    const stopBookings = onSnapshot(collection(db, "bookings"), (snapshot) => {
      setBookings(snapshot.docs.filter((doc) => doc.id !== "_setup").map((doc) => ({ id: doc.id, eventId: string(doc.data().eventId), status: string(doc.data().status) })));
      setBookingsError(""); setBookingsReady(true);
    }, (error) => { setBookingsError(error.message); setBookingsReady(true); });
    return () => { stopEvents(); stopBookings(); };
  }, [access]);

  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    setToday(currentDate);
  }, []);
  const eventIds = useMemo(() => new Set(events.map((event) => event.id)), [events]);
  const relatedBookings = useMemo(() => bookings.filter((booking) => eventIds.has(booking.eventId)), [bookings, eventIds]);
  const upcoming = events.filter((event) => { const date = eventDate(event.date); return date !== null && today !== null && date >= today && !["cancelled", "completed", "draft"].includes(event.status.toLowerCase()); }).length;
  const remainingSeats = events.reduce((sum, event) => sum + Math.max(0, event.seats - event.bookedCount), 0);
  const filtered = events.filter((event) => {
    const matchesText = `${event.title} ${event.category} ${event.location}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesText && (filter === "all" || event.status.toLowerCase() === filter);
  }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const ready = eventsReady && bookingsReady;
  const stats = [
    { title: "Total Events", value: eventsError ? "—" : eventsReady ? events.length : "…", Icon: CalendarDays },
    { title: "Upcoming Events", value: eventsError ? "—" : eventsReady ? upcoming : "…", Icon: CalendarCheck },
    { title: "Related Bookings", value: eventsError || bookingsError ? "—" : ready ? relatedBookings.length : "…", Icon: Users },
    { title: "Available Seats", value: eventsError ? "—" : eventsReady ? remainingSeats : "…", Icon: Ticket },
  ];

  function exportCsv() {
    const columns = ["Event ID", "Title", "Category", "Date", "Time", "Venue", "Status", "Capacity", "Booked Count", "Available Seats", "Booking Documents"];
    const counts = new Map<string, number>();
    for (const booking of relatedBookings) counts.set(booking.eventId, (counts.get(booking.eventId) || 0) + 1);
    const lines = [columns.map(csvCell).join(","), ...filtered.map((event) => [event.id, event.title, event.category, event.date, event.time, event.location, event.status, event.seats, event.bookedCount, Math.max(0, event.seats - event.bookedCount), counts.get(event.id) || 0].map(csvCell).join(","))];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "eventease-events-report.csv"; anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="min-h-screen bg-[#f8f9fd] text-slate-900">
    <Sidebar />
    <main className="p-5 md:ml-64 md:p-10">
      {access === "loading" ? <p role="status" className="text-slate-500">Checking administrator access…</p> : access === "denied" ?
        <section className="rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">Access Denied</h1><p className="mt-3 text-slate-600">This page is available only to administrators.</p><Link className="mt-4 inline-block font-semibold text-violet-700" href="/admin/login">Admin sign in</Link></section> :
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="rounded-3xl border border-violet-100 bg-white p-7 shadow-sm md:p-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-violet-700"><ShieldCheck size={18}/> Event Ease Administration</p><h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Admin Dashboard</h1><p className="mt-3 text-slate-600">Manage campus events, bookings and available seats in one place.</p></div>
              <Link href="/admin/add-event" className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800"><PlusCircle size={18}/> Create Event</Link>
            </div>
          </header>
          {(eventsError || bookingsError) && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><div className="flex items-center gap-2 font-semibold"><AlertCircle size={18}/> Firestore data could not be fully loaded</div>{eventsError && <p className="mt-2">Events: {eventsError}</p>}{bookingsError && <p className="mt-2">Bookings: {bookingsError}</p>}<p className="mt-2">Check your admin Firestore read permissions. No data was changed.</p></div>}
          <section aria-label="Dashboard statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({title, value, Icon}) => <div key={title} className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"><div className="inline-flex rounded-xl bg-violet-100 p-3 text-violet-700"><Icon size={22}/></div><p className="mt-5 text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></div>)}</section>
          <section className="grid gap-4 sm:grid-cols-3" aria-label="Quick actions">
            <Link href="/admin/add-event" className="flex items-center justify-between rounded-2xl border border-violet-100 bg-white p-5 font-semibold text-violet-800 hover:border-violet-400"><span className="flex items-center gap-3"><PlusCircle size={21}/> Create Event</span><ArrowUpRight size={18}/></Link>
            <Link href="/admin/manage-events" className="flex items-center justify-between rounded-2xl border border-violet-100 bg-white p-5 font-semibold text-violet-800 hover:border-violet-400"><span className="flex items-center gap-3"><Settings2 size={21}/> Manage Events</span><ArrowUpRight size={18}/></Link>
            <Link href="/admin/bookings" className="flex items-center justify-between rounded-2xl border border-violet-100 bg-white p-5 font-semibold text-violet-800 hover:border-violet-400"><span className="flex items-center gap-3"><ClipboardList size={21}/> View Bookings</span><ArrowUpRight size={18}/></Link>
          </section>
          <section className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Events Overview</h2><p className="mt-1 text-sm text-slate-500">Live event records, excluding the _setup document.</p></div><button type="button" onClick={exportCsv} disabled={!ready || Boolean(eventsError || bookingsError)} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"><Download size={17}/> Export CSV</button></div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search events</span><Search className="absolute left-3 top-3 text-slate-400" size={19}/><input className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-violet-500" placeholder="Search title, category or venue" value={search} onChange={(e) => setSearch(e.target.value)}/></label><label><span className="sr-only">Filter by status</span><select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option>{Array.from(new Set(events.map((event) => event.status.toLowerCase()))).sort().map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div>
            {!eventsReady ? <p role="status" className="py-10 text-slate-500">Loading events…</p> : eventsError ? <p className="py-10 text-red-600">Unable to display events.</p> : filtered.length === 0 ? <p className="py-10 text-center text-slate-500">No matching events found. Create an event or adjust your filters.</p> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="py-3 pr-4">Event</th><th className="py-3 pr-4">Date / Time</th><th className="py-3 pr-4">Venue</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Seats</th><th className="py-3">Action</th></tr></thead><tbody>{filtered.slice(0, 20).map((event) => <tr key={event.id} className="border-b border-slate-100"><td className="py-4 pr-4"><p className="font-semibold">{event.title}</p><p className="text-xs text-slate-500">{event.category}</p></td><td className="py-4 pr-4">{event.date || "—"}<p className="text-xs text-slate-500">{event.time}</p></td><td className="py-4 pr-4"><span className="inline-flex items-center gap-1"><MapPin size={14}/>{event.location || "—"}</span></td><td className="py-4 pr-4"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">{event.status}</span></td><td className="py-4 pr-4">{event.bookedCount} / {event.seats}<p className="text-xs text-slate-500">{Math.max(0,event.seats-event.bookedCount)} left</p></td><td className="py-4"><Link href="/admin/manage-events" className="font-semibold text-violet-700 hover:underline">Manage</Link></td></tr>)}</tbody></table>{filtered.length > 20 && <p className="mt-4 text-xs text-slate-500">Showing 20 of {filtered.length} matching events. Export CSV for the full filtered list.</p>}</div>}
          </section>
          <p className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw size={14}/> Statistics update automatically when Firestore data changes. Booking documents and bookedCount are shown separately because their values may differ.</p>
        </div>}
    </main>
  </div>;
}
