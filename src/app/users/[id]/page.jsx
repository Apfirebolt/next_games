"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { fetchUserById, clearSelectedUser } from "../../../features/user/userSlice";

export default function UserDetailPage({ params }) {
  
  const { id } = useParams();  
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const { selectedUser, isLoading, isError } = useSelector(
    (state) => state.user || { selectedUser: null, isLoading: true, isError: false }
  );

  const [userFavorites, setUserFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  // 2. Fetch target user by id
  useEffect(() => {
    if (id && id !== "undefined") {
      dispatch(fetchUserById(id));
    }

    return () => {
      dispatch(clearSelectedUser());
    };
  }, [id, dispatch]);

  // 3. Fetch public favorites curated by this user
  useEffect(() => {
    const loadUserFavorites = async () => {
      if (!id || id === "undefined") return;

      try {
        setLoadingFavs(true);
        const res = await fetch(`/api/favorites/user/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUserFavorites(Array.isArray(data) ? data : []);
        } else {
          setUserFavorites([]);
        }
      } catch (err) {
        setUserFavorites([]);
      } finally {
        setLoadingFavs(false);
      }
    };

    loadUserFavorites();
  }, [id]);

  const isSelf =
    currentUser &&
    (currentUser._id === id ||
      currentUser.id === id ||
      currentUser.username === selectedUser?.username);

  const showGameImage = (imgSrc) => {
    if (!imgSrc) return "/placeholder-game.png";
    return imgSrc.startsWith("http") ? imgSrc : `https://www.vgchartz.com${imgSrc}`;
  };

  const formattedJoinDate = selectedUser?.createdAt
    ? new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Archive Member";

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-tan transition-colors hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Leaderboard
          </Link>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-52 animate-pulse rounded-2xl border border-brown/20 bg-brown/10" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-brown/15" />
              ))}
            </div>
          </div>
        ) : isError || !selectedUser ? (
          /* Error / 404 View */
          <div className="my-auto flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-bold text-white">Player Not Found</h1>
            <p className="mt-1 text-xs text-tan">
              The requested collector profile could not be found or has been removed.
            </p>
            <Link
              href="/leaderboard"
              className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-semibold text-sand transition-all hover:bg-brown/80 hover:text-white"
            >
              Return to Leaderboard
            </Link>
          </div>
        ) : (
          /* Profile Details Content */
          <>
            {/* Header Profile Card */}
            <div className="relative overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  {/* Avatar Letter */}
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-tan/40 bg-carafe text-2xl font-extrabold uppercase text-tan shadow-xl">
                    {selectedUser.username ? selectedUser.username.charAt(0) : "P"}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        @{selectedUser.username}
                      </h1>
                      {isSelf && (
                        <span className="rounded-md border border-tan/40 bg-tan/20 px-2 py-0.5 text-[11px] font-bold text-tan">
                          Your Profile
                        </span>
                      )}
                    </div>

                    {(selectedUser.firstName || selectedUser.lastName) && (
                      <p className="mt-0.5 text-sm font-medium text-sand/80">
                        {`${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim()}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-tan/70">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-tan/60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75m18-18H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21h16.5A2.25 2.25 0 0022.5 18.75V7.5a2.25 2.25 0 00-2.25-2.25z" />
                        </svg>
                        Joined {formattedJoinDate}
                      </span>
                      {selectedUser.email && (
                        <span className="hidden sm:inline-flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-tan/60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {selectedUser.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vault Count Stat */}
                <div className="flex items-center gap-4 rounded-xl border border-brown/30 bg-carafe/80 p-4 sm:self-center">
                  <div className="px-2 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-tan">
                      Vault Collection
                    </p>
                    <p className="mt-0.5 text-2xl font-extrabold text-white">
                      {userFavorites.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Games Showcase */}
            <div className="mt-10">
              <div className="flex items-center justify-between border-b border-brown/30 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Collector&apos;s Vault
                  </h2>
                  <p className="mt-0.5 text-xs text-tan">
                    Games curated and saved by @{selectedUser.username}
                  </p>
                </div>
              </div>

              {loadingFavs ? (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-xl bg-brown/15" />
                  ))}
                </div>
              ) : userFavorites.length === 0 ? (
                <div className="my-8 flex flex-col items-center justify-center rounded-xl border border-brown/20 bg-brown/5 py-12 text-center">
                  <svg className="h-8 w-8 text-tan/50" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-sand">No saved games public yet</p>
                  <p className="mt-0.5 text-xs text-tan">This collector hasn&apos;t added any titles to their vault.</p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {userFavorites.map((game) => (
                    <div
                      key={game._id || game.gameId}
                      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-brown/30 bg-brown/10 transition-all duration-300 hover:-translate-y-1 hover:border-brown/60 hover:shadow-xl"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-carafe/80">
                        <Image
                          src={showGameImage(game.img)}
                          alt={game.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {game.console && (
                          <span className="absolute left-2.5 top-2.5 rounded-md border border-brown/40 bg-carafe/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sand backdrop-blur-md">
                            {game.console}
                          </span>
                        )}
                        {game.critic_score ? (
                          <span className="absolute right-2.5 top-2.5 rounded-md bg-brown/90 px-2 py-0.5 text-[11px] font-bold text-sand backdrop-blur-md">
                            ★ {game.critic_score}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          {game.genre && (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-tan">
                              {game.genre}
                            </span>
                          )}
                          <h3 className="mt-1 line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-tan">
                            {game.title}
                          </h3>
                        </div>

                        <div className="mt-4 border-t border-brown/20 pt-3">
                          <Link
                            href={`/games/${game.gameId || game.id}`}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-brown/30 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown hover:text-white"
                          >
                            View Game Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}