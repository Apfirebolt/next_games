"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Home() {
  const { user: reduxUser } = useSelector((state) => state.auth || {});
  const { data: session, status } = useSession();

  // Combine both sources: instant recognition from NextAuth or Redux
  const user = reduxUser || session?.user;
  const isAuthenticated = Boolean(user) || status === "authenticated";
  const username =
    user?.username ||
    user?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "Player";

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Dynamic Top Badge: Shows Welcome Message If Authenticated */}
          {isAuthenticated ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-tan/30 bg-brown/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-sand backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Welcome back, <span className="font-bold text-white">@{username}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-brown/30 bg-brown/15 px-3.5 py-1 text-xs font-semibold tracking-wider text-tan uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Over 60,000 Titles Available
            </div>
          )}

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {isAuthenticated ? (
              <>
                Ready for your next quest, <br className="hidden sm:inline" />
                <span className="text-tan">{username}?</span>
              </>
            ) : (
              <>
                Discover Your Next <span className="text-tan">Favorite Game</span>
              </>
            )}
          </h1>

          <p className="mt-5 text-base leading-relaxed text-tan sm:text-lg">
            {isAuthenticated
              ? "Jump back into your tracked games, discover community-curated playlists, and log your latest completions."
              : "Explore an expansive library of classics, hypermodern indie titles, and competitive favorites."}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/games"
              className="rounded-lg bg-brown px-6 py-3 text-sm font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
            >
              Browse Library
            </Link>

            {isAuthenticated ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brown/40 bg-carafe px-5 py-3 text-sm font-medium text-sand transition-all hover:bg-brown/20 hover:text-white"
              >
                <span>View Profile</span>
                <svg
                  className="h-4 w-4 text-tan"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
            ) : (
              <a
                href="https://softgenie.org/api/games"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brown/40 bg-carafe px-5 py-3 text-sm font-medium text-sand transition-all hover:bg-brown/20 hover:text-white"
              >
                <span>API Reference</span>
                <svg
                  className="h-4 w-4 text-tan"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-brown/30 bg-brown/10 p-6 text-center backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">60K+ Games</h3>
            <p className="mt-2 text-xs leading-relaxed text-tan">
              Curated database spanning multiple genres and platforms.
            </p>
          </div>

          <div className="rounded-xl border border-brown/30 bg-brown/10 p-6 text-center backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">Fast Search</h3>
            <p className="mt-2 text-xs leading-relaxed text-tan">
              Instant filtering by tags, platforms, and release dates.
            </p>
          </div>

          <div className="rounded-xl border border-brown/30 bg-brown/10 p-6 text-center backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">Open API</h3>
            <p className="mt-2 text-xs leading-relaxed text-tan">
              Real-time synchronization powered by Softgenie endpoints.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}