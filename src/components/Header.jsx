'use client';

import { useState } from 'react';
import Link from 'next/link';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-carafe/90 backdrop-blur-md border-b border-brown/30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brown text-sand font-black text-lg transition-transform group-hover:scale-105">
            G
          </span>
          <span className="text-xl font-bold tracking-tight text-sand group-hover:text-white transition-colors">
            Next<span className="text-tan">Games</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-tan transition-colors hover:text-sand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA / Action Button */}
          <Link
            href="/play"
            className="rounded-full bg-brown px-4 py-2 text-sm font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white"
          >
            Play Now
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-tan hover:bg-brown/20 hover:text-sand focus:outline-none md:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="border-b border-brown/30 bg-carafe px-6 py-4 md:hidden">
          <ul className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-tan hover:bg-brown/20 hover:text-sand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/play"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center rounded-lg bg-brown px-4 py-2.5 text-sm font-semibold text-sand transition-all hover:bg-brown/80 hover:text-white"
              >
                Play Now
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;