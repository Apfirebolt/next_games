"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../features/notifications/notificationSlice";

export default function NotificationBell() {
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const { notifications = [], unreadCount = 0 } = useSelector(
    (state) => state.notifications || {}
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Click outside and ESC key dismiss handling
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      dispatch(markNotificationRead(item._id));
    }
    setIsOpen(false);
  };

  const getTargetUrl = (item) => {
    if (item.type?.startsWith("friend_request")) {
      return "/friends";
    }
    if (item.threadId) {
      return `/forums/threads/${item.threadId}`;
    }
    return "/notifications";
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "friend_request_sent":
      case "friend_request_accepted":
        return (
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-tan/20 text-tan">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </span>
        );
      case "thread_reply":
      case "comment_reply":
      default:
        return (
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          </span>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-brown/40 bg-brown/15 text-tan transition hover:border-tan hover:bg-brown/25 hover:text-white focus:outline-none"
        aria-label="Open notifications"
        aria-expanded={isOpen}
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

      {/* Popover Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-brown/40 bg-carafe shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brown/30 bg-brown/15 px-4 py-3">
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

          {/* Quick List (Latest 6 entries) */}
          <div className="max-h-80 overflow-y-auto divide-y divide-brown/20">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-tan/60">
                No notifications right now.
              </div>
            ) : (
              notifications.slice(0, 6).map((item) => (
                <Link
                  key={item._id}
                  href={getTargetUrl(item)}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-start gap-3 p-3.5 transition hover:bg-brown/20 ${
                    !item.isRead ? "bg-brown/15" : ""
                  }`}
                >
                  <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-tan/30 bg-carafe text-xs font-bold uppercase text-tan">
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
                    <div className="flex items-start gap-1.5">
                      {getNotificationIcon(item.type)}
                      <p className="text-xs text-sand font-medium leading-snug line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                    <span className="mt-1 block text-[10px] font-mono text-tan/60">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Link to Full View Page */}
          <div className="border-t border-brown/30 bg-brown/10 p-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-tan transition hover:text-white"
            >
              <span>View all notifications</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}