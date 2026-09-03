"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import gsap from "gsap";
import { getGames } from "../../features/game/gameSlice";
import { fetchFavorites } from "../../features/favorites/favoriteSlice";
import FavoriteButton from "../../components/FavoriteButton";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

export default function Games() {
  const dispatch = useDispatch();
  const gameList = useSelector((state) => state.game.gameList);
  const isLoading = useSelector((state) => state.game.isLoading);
  const user = useSelector((state) => state.auth?.user);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const isFirstRender = useRef(true);

  // Fetch games on mount
  useEffect(() => {
    dispatch(getGames({ page: 1, search: "" }));
  }, [dispatch]);

  // Sync user's saved favorites list if authenticated
  useEffect(() => {
    if (user) {
      dispatch(fetchFavorites());
    }
  }, [user, dispatch]);

  // Debounced search (resets to page 1 on input change)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      dispatch(getGames({ page: 1, search: searchText }));
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, dispatch]);

  // GSAP entrance animation when results change
  useEffect(() => {
    if (gameList?.results?.length) {
      gsap.fromTo(
        ".game-card",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [gameList]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    dispatch(getGames({ page, search: searchText }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showGameImage = (imgSrc) => {
    if (!imgSrc) return "/placeholder-game.png";
    return imgSrc.startsWith("http") ? imgSrc : `https://www.vgchartz.com${imgSrc}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Search & Header Banner */}
        <div className="mb-8 rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Game Catalog
            </h1>
            <p className="mt-2 text-sm text-tan">
              Browse, search, and bookmark titles from over 60,000 games across all platforms.
            </p>

            {/* Search Input Bar */}
            <div className="relative mt-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-tan">
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
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by title, genre, or publisher..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-xl border border-brown/40 bg-carafe/90 py-3 pl-10 pr-4 text-sm text-sand shadow-inner placeholder:text-tan/60 transition-all focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
              />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <Loader text="Fetching Games..." />
        ) : (
          <>
            {/* Game Grid */}
            {gameList?.results?.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {gameList.results.map((game) => (
                  <div
                    key={game.id}
                    className="game-card group flex flex-col overflow-hidden rounded-xl border border-brown/30 bg-brown/10 transition-all duration-300 hover:-translate-y-1 hover:border-brown/60 hover:shadow-xl"
                  >
                    {/* Image Header with Console Badge & Overlay Favorite Button */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-carafe/80">
                      <img
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={showGameImage(game.img)}
                        alt={game.title}
                        loading="lazy"
                      />

                      {/* Console Tag */}
                      {game.console && (
                        <span className="absolute top-2.5 left-2.5 rounded-md border border-brown/40 bg-carafe/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sand backdrop-blur-md">
                          {game.console}
                        </span>
                      )}

                      {/* Top-Right Badges: Critic Score & Bookmark Toggle */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        {game.critic_score ? (
                          <span className="rounded-md bg-brown/90 px-2 py-1 text-[11px] font-bold text-sand backdrop-blur-md">
                            ★ {game.critic_score}
                          </span>
                        ) : null}
                        <FavoriteButton
                          game={game}
                          className="h-7 w-7 rounded-md border-brown/40 bg-carafe/90 p-1 backdrop-blur-md"
                        />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          {game.genre && (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-tan">
                              {game.genre}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-start justify-between gap-2">
                          <h2 className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-tan">
                            {game.title}
                          </h2>
                        </div>

                        {/* Metadata Details */}
                        <div className="mt-3 space-y-1 text-xs text-tan/80">
                          <p className="truncate">
                            <span className="text-sand/50">Publisher:</span> {game.publisher || "N/A"}
                          </p>
                          <p className="truncate">
                            <span className="text-sand/50">Year:</span> {game.release_date || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Link */}
                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          href={`/games/${game.id}`}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-brown/40 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown hover:text-white"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-medium text-sand">
                  No games found matching "{searchText}"
                </p>
                <p className="mt-1 text-xs text-tan">
                  Try searching for a different keyword or clear your filter.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="mt-4 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/80"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Pagination */}
            {gameList?.count > 25 && (
              <div className="mt-10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(gameList.count / 25)}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}