"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import { Ticket, CalendarDays, ArrowRight } from "lucide-react";

export default function MyBookingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f9fd]">
      <Sidebar />

      <div className="lg:ml-64">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-4xl font-extrabold text-slate-900">
            My Bookings
          </h1>

          <p className="mt-3 text-slate-500">
            View and manage your campus event registrations.
          </p>

          {loading ? (
            <p className="mt-10 text-slate-500">
              Checking your account...
            </p>
          ) : !user ? (
            <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
              <p className="text-slate-600">
                Please log in to view your bookings.
              </p>
              <Link
                href="/login"
                className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
              >
                Login
              </Link>
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Ticket size={38} />
              </div>

              <h2 className="mt-6 text-2xl font-bold text-slate-900">
                Bookings dashboard
              </h2>

              <p className="mx-auto mt-3 max-w-md text-slate-500">
                Event booking functionality is being developed.
                Your confirmed registrations will appear here
                once bookings are connected.
              </p>

              <Link
                href="/#events"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white"
              >
                <CalendarDays size={18} />
                Explore Events
                <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
