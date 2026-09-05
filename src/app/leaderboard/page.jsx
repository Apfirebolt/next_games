"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchAllUsers } from "../../features/user/userSlice";
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  sendFriendRequest,
  respondToFriendRequest,
} from "../../features/friends/friendSlice";

// Inline table action button reflecting friendship state
function TableFriendAction({ targetUserId, isSelf, currentUserId }) {
  const dispatch = useDispatch();
  const { friends, incomingRequests, outgoingRequests, isActionLoading } = useSelector(
    (state) =>
      state.friends || {
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        isActionLoading: false,
      }
  );

  const relationship = useMemo(() => {
    if (!targetUserId || isSelf || !currentUserId) return null;

    const isFriend = friends.some((f) => {
      const fid = f.friend?._id || f.friend?.id || f.friend;
      return fid?.toString() === targetUserId?.toString();
    });
    if (isFriend) return { type: "friends" };

    const incoming = incomingRequests.find((req) => {
      const reqId = req.requester?._id || req.requester?.id || req.requester;
      return reqId?.toString() === targetUserId?.toString();
    });
    if (incoming) return { type: "incoming", friendshipId: incoming._id };

    const outgoing = outgoingRequests.some((req) => {
      const recipientId = req.recipient?._id || req.recipient?.id || req.recipient;
      return recipientId?.toString() === targetUserId?.toString();
    });
    if (outgoing) return { type: "outgoing" };

    return { type: "none" };
  }, [friends, incomingRequests, outgoingRequests, targetUserId, isSelf, currentUserId]);

  if (isSelf || !currentUserId || !relationship) {
    return null;
  }

  const handleSend = () => {
    dispatch(sendFriendRequest(targetUserId)).then(() => {
      dispatch(fetchOutgoingRequests());
    });
  };

  const handleAccept = () => {
    if (!relationship.friendshipId) return;
    dispatch(
      respondToFriendRequest({
        friendshipId: relationship.friendshipId,
        action: "accept",
      })
    ).then(() => {
      dispatch(fetchFriends());
      dispatch(fetchIncomingRequests());
    });
  };

  if (relationship.type === "friends") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Friends
      </span>
    );
  }

  if (relationship.type === "incoming") {
    return (
      <button
        onClick={handleAccept}
        disabled={isActionLoading}
        className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        Accept
      </button>
    );
  }

  if (relationship.type === "outgoing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-tan/30 bg-tan/10 px-2 py-1 text-[11px] font-medium text-tan">
        <svg className="h-3 w-3 animate-spin-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Sent
      </span>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={isActionLoading}
      title="Add Friend"
      className="inline-flex items-center gap-1 rounded-md border border-brown/40 bg-brown/20 px-2 py-1 text-[11px] font-semibold text-sand transition hover:border-tan/50 hover:bg-tan hover:text-carafe disabled:opacity-50"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v6m3-3h-6m-1.5-4.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" />
      </svg>
      Add
    </button>
  );
}

export default function LeaderboardPage() {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const { users, isLoading } = useSelector(
    (state) => state.user || { users: [], isLoading: false }
  );

  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users roster & current user's relationships
  useEffect(() => {
    dispatch(fetchAllUsers());

    if (currentUserId) {
      dispatch(fetchFriends());
      dispatch(fetchIncomingRequests());
      dispatch(fetchOutgoingRequests());
    }
  }, [dispatch, currentUserId]);

  // Memoized search filtering
  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((u) => {
      const username = u.username?.toLowerCase() || "";
      const email = u.email?.toLowerCase() || "";
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      return username.includes(query) || email.includes(query) || name.includes(query);
    });
  }, [users, searchQuery]);

  const getRankBadge = (index) => {
    if (index === 0) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20 text-xs font-bold text-amber-300">
          🥇 1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300/40 bg-slate-300/20 text-xs font-bold text-slate-200">
          🥈 2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-700/40 bg-amber-700/20 text-xs font-bold text-amber-600">
          🥉 3
        </span>
      );
    }
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brown/30 bg-brown/10 text-xs font-semibold text-tan">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tan">
                <svg
                  className="h-3.5 w-3.5 fill-tan text-tan"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm-2.25-2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm-2.25-2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008z"
                  />
                </svg>
                Community Roster
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Player <span className="text-tan">Leaderboard</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                Browse all registered collectors and connect with members in LevelVault.
              </p>
            </div>

            {/* Total Indicator */}
            <div className="flex items-center gap-3 rounded-xl border border-brown/30 bg-carafe/80 px-4 py-3">
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-tan">
                  Total Players
                </p>
                <p className="text-xl font-extrabold text-white">
                  {users?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 border-t border-brown/20 pt-6">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search players by name, username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-brown/40 bg-carafe/80 py-2 pl-9 pr-3 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
              />
              <svg
                className="absolute left-3 top-2.5 h-3.5 w-3.5 text-tan/60"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Table / Loading Skeleton */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 backdrop-blur-sm">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse rounded-lg bg-brown/20"
                />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-base font-medium text-sand">
                No players found matching &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/80"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-sand">
                <thead className="border-b border-brown/30 bg-carafe/60 text-[11px] font-bold uppercase tracking-wider text-tan">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Player
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-6 py-4">
                      Email
                    </th>
                    <th scope="col" className="hidden md:table-cell px-6 py-4">
                      Member Since
                    </th>
                    <th scope="col" className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/20">
                  {filteredUsers.map((userItem, index) => {
                    const targetUserId = userItem._id || userItem.id;
                    const isSelf =
                      currentUser &&
                      (currentUserId?.toString() === targetUserId?.toString() ||
                        currentUser.username === userItem.username);

                    const displayName =
                      userItem.firstName || userItem.lastName
                        ? `${userItem.firstName || ""} ${userItem.lastName || ""}`.trim()
                        : userItem.username;

                    const formattedDate = userItem.createdAt
                      ? new Date(userItem.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—";

                    return (
                      <tr
                        key={targetUserId || index}
                        className={`transition-colors hover:bg-brown/20 ${
                          isSelf ? "bg-brown/25" : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="whitespace-nowrap px-6 py-4 font-semibold">
                          {getRankBadge(index)}
                        </td>

                        {/* Player Profile */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-tan/30 bg-brown/40 font-bold uppercase text-tan">
                              {userItem.image ? (
                                <Image
                                  src={userItem.image}
                                  alt={userItem.username}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                userItem.username?.charAt(0) || "P"
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/users/${targetUserId}`}
                                  className="font-bold text-white transition hover:text-tan"
                                >
                                  @{userItem.username}
                                </Link>
                                {isSelf && (
                                  <span className="rounded border border-tan/40 bg-tan/20 px-1.5 py-0.5 text-[10px] font-bold text-tan">
                                    You
                                  </span>
                                )}
                              </div>
                              {displayName !== userItem.username && (
                                <p className="text-[11px] text-tan/70">
                                  {displayName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="hidden sm:table-cell whitespace-nowrap px-6 py-4 text-tan/80">
                          {userItem.email || "—"}
                        </td>

                        {/* Joined Date */}
                        <td className="hidden md:table-cell whitespace-nowrap px-6 py-4 font-mono text-tan/70">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <TableFriendAction
                              targetUserId={targetUserId}
                              isSelf={isSelf}
                              currentUserId={currentUserId}
                            />

                            <Link
                              href={`/users/${targetUserId}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-brown/40 bg-brown/30 px-2.5 py-1 text-xs font-semibold text-sand transition-all hover:border-tan/40 hover:bg-brown hover:text-white"
                            >
                              <span>Profile</span>
                              <svg
                                className="h-3.5 w-3.5 text-tan"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}