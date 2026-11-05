"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import { ArrowLeft, CalendarDays, PlusCircle } from "lucide-react";

const defaultCategories = ["Technology", "Cultural", "Sports", "Workshops"];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500";

export default function AddEventPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [activeCategories, setActiveCategories] = useState<string[]>(defaultCategories);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [seats, setSeats] = useState("100");
  const [organizer, setOrganizer] = useState("");
  const [schedule, setSchedule] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) {
          setAdmin(null);
          setChecking(false);
        }
        return;
      }

      try {
        const token = await user.getIdTokenResult(true);

        if (!active) return;

        setAdmin(token.claims.admin === true ? user : null);
      } catch (err) {
        console.error("Admin verification failed:", err);

        if (active) {
          setAdmin(null);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), snapshot => {
      const custom = snapshot.docs.filter(d => d.data().active === true).map(d => d.id);
      setActiveCategories(Array.from(new Set([...defaultCategories, ...custom])).sort());
    }, err => console.error("Category loading failed:", err));
    return unsubscribe;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!admin) {
      setError("Only administrators can publish events.");
      return;
    }

    if (!activeCategories.includes(category)) { setError("Choose an active category."); return; }

    const seatCount = Number(seats);

    if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 100000) {
      setError("Available seats must be between 1 and 100,000.");
      return;
    }

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const selectedDate = new Date(date + "T23:59:59");

    if (Number.isNaN(selectedDate.getTime()) || selectedDate.getTime() < Date.now()) {
      setError("Please choose today or a future date.");
      return;
    }

    setSaving(true);

    try {
      const token = await admin.getIdTokenResult(true);

      if (token.claims.admin !== true) {
        setError("Your account does not have administrator permission.");
        return;
      }

      await addDoc(collection(db, "events"), {
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        time,
        location: location.trim(),
        seats: seatCount,
        organizer: organizer.trim(),
        schedule: schedule.trim(),
        eligibility: eligibility.trim(),
        registrationDeadline,
        contactInfo: contactInfo.trim(),
        instructions: instructions.trim(),
        createdBy: admin.uid,
        createdAt: serverTimestamp(),
        status: "published",
      });

      router.push("/explore-events");
    } catch (err) {
      console.error("Event publishing failed:", err);
      setError(
        "Unable to publish the event. Check your Firestore security rules and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fd] text-slate-900">
      <Sidebar />

      <div className="px-6 py-12 lg:ml-64">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/#events"
            className="mb-8 inline-flex items-center gap-2 font-semibold text-violet-700 hover:text-violet-900"
          >
            <ArrowLeft size={18} />
            Back to Events
          </Link>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">
              <CalendarDays size={17} />
              Event Management
            </div>

            <h1 className="text-3xl font-extrabold md:text-4xl">
              Create New Event
            </h1>

            <p className="mt-3 text-slate-500">
              Publish an event for students to discover.
            </p>
          </div>

          {checking ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              Verifying administrator access...
            </div>
          ) : !admin ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold">Administrator access required</h2>
              <p className="mt-3 text-slate-500">
                Please sign in with an administrator account to add events.
              </p>
              <Link
                href="/admin/login"
                className="mt-6 inline-block rounded-xl bg-violet-700 px-6 py-3 font-bold text-white"
              >
                Admin Login
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2 md:p-8"
            >
              <label className="block text-sm font-semibold md:col-span-2">
                Event Name
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event name"
                  maxLength={100}
                  required
                />
              </label>

              <label className="block text-sm font-semibold">
                Category
                <select
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {activeCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold">
                Venue
                <input
                  className={inputClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  maxLength={150}
                  required
                />
              </label>

              <label className="block text-sm font-semibold">
                Event Date
                <input
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-semibold">
                Event Time
                <input
                  type="time"
                  className={inputClass}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-semibold md:col-span-2">
                Available Seats
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  className={inputClass}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-semibold md:col-span-2">
                Event Description
                <textarea
                  className={inputClass}
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the event..."
                  maxLength={2000}
                  required
                />
              </label>

              <div className="md:col-span-2 border-t border-slate-100 pt-5">
                <h2 className="text-lg font-bold">Additional Event Details</h2>
                <p className="mt-1 text-sm text-slate-500">Optional information for students.</p>
              </div>
              <label className="block text-sm font-semibold md:col-span-2">Organizer
                <input className={inputClass} value={organizer} onChange={(e) => setOrganizer(e.target.value)} maxLength={150} placeholder="e.g. Cultural Committee" />
              </label>
              <label className="block text-sm font-semibold md:col-span-2">Schedule / Activities
                <textarea className={inputClass} rows={4} value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={2000} placeholder="Event program and activities" />
              </label>
              <label className="block text-sm font-semibold md:col-span-2">Eligibility
                <textarea className={inputClass} rows={3} value={eligibility} onChange={(e) => setEligibility(e.target.value)} maxLength={1000} placeholder="Who can participate?" />
              </label>
              <label className="block text-sm font-semibold">Registration Deadline
                <input type="date" className={inputClass} value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
              </label>
              <label className="block text-sm font-semibold">Contact Information
                <input className={inputClass} value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} maxLength={200} placeholder="Organizer contact" />
              </label>
              <label className="block text-sm font-semibold md:col-span-2">Additional Instructions
                <textarea className={inputClass} rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={2000} placeholder="What should participants know?" />
              </label>
              {error && (
                <p
                  role="alert"
                  className="text-sm font-semibold text-red-600 md:col-span-2"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-7 py-3 font-bold text-white transition hover:bg-violet-800 disabled:opacity-60"
                >
                  <PlusCircle size={19} />
                  {saving ? "Publishing..." : "Publish Event"}
                </button>

                <Link
                  href="/#events"
                  className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
