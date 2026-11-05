"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const tokenResult = await credential.user.getIdTokenResult(true);

      if (tokenResult.claims.admin !== true) {
        await signOut(auth);
        setMessage(
          "Access denied. This account does not have administrator privileges."
        );
        return;
      }

      router.replace("/");
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-email"
      ) {
        setMessage("Invalid administrator email or password.");
      } else if (code === "auth/too-many-requests") {
        setMessage("Too many attempts. Please try again later.");
      } else if (code === "auth/network-request-failed") {
        setMessage("Network error. Check your internet connection.");
      } else {
        setMessage("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

  return (
    <main className="min-h-screen bg-[#f8f7ff] text-slate-900 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#180d46] via-[#48209a] to-[#7442d8] p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold">
          <CalendarDays size={30} />
          Event Ease
        </Link>

        <div className="max-w-lg">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm">
            <ShieldCheck size={17} />
            Restricted Administration
          </div>

          <h1 className="text-5xl font-extrabold leading-tight">
            Manage Events.
            <span className="block text-violet-200">
              Empower Campus.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-violet-100">
            Your secure command center for managing college
            events, student registrations, bookings and reports.
          </p>

          <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-6">
            <ShieldCheck size={32} className="mb-4" />
            <h3 className="text-lg font-bold">
              Authorized Access Only
            </h3>
            <p className="mt-2 text-sm text-violet-100">
              This portal is exclusively for the designated
              Event Ease administrator.
            </p>
          </div>
        </div>

        <p className="text-sm text-violet-200">
          Event Ease • Administration Portal
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <ShieldCheck size={32} />
            </div>

            <h1 className="text-4xl font-extrabold">
              Admin Login
            </h1>

            <p className="mt-3 text-slate-500">
              Sign in to access the Event Ease administration portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold"
              >
                Admin Email
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold"
              >
                Admin Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className={inputClass}
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {message && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={18} className="shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Access Admin Portal"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-violet-100 bg-violet-50 p-4 text-center text-sm text-violet-700">
            <ShieldCheck size={18} className="mr-2 inline" />
            Restricted to one authorized administrator
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Student?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-700 hover:underline"
            >
              Go to Student Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
