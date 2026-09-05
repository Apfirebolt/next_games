"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useSession, signOut } from "next-auth/react";
import { logout, reset } from "../features/auth/authSlice";
import { fetchIncomingRequests } from "../features/friends/friendSlice";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const { data: session } = useSession();
  const { user: reduxUser } = useSelector((state) => state.auth || {});
  const favorites = useSelector((state) => state.favorites?.favorites || []);
  const incomingRequests = useSelector(
    (state) => state.friends?.incomingRequests || []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch incoming requests when authenticated to display the badge
  const user = reduxUser || session?.user;
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchIncomingRequests());
    }
  }, [dispatch, currentUserId]);

  // Click outside to close the desktop user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/games", label: "Games" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/forums", label: "Forums" },
    { href: "/recommendation", label: "Recommendations" },
    { href: "/about", label: "About" },
  ];

  const handleLogout = async () => {
    // 1. Clear Redux and custom cookies
    dispatch(logout());
    dispatch(reset());
    setIsUserMenuOpen(false);
    setIsOpen(false);

    // 2. Terminate NextAuth session cookie if logged in via Google
    await signOut({ redirect: false });

    toast.info("Logged out successfully");
    router.push("/login");
  };

  const isAuthenticated = mounted && Boolean(user);
  const displayName =
    user?.firstName ||
    user?.username ||
    user?.name?.split(" ")[0] ||
    user?.email ||
    "Player";
  const userAvatar = user?.image || null;
  const pendingRequestsCount = incomingRequests.length;

  return (
    <header className="sticky top-0 z-50 border-b border-brown/30 bg-carafe/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brown font-black text-lg text-sand shadow-sm transition-transform duration-200 group-hover:scale-105">
            L
          </span>
          <span className="text-xl font-black tracking-tight text-white transition-colors">
            Level <span className="text-tan">Vault</span>
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
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-brown/40 bg-brown/15 py-1 pl-1.5 pr-3.5 text-xs font-semibold text-sand transition-all hover:border-tan hover:bg-brown/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
                >
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={displayName}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover border border-brown/40"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brown font-bold text-white shadow-inner">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[110px] truncate">{displayName}</span>

                  {/* Red dot badge if requests are waiting */}
                  {pendingRequestsCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  )}

                  <svg
                    className={`h-3.5 w-3.5 text-tan transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-brown/40 bg-carafe p-1.5 shadow-2xl backdrop-blur-xl">
                    <div className="border-b border-brown/30 px-3 py-2 text-[11px] text-tan">
                      Signed in as <br />
                      <span className="font-bold text-sand truncate block">
                        {user.email}
                      </span>
                    </div>

                    {/* Saved Vault */}
                    <Link
                      href="/favorites"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                    >
                      <svg
                        className="h-4 w-4 text-tan"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                        />
                      </svg>
                      <span className="flex-1 text-left">Saved Vault</span>
                      <span className="text-[10px] text-tan/70 font-mono">
                        ({favorites?.length || 0})
                      </span>
                    </Link>

                    {/* Friends (directly below Saved Vault) */}
                    <Link
                      href="/friends"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                    >
                      <svg
                        className="h-4 w-4 text-tan"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                        />
                      </svg>
                      <span className="flex-1 text-left">Friends</span>
                      {pendingRequestsCount > 0 && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Link>

                    {/* Profile Settings */}
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                    >
                      <svg
                        className="h-4 w-4 text-tan"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                      Profile Settings
                    </Link>

                    {/* Log Out */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                    >
                      <svg
                        className="h-4 w-4 text-danger"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                        />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
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
                  <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-tan">
                    {userAvatar && (
                      <Image
                        src={userAvatar}
                        alt={displayName}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover border border-brown/40"
                      />
                    )}
                    <span>
                      Signed in as <strong className="text-white">{displayName}</strong>
                    </span>
                  </div>

                  {/* Saved Vault (Mobile) */}
                  <Link
                    href="/favorites"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    <span>Saved Vault</span>
                    <span className="text-xs text-tan font-mono">
                      ({favorites?.length || 0})
                    </span>
                  </Link>

                  {/* Friends (Mobile) */}
                  <Link
                    href="/friends"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    <span>Friends</span>
                    {pendingRequestsCount > 0 && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                        {pendingRequestsCount} new
                      </span>
                    )}
                  </Link>

                  {/* Profile Settings (Mobile) */}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    Profile Settings
                  </Link>

                  {/* Log Out (Mobile) */}
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