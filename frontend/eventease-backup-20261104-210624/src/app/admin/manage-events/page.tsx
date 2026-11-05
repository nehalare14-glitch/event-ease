"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminPlaceholderPage() {
  const [status, setStatus] = useState<"loading" | "admin" | "denied">("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("denied");
        return;
      }

      try {
        const token = await user.getIdTokenResult();
        setStatus(token.claims.admin === true ? "admin" : "denied");
      } catch {
        setStatus("denied");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fd]">
      <Sidebar />

      <main className="p-6 md:ml-64 md:p-10">
        {status === "loading" ? (
          <p className="text-slate-500">Checking administrator access...</p>
        ) : status === "denied" ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            <p className="mt-3 text-slate-500">
              This page is available only to administrators.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-violet-100 bg-white p-10 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Event Ease Administration
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
              Manage Events
            </h1>
            <p className="mt-4 text-slate-600">
              Event creation, editing, publishing, and management will be available here.
            </p>
            <div className="mt-8 rounded-2xl bg-violet-50 p-6">
              <p className="font-semibold text-violet-700">
                Coming Soon
              </p>
              <p className="mt-2 text-sm text-slate-600">
                This page is ready. We will add its functionality later.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
