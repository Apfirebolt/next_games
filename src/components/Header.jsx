'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});

  // Guarantees client-side DOM matches server-side DOM on initial render pass
  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/about', label: 'About' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    setIsUserMenuOpen(false);
  
    toast.info("Logged out successfully");
    setIsOpen(false);
    router.push('/login');
  };

  // Only consider authenticated once mounted in the browser
  const isAuthenticated = mounted && Boolean(user);
  const displayName = user?.firstName || user?.username || user?.email || 'Player';

  return (
    <header className="sticky top-0 z-50 border-b border-brown/30 bg-carafe/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brown font-black text-lg text-sand shadow-sm transition-transform duration-200 group-hover:scale-105">
            L
          </span>
          <span className="text-xl font-black tracking-tight text-white transition-colors">
            Level<span className="text-tan">Vault</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center space-x-7 text-sm font-semibold">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-tan transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Auth State Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-brown/40 bg-brown/15 py-1.5 pl-2 pr-3.5 text-xs font-semibold text-sand transition-all hover:border-tan hover:bg-brown/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brown font-bold text-white shadow-inner">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[110px] truncate">{displayName}</span>
                  <svg
                    className={`h-3.5 w-3.5 text-tan transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-brown/40 bg-carafe p-1.5 shadow-2xl backdrop-blur-xl">
                    <div className="border-b border-brown/30 px-3 py-2 text-[11px] text-tan">
                      Signed in as <br />
                      <span className="font-bold text-sand truncate block">{user.email}</span>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                    >
                      <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Profile Settings
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                    >
                      <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-tan transition-colors hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-tan transition-colors hover:bg-brown/20 hover:text-sand focus:outline-none md:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="border-b border-brown/30 bg-carafe px-6 py-4 md:hidden">
          <ul className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-tan transition-colors hover:bg-brown/20 hover:text-sand"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <div className="my-2 border-t border-brown/30 pt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-xs text-tan">
                    Signed in as <span className="font-bold text-white">{displayName}</span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 block w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center rounded-lg border border-brown/40 bg-brown/10 px-4 py-2.5 text-xs font-semibold text-sand hover:bg-brown/20 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center rounded-lg bg-brown px-4 py-2.5 text-xs font-semibold text-sand hover:bg-brown/80 hover:text-white"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;