"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  CalendarDays,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

type Role = "guest" | "student" | "admin";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          if (active) {
            setUser(null);
            setRole("guest");
            setLoading(false);
          }
          return;
        }

        try {
          const token = await currentUser.getIdTokenResult(true);

          if (!active) return;

          setUser(currentUser);
          setRole(
            token.claims.admin === true ? "admin" : "student"
          );
        } catch (error) {
          console.error("Unable to verify role:", error);

          if (active) {
            setUser(null);
            setRole("guest");
          }
        } finally {
          if (active) setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await signOut(auth);
      setMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
      window.alert("Unable to log out. Please try again.");
    }
  }

  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const links = [
    { label: "Home", href: "/" },
    { label: "Explore Events", href: "/#events" },
    { label: "Categories", href: "/#categories" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-xl font-extrabold text-violet-700 sm:text-2xl"
        >
          <CalendarDays size={28} />
          Event Ease
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {loading ? (
            <span className="text-sm text-slate-400">
              Checking account...
            </span>
          ) : user ? (
            <>
              <div className="text-right">
                <p className="max-w-[160px] truncate text-sm font-bold text-slate-800">
                  {displayName}
                </p>
                <p className="max-w-[160px] truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>

              <span
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${
                  role === "admin"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {role === "admin" ? (
                  <ShieldCheck size={15} />
                ) : (
                  <GraduationCap size={15} />
                )}
                {role === "admin" ? "Admin" : "Student"}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                <LogIn size={17} />
                Login
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <UserPlus size={17} />
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-700 lg:hidden"
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-100 bg-white px-5 py-5 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-violet-50"
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-4">
              {loading ? (
                <p className="text-sm text-slate-500">
                  Checking account...
                </p>
              ) : user ? (
                <div className="space-y-3">
                  <p className="font-bold text-slate-800">
                    {displayName}
                  </p>

                  <p className="break-all text-sm text-slate-500">
                    {user.email}
                  </p>

                  <p className="text-sm font-semibold text-violet-700">
                    {role === "admin" ? "Administrator" : "Student"}
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-violet-200 px-4 py-3 text-center font-semibold text-violet-700"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-violet-700 px-4 py-3 text-center font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
