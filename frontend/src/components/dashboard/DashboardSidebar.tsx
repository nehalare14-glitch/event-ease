"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Role = "admin" | "student";

const studentLinks = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Explore Events", href: "/explore-events", icon: "calendar" },
  { label: "My Bookings", href: "/my-bookings", icon: "ticket" },
];

const adminLinks = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Add Event", href: "/admin/add-event", icon: "plus" },
  { label: "Manage Categories", href: "/admin/categories", icon: "categories" },
];

function SidebarIcon({ name }: { name: string }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    );
  }

  if (name === "ticket") {
    return (
      <svg {...common}>
        <path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V5H3v3Z" />
        <path d="M12 5v11" strokeDasharray="2 2" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export default function DashboardSidebar({
  role,
}: {
  role: Role;
}) {
  const pathname = usePathname();

  const links = role === "admin" ? adminLinks : studentLinks;

  return (
    <aside className="w-full shrink-0 bg-[#211047] text-white lg:min-h-screen lg:w-72">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-7">
        <SidebarIcon name="calendar" />

        <span className="text-2xl font-bold tracking-tight">
          Event Ease
        </span>
      </div>

      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-sm font-semibold text-white">
          {role === "admin" ? "Administrator" : "Student"}
        </p>

        <p className="mt-1 break-all text-xs text-purple-200">
          {auth.currentUser?.email ?? ""}
        </p>

        <span className="mt-3 inline-flex rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-purple-100">
          {role === "admin" ? "Admin" : "Student"}
        </span>
      </div>

      <nav aria-label={`${role} navigation`} className="px-3 py-7">
        <p className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-purple-300">
          Main Menu
        </p>

        <div className="space-y-2">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm font-semibold transition ${
                  active
                    ? "bg-[#8217fa] text-white"
                    : "text-purple-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <SidebarIcon name={link.icon} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-5 pb-7">
        <button
          type="button"
          onClick={async () => {
            try {
              await signOut(auth);
              window.location.assign("/");
            } catch (error) {
              console.error("Sign out failed:", error);
            }
          }}
          className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-purple-100 hover:bg-white/10"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}