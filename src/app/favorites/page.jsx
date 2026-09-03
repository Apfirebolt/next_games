"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchFavorites, removeFavorite } from "../../features/favorites/favoriteSlice";

export default function FavoritesPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const { favorites, isLoading } = useSelector(
    (state) => state.favorites || { favorites: [], isLoading: false }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");

  // Fetch favorites on mount when user is present
  useEffect(() => {
    if (user) {
      dispatch(fetchFavorites());
    }
  }, [user, dispatch]);

  const showGameImage = (imgSrc) => {
    if (!imgSrc) return "/placeholder-game.png";
    return imgSrc.startsWith("http") ? imgSrc : `https://www.vgchartz.com${imgSrc}`;
  };

  const handleRemove = (e, gameId) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(removeFavorite(gameId));
  };

  // Extract unique genres for quick filtering
  const genres = [
    "ALL",
    ...new Set(favorites.map((fav) => fav.genre).filter(Boolean)),
  ];

  // Filter saved list by search query and genre
  const filteredFavorites = favorites.filter((fav) => {
    const matchesSearch =
      fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.publisher?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenre === "ALL" || fav.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Banner */}
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
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
                Personal Vault
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Saved <span className="text-tan">Games</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                {favorites.length} {favorites.length === 1 ? "title" : "titles"} stored in your library.
              </p>
            </div>

            {/* Catalog Action Link */}
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brown px-4 py-2.5 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white sm:self-start"
            >
              <span>Explore More Games</span>
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
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          {favorites.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-brown/20 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter saved games..."
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

              {/* Genre Pills */}
              {genres.length > 2 && (
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        selectedGenre === genre
                          ? "bg-tan text-carafe shadow-sm font-bold"
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
          <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Sign In to View Your Vault</h2>
            <p className="mt-1 max-w-sm text-xs text-tan">
              Create a personal catalog of titles, track completions, and manage your backlog across devices.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-semibold text-sand transition-all hover:bg-brown/80 hover:text-white"
            >
              Sign In to LevelVault
            </button>
          </div>
        ) : isLoading ? (
          /* Loading Skeletons */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-brown/20 bg-brown/10 p-4"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* Zero Saved Items State */
          <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
              <svg className="h-7 w-7 fill-none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Your Vault is Empty</h2>
            <p className="mt-1 max-w-sm text-xs text-tan">
              You haven&apos;t bookmarked any titles yet. Browse the catalog and click the bookmark button on any game to save it here.
            </p>
            <Link
              href="/games"
              className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-semibold text-sand transition-all hover:bg-brown/80 hover:text-white"
            >
              Browse Games Catalog
            </Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          /* Search Filter Empty State */
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-sand">No saved games match &quot;{searchQuery}&quot;</p>
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
          /* Saved Games Grid */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredFavorites.map((game) => (
              <div
                key={game._id || game.gameId}
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

                  {/* Console Tag */}
                  {game.console && (
                    <span className="absolute left-2.5 top-2.5 rounded-md border border-brown/40 bg-carafe/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sand backdrop-blur-md">
                      {game.console}
                    </span>
                  )}

                  {/* Critic Score Badge */}
                  {game.critic_score ? (
                    <span className="absolute right-2.5 top-2.5 rounded-md bg-brown/90 px-2 py-0.5 text-[11px] font-bold text-sand backdrop-blur-md">
                      ★ {game.critic_score}
                    </span>
                  ) : null}

                  {/* Quick Remove Action (Hover Overlay) */}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, game.gameId)}
                    title="Remove from favorites"
                    className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-danger/40 bg-carafe/90 text-danger transition-all hover:scale-110 hover:bg-danger hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Game Metadata */}
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
                        <span className="text-sand/50">Publisher:</span> {game.publisher || "N/A"}
                      </p>
                      <p className="truncate">
                        <span className="text-sand/50">Release:</span> {game.release_date || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Action Link to Game Details */}
                  <div className="mt-4 flex items-center gap-2 border-t border-brown/20 pt-3">
                    <Link
                      href={`/games/${game.gameId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-brown/30 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown hover:text-white"
                    >
                      View Details
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