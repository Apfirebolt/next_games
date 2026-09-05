"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  respondToFriendRequest,
  deleteFriendship,
} from "../../features/friends/friendSlice";

export default function FriendsPage() {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading,
    isActionLoading,
  } = useSelector(
    (state) =>
      state.friends || {
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        isLoading: false,
        isActionLoading: false,
      }
  );

  const [searchFilter, setSearchFilter] = useState("");
  const [unfriendConfirmId, setUnfriendConfirmId] = useState(null);

  // Load friends and pending requests on mount
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchFriends());
      dispatch(fetchIncomingRequests());
      dispatch(fetchOutgoingRequests());
    }
  }, [dispatch, currentUserId]);

  // Client-side search for accepted friends
  const filteredFriends = useMemo(() => {
    const list = Array.isArray(friends) ? friends : [];
    if (!searchFilter.trim()) return list;

    const query = searchFilter.toLowerCase().trim();
    return list.filter((item) => {
      const f = item.friend;
      if (!f) return false;
      const username = f.username?.toLowerCase() || "";
      const email = f.email?.toLowerCase() || "";
      const name = `${f.firstName || ""} ${f.lastName || ""}`.toLowerCase();
      return username.includes(query) || email.includes(query) || name.includes(query);
    });
  }, [friends, searchFilter]);

  const handleRespond = (friendshipId, action) => {
    dispatch(respondToFriendRequest({ friendshipId, action })).then(() => {
      dispatch(fetchFriends());
      dispatch(fetchIncomingRequests());
    });
  };

  const handleDeleteOrCancel = (friendshipId) => {
    dispatch(deleteFriendship(friendshipId)).then(() => {
      setUnfriendConfirmId(null);
      dispatch(fetchFriends());
      dispatch(fetchOutgoingRequests());
    });
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
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
                Social Network
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                My <span className="text-tan">Friends</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                Manage your connections and respond to pending invitations.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-brown/30 bg-carafe/80 px-4 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-tan">Friends</p>
                <p className="text-xl font-extrabold text-white">{friends?.length || 0}</p>
              </div>
              <div className="rounded-xl border border-brown/30 bg-carafe/80 px-4 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-tan">Requests</p>
                <p className="text-xl font-extrabold text-amber-400">
                  {incomingRequests?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 1. FRIENDS LIST (TOP SECTION) */}
        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-brown/30 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Friends ({friends?.length || 0})</h2>
              <p className="mt-0.5 text-xs text-tan">Fellow collectors you are connected with</p>
            </div>

            {/* Search Input for Friends */}
            {friends?.length > 0 && (
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter friends..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-lg border border-brown/40 bg-carafe/80 py-1.5 pl-8 pr-3 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />
                <svg
                  className="absolute left-2.5 top-2 h-3.5 w-3.5 text-tan/60"
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
            )}
          </div>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-brown/15" />
              ))}
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="my-8 flex flex-col items-center justify-center rounded-xl border border-brown/20 bg-brown/5 py-12 text-center">
              <svg
                className="h-9 w-9 text-tan/50"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              <p className="mt-3 text-sm font-medium text-sand">
                {searchFilter ? `No friends match "${searchFilter}"` : "No friends yet"}
              </p>
              <p className="mt-0.5 text-xs text-tan">
                Browse the leaderboard to discover collectors and send friend requests.
              </p>
              <Link
                href="/leaderboard"
                className="mt-4 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand transition hover:bg-brown/80 hover:text-white"
              >
                Find Collectors
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filteredFriends.map((item) => {
                const friend = item.friend;
                const friendId = friend?._id || friend?.id;
                const isConfirming = unfriendConfirmId === item.friendshipId;

                return (
                  <div
                    key={item.friendshipId}
                    className="flex flex-col justify-between rounded-xl border border-brown/30 bg-brown/10 p-4 backdrop-blur-sm transition hover:border-brown/60"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-tan/30 bg-carafe font-bold uppercase text-tan">
                        {friend?.image ? (
                          <Image
                            src={friend.image}
                            alt={friend.username || "Friend"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          friend?.username?.charAt(0) || "P"
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/users/${friendId}`}
                          className="truncate text-sm font-bold text-white transition hover:text-tan block"
                        >
                          @{friend?.username}
                        </Link>
                        <p className="truncate text-xs text-sand/70">
                          {`${friend?.firstName || ""} ${friend?.lastName || ""}`.trim() ||
                            friend?.email ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-brown/20 pt-3 text-xs">
                      <Link
                        href={`/users/${friendId}`}
                        className="font-semibold text-tan hover:text-white transition"
                      >
                        View Profile →
                      </Link>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteOrCancel(item.friendshipId)}
                            disabled={isActionLoading}
                            className="text-[11px] font-bold text-red-400 hover:underline disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setUnfriendConfirmId(null)}
                            className="text-[11px] text-tan hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUnfriendConfirmId(item.friendshipId)}
                          className="text-[11px] text-red-400/80 hover:text-red-400 transition"
                        >
                          Unfriend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. PENDING REQUESTS (BENEATH FRIENDS LIST) */}
        <section className="mt-14">
          <div className="border-b border-brown/30 pb-4">
            <h2 className="text-xl font-bold text-white">Pending Requests</h2>
            <p className="mt-0.5 text-xs text-tan">
              Invitations awaiting action from you or other members
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Incoming Requests */}
            <div className="rounded-xl border border-brown/30 bg-brown/5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-tan">
                  Received Requests ({incomingRequests?.length || 0})
                </h3>
              </div>

              {incomingRequests?.length === 0 ? (
                <div className="py-10 text-center text-xs text-tan/60">
                  No incoming friend requests right now.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {incomingRequests.map((req) => {
                    const requester = req.requester;
                    const requesterId = requester?._id || requester?.id;

                    return (
                      <div
                        key={req._id}
                        className="flex items-center justify-between rounded-lg border border-brown/30 bg-carafe/70 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-tan/30 bg-brown/40 font-bold uppercase text-tan text-xs">
                            {requester?.image ? (
                              <Image
                                src={requester.image}
                                alt={requester.username || "Requester"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              requester?.username?.charAt(0) || "P"
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/users/${requesterId}`}
                              className="text-xs font-bold text-white hover:text-tan transition block"
                            >
                              @{requester?.username}
                            </Link>
                            <p className="text-[11px] text-tan/70">
                              {`${requester?.firstName || ""} ${requester?.lastName || ""}`.trim() ||
                                requester?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespond(req._id, "accept")}
                            disabled={isActionLoading}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req._id, "reject")}
                            disabled={isActionLoading}
                            className="rounded-md border border-brown/40 bg-brown/20 px-2.5 py-1.5 text-xs font-semibold text-tan hover:bg-brown/40 hover:text-white transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="rounded-xl border border-brown/30 bg-brown/5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-tan">
                  Sent Requests ({outgoingRequests?.length || 0})
                </h3>
              </div>

              {outgoingRequests?.length === 0 ? (
                <div className="py-10 text-center text-xs text-tan/60">
                  No outgoing requests pending.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {outgoingRequests.map((req) => {
                    const recipient = req.recipient;
                    const recipientId = recipient?._id || recipient?.id;

                    return (
                      <div
                        key={req._id}
                        className="flex items-center justify-between rounded-lg border border-brown/30 bg-carafe/70 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-tan/30 bg-brown/40 font-bold uppercase text-tan text-xs">
                            {recipient?.image ? (
                              <Image
                                src={recipient.image}
                                alt={recipient.username || "Recipient"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              recipient?.username?.charAt(0) || "P"
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/users/${recipientId}`}
                              className="text-xs font-bold text-white hover:text-tan transition block"
                            >
                              @{recipient?.username}
                            </Link>
                            <span className="text-[10px] text-tan/70">Awaiting acceptance</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteOrCancel(req._id)}
                          disabled={isActionLoading}
                          className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                        >
                          Cancel Request
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}