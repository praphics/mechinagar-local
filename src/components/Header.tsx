"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/data/categories";

const navLinks = [
  { href: "/", labelNe: "गृहपृष्ठ" },
  ...categories.map((c) => ({ href: `/category/${c.slug}`, labelNe: c.nameNe })),
  { href: "/about", labelNe: "बारेमा" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex flex-col leading-none shrink-0">
            <span className="text-xl font-bold text-brand">मेचीनगर लोकल</span>
            <span className="text-[0.65rem] tracking-wide text-ink-faint">Mechinagar Local</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 min-w-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-muted hover:text-brand whitespace-nowrap"
              >
                {link.labelNe}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/search"
              aria-label="खोज्नुहोस्"
              className="p-2.5 rounded-full text-ink-muted hover:text-brand hover:bg-brand-tint"
            >
              <SearchIcon />
            </Link>
            <Link
              href="/newsletter"
              className="hidden sm:inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              न्यूजलेटर
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "मेनु बन्द गर्नुहोस्" : "मेनु खोल्नुहोस्"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-full text-ink hover:bg-brand-tint"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-line bg-paper px-4 sm:px-6 py-3">
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-base font-medium text-ink border-b border-line last:border-b-0"
                >
                  {link.labelNe}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/newsletter"
                onClick={() => setMenuOpen(false)}
                className="mt-3 inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                न्यूजलेटर सदस्यता
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
