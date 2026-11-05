"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  ShieldCheck,
  GraduationCap,
  LogOut,
  Settings,
  PlusCircle,
  Ticket,
} from "lucide-react";

type DemoRole = "guest" | "student" | "admin";

export default function RoleNavbar() {
  const [role, setRole] = useState<DemoRole>("guest");

  return (
    <header className="border-b border-slate-100 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-extrabold text-violet-700"
        >
          <CalendarDays size={28} />
          Event Ease
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/events" className="text-sm font-semibold text-slate-600 hover:text-violet-700">
            Explore Events
          </Link>

          {role === "admin" && (
            <>
              <Link href="/admin/events" className="flex items-center gap-1 text-sm font-semibold text-violet-700">
                <PlusCircle size={16} />
                Manage Events
              </Link>
              <Link href="/admin/dashboard" className="flex items-center gap-1 text-sm font-semibold text-violet-700">
                <Settings size={16} />
                Admin Dashboard
              </Link>
            </>
          )}

          {role === "student" && (
            <Link href="/bookings" className="flex items-center gap-1 text-sm font-semibold text-violet-700">
              <Ticket size={16} />
              My Bookings
            </Link>
          )}

          {role === "guest" ? (
            <Link href="/login" className="rounded-xl bg-violet-700 px-5 py-2 font-semibold text-white">
              Login
            </Link>
          ) : (
            <span className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">
              {role === "admin" ? <ShieldCheck size={17} /> : <GraduationCap size={17} />}
              {role === "admin" ? "Administrator" : "Student"}
            </span>
          )}
        </div>
      </nav>

      <div className="border-t border-amber-200 bg-amber-50 px-6 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-amber-800">
            UI preview only – role selection does not authenticate or grant access.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRole("student")}
              className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold"
            >
              Preview Student
            </button>
            <button
              onClick={() => setRole("admin")}
              className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold"
            >
              Preview Admin
            </button>
            <button
              onClick={() => setRole("guest")}
              className="flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold"
            >
              <LogOut size={13} />
              Reset Preview
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
