"use client";

import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/checkin", label: "Check-in rápido" },
  { href: "/dashboard", label: "Semáforos" },
  { href: "/evidencias", label: "Evidencias" },
];

export function NavMain() {
  return (
    <nav
      className="border-t border-white/20"
      role="navigation"
      aria-label="Principal"
    >
      <ul className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-2 md:gap-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex items-center justify-center min-h-touch min-w-[8rem] px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-ui-lg transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
