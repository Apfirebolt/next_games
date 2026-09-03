"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  getUserRecommendations,
  selectUserRecommendations,
} from "../../features/recommendations/recommendationSlice";

export default function RecommendationsPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.user);
  const {
    items,
    isEligible,
    requiredCount,
    currentCount,
    status,
    error,
  } = useSelector(selectUserRecommendations);

  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      dispatch(getUserRecommendations());
    }
  }, [user, dispatch]);

  const showGameImage = (imgSrc) => {
    if (!imgSrc) return "/placeholder-game.png";
    return imgSrc.startsWith("http") ? imgSrc : `https://www.vgchartz.com${imgSrc}`;
  };

  // Extract unique genres for filtering pills
  const genres = [
    "ALL",
    ...new Set(items.map((game) => game.genre).filter(Boolean)),
  ];

  // Filter recommendations based on search & genre selection
  const filteredRecommendations = items.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.developer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === "ALL" || game.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const isLoading = status === "loading";
  const isFailed = status === "failed";

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Hero Banner */}
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
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
                Curated Feed
              </div>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Recommended <span className="text-tan">for You</span>
              </h1>
              <p className="mt-1 max-w-xl text-sm text-tan/80">
                Personalized selections synthesised from your library favorites across genre affinity, developer legacy, and platform overlap.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/favorites"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brown/40 bg-brown/20 px-4 py-2.5 text-xs font-semibold text-sand transition-all hover:border-tan hover:bg-brown/40 hover:text-white"
              >
                <span>View Vault</span>
              </Link>
              <button
                type="button"
                onClick={() => dispatch(getUserRecommendations())}
                disabled={isLoading || !user}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brown px-4 py-2.5 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filtering Bar */}
          {isEligible && items.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 border-t border-brown/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter recommendations..."
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

              {genres.length > 2 && (
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        selectedGenre === genre
                          ? "bg-tan font-bold text-carafe shadow-sm"
                          : "border border-brown/40 bg-brown/15 text-tan hover:border-tan/50 hover:text-white"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unauthenticated View */}
        {!user ? (
          <div className="my-auto flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Sign In for Personalized Recommendations</h2>
            <p className="mt-1 max-w-sm text-xs text-tan/80">
              Sign in and bookmark your favorite games to discover curated recommendations based on your gaming taste.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-semibold text-sand transition-all hover:bg-brown/80 hover:text-white"
            >
              Sign In to LevelVault
            </button>
          </div>
        ) : isLoading && items.length === 0 ? (
          /* Loading Skeletons */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-brown/20 bg-brown/10 p-4"
              />
            ))}
          </div>
        ) : isFailed ? (
          /* Error State */
          <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-danger">{error || "Failed to generate recommendations."}</p>
            <button
              type="button"
              onClick={() => dispatch(getUserRecommendations())}
              className="mt-4 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/80 hover:text-white"
            >
              Try Again
            </button>
          </div>
        ) : !isEligible ? (
          /* Under-Threshold (< 3 games) Ineligible State */
          <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-tan text-xs font-bold text-carafe">
                {currentCount}
              </span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              Save {Math.max(0, requiredCount - currentCount)} More {requiredCount - currentCount === 1 ? "Game" : "Games"}
            </h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-tan/80">
              Our recommendation engine requires at least <strong>{requiredCount} games</strong> in your vault to model your preferences. You currently have <strong>{currentCount}</strong> saved.
            </p>

            {/* Progress Bar Indicator */}
            <div className="mt-5 w-full max-w-xs">
              <div className="flex justify-between text-[11px] font-semibold text-tan/70">
                <span>Vault Progress</span>
                <span>{currentCount} / {requiredCount}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brown/30">
                <div
                  className="h-full rounded-full bg-tan transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (currentCount / requiredCount) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <Link
              href="/games"
              className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white"
            >
              Browse Games Catalog
            </Link>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          /* Filter Empty State */
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-sand">
              No recommendations match &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("ALL");
              }}
              className="mt-3 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/80"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Recommendations Grid */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredRecommendations.map((game, idx) => (
              <div
                key={game.catalogId || game.id || idx}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-brown/30 bg-brown/10 transition-all duration-300 hover:-translate-y-1 hover:border-brown/60 hover:shadow-xl"
              >
                {/* Poster Artwork */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-carafe/80">
                  <Image
                    src={showGameImage(game.img)}
                    alt={game.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Platform Tag */}
                  {game.console && (
                    <span className="absolute left-2.5 top-2.5 rounded-md border border-brown/40 bg-carafe/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sand backdrop-blur-md">
                      {game.console}
                    </span>
                  )}

                  {/* Affinity Match Score Pill */}
                  {typeof game.score === "number" && (
                    <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-tan/30 bg-carafe/90 px-2 py-0.5 text-[10px] font-bold text-tan backdrop-blur-md">
                      <svg className="h-2.5 w-2.5 fill-tan text-tan" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {game.score} Affinity
                    </span>
                  )}

                  {/* Critic Score Tag */}
                  {game.criticScore ? (
                    <span className="absolute bottom-2.5 left-2.5 rounded-md bg-brown/90 px-2 py-0.5 text-[11px] font-bold text-sand backdrop-blur-md">
                      ★ {game.criticScore}
                    </span>
                  ) : null}
                </div>

                {/* Metadata */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    {game.genre && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-tan">
                        {game.genre}
                      </span>
                    )}

                    <h2 className="mt-1 line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-tan">
                      {game.title}
                    </h2>

                    <div className="mt-3 space-y-1 text-xs text-tan/80">
                      <p className="truncate">
                        <span className="text-sand/50">Developer:</span> {game.developer || "N/A"}
                      </p>
                      <p className="truncate">
                        <span className="text-sand/50">Release:</span> {game.releaseDate || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="mt-4 border-t border-brown/20 pt-3">
                    <Link
                      href={`/games/${game.catalogId || game.id}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brown/30 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown hover:text-white"
                    >
                      <span>Explore Title</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}