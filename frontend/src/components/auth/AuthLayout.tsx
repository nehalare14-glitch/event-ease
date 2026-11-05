import Link from "next/link";
import {
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Ticket,
  ArrowLeft,
} from "lucide-react";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f8f7ff] text-slate-900 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#24105d] via-[#5725ba] to-[#8b5cf6] p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-3 text-2xl font-extrabold">
          <span className="rounded-xl bg-white/15 p-3">
            <CalendarDays size={27} />
          </span>
          Event Ease
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
            <Sparkles size={16} />
            Your campus, connected
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight xl:text-6xl">
            Every great
            <span className="block text-violet-200">experience</span>
            starts here.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-violet-100">
            Discover incredible campus events, connect with your community,
            and make every moment memorable.
          </p>

          <div className="mt-10 grid max-w-md grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <Ticket className="mb-3" size={27} />
              <p className="font-semibold">Easy Bookings</p>
              <p className="mt-1 text-sm text-violet-200">One place for events</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <ShieldCheck className="mb-3" size={27} />
              <p className="font-semibold">Secure Access</p>
              <p className="mt-1 text-sm text-violet-200">Powered by Firebase</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-violet-200">
          Event Ease • College Event Management System
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-violet-700 lg:hidden"
          >
            <CalendarDays size={22} />
            Event Ease
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <CalendarDays size={27} />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {title}
            </h2>

            <p className="mt-3 text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Event Ease. All rights reserved.
        </p>
      </section>
    </main>
  );
}
