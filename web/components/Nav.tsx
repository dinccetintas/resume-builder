"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Top navigation. Client component so it can highlight the active route via
// usePathname. Calm navy wordmark + a single accent underline on the active tab.
const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/queue", label: "Manual queue" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname() ?? "/";
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-md bg-navy text-xs font-bold text-white"
          >
            JP
          </span>
          <span className="font-serif text-base font-semibold tracking-tight text-ink">
            Pipeline
          </span>
        </Link>

        <ul className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-md px-3 py-1.5 font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? "bg-surface text-accent"
                      : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
