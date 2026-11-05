"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";

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
  status: string;
  organizer: string;
  schedule: string;
  eligibility: string;
  registrationDeadline: string;
  contactInfo: string;
  instructions: string;
};

export default function ManageEventsPage() {
  const [access, setAccess] = useState<"loading" | "admin" | "denied">("loading");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("date-asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setAccess("denied"); return; }
    try {
      const token = await user.getIdTokenResult();
      setAccess(token.claims.admin === true ? "admin" : "denied");
    } catch { setAccess("denied"); }
  }), []);

  useEffect(() => {
    if (access !== "admin") return;
    setLoadingEvents(true);
    return onSnapshot(collection(db, "events"),
      (snapshot) => {
        setError("");
        setLoadingEvents(false);
        setEvents(snapshot.docs.filter((item) => item.id !== "_setup").map((item) => {
          const value = item.data();
          return {
            id: item.id, title: String(value.title ?? ""), description: String(value.description ?? ""),
            category: String(value.category ?? "Technology"), date: String(value.date ?? ""),
            time: String(value.time ?? ""), location: String(value.location ?? ""),
            seats: Number(value.seats ?? 0), bookedCount: Number(value.bookedCount ?? 0),
            status: String(value.status ?? "published"),
            organizer: String(value.organizer ?? ""), schedule: String(value.schedule ?? ""),
            eligibility: String(value.eligibility ?? ""), registrationDeadline: String(value.registrationDeadline ?? ""),
            contactInfo: String(value.contactInfo ?? ""), instructions: String(value.instructions ?? ""),
          };
        }));
      }, (reason) => { setLoadingEvents(false); setError(reason.message); });
  }, [access]);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim() || !draft.location.trim() || !draft.description.trim() ||
        !Number.isInteger(draft.seats) || draft.seats > 100000 || draft.seats < Math.max(1, draft.bookedCount)) {
      setError("Fill all fields and keep capacity at least equal to booked seats."); return;
    }
    setBusy(true); setError("");
    try {
      await updateDoc(doc(db, "events", draft.id), {
        title: draft.title.trim(), description: draft.description.trim(), category: draft.category,
        date: draft.date, time: draft.time, location: draft.location.trim(), seats: draft.seats,
        organizer: draft.organizer.trim(), schedule: draft.schedule.trim(),
        eligibility: draft.eligibility.trim(), registrationDeadline: draft.registrationDeadline,
        contactInfo: draft.contactInfo.trim(), instructions: draft.instructions.trim(),
      });
      setEditing(null); setDraft(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save event"); }
    finally { setBusy(false); }
  }

  async function remove(event: EventItem) {
    if (event.id === "_setup") { setError("Protected setup document cannot be deleted."); return; }
    if (event.bookedCount > 0) { setError("Cannot delete an event with bookings."); return; }
    if (!window.confirm(`Delete ${event.title}? This cannot be undone.`)) return;
    setBusy(true); setError("");
    try { await deleteDoc(doc(db, "events", event.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete event"); }
    finally { setBusy(false); }
  }

  const filtered = events.filter((event) => {
    const text = `${event.title} ${event.location} ${event.category}`.toLowerCase();
    const status = event.status.toLowerCase();
    const effective = status === "published" && event.bookedCount >= event.seats ? "full" : status;
    return text.includes(search.toLowerCase().trim()) && (statusFilter === "all" || statusFilter === effective);
  }).sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "bookings") return b.bookedCount - a.bookedCount;
    return sort === "date-desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice((Math.min(page, pageCount) - 1) * pageSize, Math.min(page, pageCount) * pageSize);
  const booked = events.reduce((total, event) => total + event.bookedCount, 0);
  const capacity = events.reduce((total, event) => total + event.seats, 0);
  const exportCsv = () => {
    const cols = ["Title", "Category", "Date", "Time", "Location", "Status", "Capacity", "Booked", "Available"];
    const esc = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = filtered.map((e) => [e.title, e.category, e.date, e.time, e.location, e.status, e.seats, e.bookedCount, Math.max(0, e.seats - e.bookedCount)]);
    const csv = "\uFEFF" + [cols, ...rows].map((row) => row.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "event-ease-events.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
    <Sidebar />
    <div className="p-6 lg:ml-64 lg:p-10">
      {access === "loading" ? <p>Checking administrator access...</p> :
       access === "denied" ? <p>Access Denied - administrators only.</p> : <>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-3xl font-extrabold">Manage Events</h1>
            <p className="mt-2 text-slate-500">Edit events and monitor booked seats.</p></div>
          <div className="flex gap-3"><Link href="/admin/bookings" className="rounded-xl border px-5 py-3 font-semibold">View Bookings</Link><Link href="/admin/add-event" className="rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white">Add Event</Link></div>
        </div>
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Total events</p><p className="text-2xl font-bold">{events.length}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Booked seats</p><p className="text-2xl font-bold">{booked}</p></div>
          <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Available seats</p><p className="text-2xl font-bold">{Math.max(0, capacity - booked)}</p></div>
        </div>
        <div className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
          <input aria-label="Search events" placeholder="Search title, venue, category" value={search} onChange={(e) => {setSearch(e.target.value);setPage(1);}} className="rounded-lg border p-3 md:col-span-2" />
          <select aria-label="Filter status" value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value);setPage(1);}} className="rounded-lg border p-3">
            {["all", "published", "draft", "full", "completed", "cancelled"].map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value}</option>)}
          </select>
          <select aria-label="Sort events" value={sort} onChange={(e) => {setSort(e.target.value);setPage(1);}} className="rounded-lg border p-3">
            <option value="date-asc">Date: earliest first</option><option value="date-desc">Date: latest first</option><option value="title">Title A-Z</option><option value="bookings">Most bookings</option>
          </select>
          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Showing {filtered.length} of {events.length} events. Status changes require updated Firestore rules.</p>
            <button onClick={exportCsv} disabled={filtered.length === 0} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40">Export CSV</button>
          </div>
        </div>
        <div className="grid gap-5">
          {loadingEvents && <p role="status">Loading events...</p>}
          {!loadingEvents && events.length === 0 && <p className="rounded-xl bg-white p-6">No events found. Use Add Event to create your first event.</p>}
          {!loadingEvents && events.length > 0 && filtered.length === 0 && <p className="rounded-xl bg-white p-6">No events match your filters.</p>}
          {shown.map((event) => <section key={event.id} className="rounded-2xl bg-white p-6 shadow-sm">
            {editing === event.id && draft ? <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Event title" className="rounded-lg border p-3" value={draft.title} onChange={(e) => setDraft({...draft, title: e.target.value})} />
              <select aria-label="Category" className="rounded-lg border p-3" value={draft.category} onChange={(e) => setDraft({...draft, category: e.target.value})}>
                {["Technology", "Cultural", "Sports", "Workshops"].map((category) => <option key={category}>{category}</option>)}
              </select>
              <input aria-label="Date" type="date" className="rounded-lg border p-3" value={draft.date} onChange={(e) => setDraft({...draft, date: e.target.value})} />
              <input aria-label="Time" type="time" className="rounded-lg border p-3" value={draft.time} onChange={(e) => setDraft({...draft, time: e.target.value})} />
              <input aria-label="Location" className="rounded-lg border p-3" value={draft.location} onChange={(e) => setDraft({...draft, location: e.target.value})} />
              <input aria-label="Capacity" type="number" min={Math.max(1, draft.bookedCount)} className="rounded-lg border p-3" value={draft.seats} onChange={(e) => setDraft({...draft, seats: Number(e.target.value)})} />
              <textarea aria-label="Description" className="rounded-lg border p-3 md:col-span-2" value={draft.description} onChange={(e) => setDraft({...draft, description: e.target.value})} />
              <div className="md:col-span-2 border-t pt-3 font-bold">Additional Event Details</div>
              <label className="text-sm font-semibold">Organizer<input aria-label="Organizer" maxLength={150} className="mt-1 w-full rounded-lg border p-3" value={draft.organizer} onChange={(e) => setDraft({...draft, organizer: e.target.value})} /></label>
              <label className="text-sm font-semibold">Registration Deadline<input aria-label="Registration Deadline" type="date" className="mt-1 w-full rounded-lg border p-3" value={draft.registrationDeadline} onChange={(e) => setDraft({...draft, registrationDeadline: e.target.value})} /></label>
              <label className="text-sm font-semibold md:col-span-2">Schedule / Activities<textarea aria-label="Schedule" maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border p-3" value={draft.schedule} onChange={(e) => setDraft({...draft, schedule: e.target.value})} /></label>
              <label className="text-sm font-semibold md:col-span-2">Eligibility<textarea aria-label="Eligibility" maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border p-3" value={draft.eligibility} onChange={(e) => setDraft({...draft, eligibility: e.target.value})} /></label>
              <label className="text-sm font-semibold md:col-span-2">Contact Information<input aria-label="Contact Information" maxLength={200} className="mt-1 w-full rounded-lg border p-3" value={draft.contactInfo} onChange={(e) => setDraft({...draft, contactInfo: e.target.value})} /></label>
              <label className="text-sm font-semibold md:col-span-2">Additional Instructions<textarea aria-label="Additional Instructions" maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border p-3" value={draft.instructions} onChange={(e) => setDraft({...draft, instructions: e.target.value})} /></label>
              <div className="flex gap-3"><button disabled={busy} onClick={save} className="rounded-lg bg-violet-700 px-5 py-2 text-white">Save</button>
                <button onClick={() => {setEditing(null); setDraft(null);}} className="rounded-lg border px-5 py-2">Cancel</button></div>
            </div> : <>
              <h2 className="text-xl font-bold">{event.title}</h2>
              <p className="mt-2 text-slate-500">{event.date}  -  {event.time}  -  {event.location}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-violet-50 px-3 py-1 text-violet-800">{event.category}</span><span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{event.status}</span></div>
              <p className="mt-3">{event.bookedCount} booked / {event.seats} total seats · {Math.max(0, event.seats - event.bookedCount)} available</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-violet-600" style={{width: `${event.seats ? Math.min(100, 100 * event.bookedCount / event.seats) : 0}%`}} /></div>
              <div className="mt-4 flex gap-3">
                <button disabled={busy} onClick={() => {setEditing(event.id); setDraft({...event});}} className="rounded-lg bg-violet-700 px-4 py-2 text-white">Edit</button>
                <button disabled={busy || event.bookedCount > 0} onClick={() => remove(event)} className="rounded-lg border border-red-200 px-4 py-2 text-red-700 disabled:opacity-40">Delete</button>
              </div>
            </>}
          </section>)}
        </div>
        {filtered.length > pageSize && <div className="mt-6 flex items-center justify-center gap-4">
          <button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
          <span className="text-sm">Page {Math.min(page, pageCount)} of {pageCount}</span>
          <button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</button>
        </div>}
      </>}
    </div>
  </main>;
}
