"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../features/notifications/notificationSlice";

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);

  const { notifications, unreadCount, isLoading } = useSelector(
    (state) => state.notifications || { notifications: [], unreadCount: 0, isLoading: false }
  );

  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'unread' | 'social' | 'forum'

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchNotifications());
    }
  }, [currentUser, dispatch]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "unread") return !item.isRead;
      if (activeFilter === "social") {
        return item.type === "friend_request_sent" || item.type === "friend_request_accepted";
      }
      if (activeFilter === "forum") {
        return item.type === "thread_reply" || item.type === "comment_reply";
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const handleItemClick = (item) => {
    if (!item.isRead) {
      dispatch(markNotificationRead(item._id));
    }
  };

  const getTargetUrl = (item) => {
    if (item.type.startsWith("friend_request")) return "/friends";
    if (item.threadId) return `/forums/threads/${item.threadId}`;
    return "#";
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "friend_request_sent":
      case "friend_request_accepted":
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tan/20 text-tan">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
            </svg>
          </span>
        );
      case "thread_reply":
      case "comment_reply":
      default:
        return (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tan">
                Activity Feed
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Your <span className="text-tan">Notifications</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                Stay updated on discussions, direct replies, and friend requests.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead())}
                className="inline-flex items-center gap-1.5 rounded-xl border border-tan/30 bg-tan/10 px-4 py-2 text-xs font-bold text-tan transition hover:bg-tan hover:text-carafe"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-brown/20 pt-6">
            {[
              { key: "all", label: `All (${notifications.length})` },
              { key: "unread", label: `Unread (${unreadCount})` },
              { key: "social", label: "Friends & Requests" },
              { key: "forum", label: "Forum Replies" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === key
                    ? "bg-tan text-carafe shadow"
                    : "border border-brown/30 bg-brown/10 text-sand hover:bg-brown/20 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 backdrop-blur-sm">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-brown/20" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-xs text-tan/70">
              <p className="text-base font-semibold text-sand">No notifications found.</p>
              <p className="mt-1">You&apos;re completely caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-brown/20">
              {filteredNotifications.map((item) => (
                <Link
                  key={item._id}
                  href={getTargetUrl(item)}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center justify-between p-4 transition-colors hover:bg-brown/20 ${
                    !item.isRead ? "bg-brown/15" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-tan/30 bg-carafe text-xs font-bold uppercase text-tan">
                      {item.sender?.image ? (
                        <Image src={item.sender.image} alt={item.sender.username} fill className="object-cover" />
                      ) : (
                        item.sender?.username?.charAt(0) || "U"
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(item.type)}
                        <p className="text-xs font-medium text-sand">{item.message}</p>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-tan/60">
                        {new Date(item.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {!item.isRead && (
                    <span className="ml-4 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-400" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}