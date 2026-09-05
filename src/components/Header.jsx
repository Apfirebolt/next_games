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
import { fetchConversations } from "../features/conversations/conversationSlice";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../features/notifications/notificationSlice";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const { data: session } = useSession();
  const { user: reduxUser } = useSelector((state) => state.auth || {});
  const favorites = useSelector((state) => state.favorites?.favorites || []);
  const incomingRequests = useSelector(
    (state) => state.friends?.incomingRequests || []
  );
  const conversations = useSelector(
    (state) => state.conversations?.conversations || []
  );
  const { notifications = [], unreadCount = 0 } = useSelector(
    (state) => state.notifications || {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = reduxUser || session?.user;
  const currentUserId = user?._id || user?.id;

  // Poll badges and counts on authenticated mount
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchIncomingRequests());
      dispatch(fetchConversations());
      dispatch(fetchNotifications());
    }
  }, [dispatch, currentUserId]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    if (isUserMenuOpen || isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, isNotifOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/games", label: "Games" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/forums", label: "Forums" },
    { href: "/recommendation", label: "Recommendations" },
    { href: "/about", label: "About" },
  ];

  const handleLogout = async () => {
    dispatch(logout());
    dispatch(reset());
    setIsUserMenuOpen(false);
    setIsNotifOpen(false);
    setIsOpen(false);

    await signOut({ redirect: false });

    toast.info("Logged out successfully");
    router.push("/login");
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      dispatch(markNotificationRead(item._id));
    }
    setIsNotifOpen(false);
  };

  const getTargetUrl = (item) => {
    if (item.type?.startsWith("friend_request")) return "/friends";
    if (item.threadId) return `/forums/threads/${item.threadId}`;
    return "/notifications";
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

  const unreadMessagesCount = conversations.reduce(
    (acc, conv) => acc + (conv.unreadCount || 0),
    0
  );

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

          {/* Desktop Auth Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {/* 1. Header Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsUserMenuOpen(false);
                    }}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border border-brown/40 bg-brown/15 text-tan transition hover:border-tan hover:bg-brown/25 hover:text-white"
                    aria-label="Open notifications"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                      />
                    </svg>

                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-extrabold text-carafe shadow">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bell Flyout Popup */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-brown/40 bg-carafe shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-brown/30 bg-brown/10 px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-tan">
                          Notifications ({unreadCount})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => dispatch(markAllNotificationsRead())}
                            className="text-[11px] font-semibold text-tan hover:text-white transition"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-brown/20">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-tan/60">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((item) => (
                            <Link
                              key={item._id}
                              href={getTargetUrl(item)}
                              onClick={() => handleNotificationClick(item)}
                              className={`flex items-start gap-3 p-3 transition hover:bg-brown/20 ${
                                !item.isRead ? "bg-brown/15" : ""
                              }`}
                            >
                              <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-tan/30 bg-carafe text-[10px] font-bold uppercase text-tan">
                                {item.sender?.image ? (
                                  <Image
                                    src={item.sender.image}
                                    alt={item.sender.username || "User"}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  item.sender?.username?.charAt(0) || "U"
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-sand font-medium leading-snug line-clamp-2">
                                  {item.message}
                                </p>
                                <span className="mt-1 block text-[9px] font-mono text-tan/60">
                                  {new Date(item.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {!item.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                              )}
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="border-t border-brown/30 bg-brown/10 p-2 text-center">
                        <Link
                          href="/notifications"
                          onClick={() => setIsNotifOpen(false)}
                          className="text-xs font-semibold text-tan transition hover:text-white"
                        >
                          View all notifications &rarr;
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. User Menu Pill */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsNotifOpen(false);
                    }}
                    className="flex items-center gap-2.5 rounded-full border border-brown/40 bg-brown/15 py-1 pl-1.5 pr-3.5 text-xs font-semibold text-sand transition-all hover:border-tan hover:bg-brown/25 focus:outline-none"
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
                        <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        <span className="flex-1 text-left">Saved Vault</span>
                        <span className="text-[10px] text-tan/70 font-mono">
                          ({favorites?.length || 0})
                        </span>
                      </Link>

                      {/* Friends */}
                      <Link
                        href="/friends"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                      >
                        <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <span className="flex-1 text-left">Friends</span>
                        {pendingRequestsCount > 0 && (
                          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                            {pendingRequestsCount}
                          </span>
                        )}
                      </Link>

                      {/* Messages */}
                      <Link
                        href="/messages"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                      >
                        <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        <span className="flex-1 text-left">Messages</span>
                        {unreadMessagesCount > 0 && (
                          <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-extrabold text-carafe">
                            {unreadMessagesCount}
                          </span>
                        )}
                      </Link>

                      {/* Notifications Page Item */}
                      <Link
                        href="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                      >
                        <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        <span className="flex-1 text-left">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-extrabold text-carafe">
                            {unreadCount}
                          </span>
                        )}
                      </Link>

                      {/* Profile Settings */}
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand transition-colors hover:bg-brown/20 hover:text-white"
                      >
                        <svg className="h-4 w-4 text-tan" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Profile Settings
                      </Link>

                      {/* Log Out */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                      >
                        <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
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
                  className="rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Controls: Bell + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-brown/40 bg-brown/15 text-tan"
              aria-label="View notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-extrabold text-carafe">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-tan transition-colors hover:bg-brown/20 hover:text-sand focus:outline-none"
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

                  {/* Saved Vault */}
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

                  {/* Friends */}
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

                  {/* Messages */}
                  <Link
                    href="/messages"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    <span>Messages</span>
                    {unreadMessagesCount > 0 && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-extrabold text-carafe">
                        {unreadMessagesCount} new
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-extrabold text-carafe">
                        {unreadCount} new
                      </span>
                    )}
                  </Link>

                  {/* Profile Settings */}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-sand hover:bg-brown/20"
                  >
                    Profile Settings
                  </Link>

                  {/* Log Out */}
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