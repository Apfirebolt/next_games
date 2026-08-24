"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import gsap from "gsap";
import { getGames } from "../../features/gameSlice";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

export default function Games() {
  const dispatch = useDispatch();
  const gameList = useSelector((state) => state.game.gameList);
  const isLoading = useSelector((state) => state.game.isLoading);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const isFirstRender = useRef(true);

  // Initial load
  useEffect(() => {
    dispatch(getGames({ page: 1, search: "" }));
  }, [dispatch]);

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

  // Trigger GSAP entrance animation when results load
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
              Browse, search, and inspect over 60,000 titles across all eras and consoles.
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
                className="w-full rounded-xl border border-brown/40 bg-carafe/90 py-3 pl-10 pr-4 text-sm text-sand placeholder:text-tan/60 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan transition-all shadow-inner"
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
                    {/* Image Header with Console Badge */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-carafe/80">
                      <img
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={showGameImage(game.img)}
                        alt={game.title}
                        loading="lazy"
                      />
                      {game.console && (
                        <span className="absolute top-2.5 left-2.5 rounded-md border border-brown/40 bg-carafe/90 px-2 py-0.5 text-[10px] font-bold tracking-wider text-sand uppercase backdrop-blur-md">
                          {game.console}
                        </span>
                      )}
                      {game.critic_score && (
                        <span className="absolute top-2.5 right-2.5 rounded-md bg-brown/90 px-2 py-0.5 text-[11px] font-bold text-sand backdrop-blur-md">
                          ★ {game.critic_score}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        {game.genre && (
                          <span className="text-[11px] font-semibold text-tan uppercase tracking-wide">
                            {game.genre}
                          </span>
                        )}
                        <h2 className="mt-1 line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-tan">
                          {game.title}
                        </h2>

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
                      <Link
                        href={`/games/${game.id}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brown/40 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown hover:text-white"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-medium text-sand">No games found matching "{searchText}"</p>
                <p className="mt-1 text-xs text-tan">Try searching for a different keyword or clear your filter.</p>
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