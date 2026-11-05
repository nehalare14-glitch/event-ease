"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  CalendarDays,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function sendReset(emailAddress: string) {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, emailAddress);

      setSubmittedEmail(emailAddress);
      setSent(true);
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/invalid-email") {
        setMessage("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setMessage(
          "Too many requests. Please wait before trying again."
        );
      } else if (code === "auth/network-request-failed") {
        setMessage(
          "Network error. Check your internet connection."
        );
      } else {
        setMessage(
          "Unable to process your request. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    await sendReset(normalizedEmail);
  }

  async function handleResend() {
    if (!submittedEmail) return;

    await sendReset(submittedEmail);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fd] px-5 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-2xl font-extrabold text-violet-700"
        >
          <CalendarDays size={29} />
          Event Ease
        </Link>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-violet-100/50 sm:p-10">
          {!sent ? (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Mail size={30} />
              </div>

              <h1 className="text-3xl font-extrabold">
                Forgot Password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter the email address associated with your
                Event Ease account. We'll send you a secure
                password-reset link.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="student@example.com"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                {message && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-4 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <CheckCircle2 size={32} />
              </div>

              <h1 className="text-3xl font-extrabold">
                Check Your Email
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                If an Event Ease account exists for this
                address, Firebase will send a password-reset
                link to:
              </p>

              <div className="mt-5 break-all rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-center font-semibold text-violet-800">
                {submittedEmail}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                Check your inbox, spam, and promotions folders.
                Open the link in the email to set a new password.
              </p>

              {message && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3.5 font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} />
                {loading ? "Sending..." : "Resend Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setMessage("");
                }}
                className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-violet-700"
              >
                Use a different email
              </button>
            </>
          )}

          <Link
            href="/login"
            className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            <ArrowLeft size={17} />
            Back to Login
          </Link>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck size={16} />
          Secure password recovery powered by Firebase
        </p>
      </div>
    </main>
  );
}
