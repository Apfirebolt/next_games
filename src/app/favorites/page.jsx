"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import dynamic from "next/dynamic";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchFavorites,
  removeFavorite,
  saveGameReview,
  removeGameReview,
} from "../../features/favorites/favoriteSlice";
import { getSimilarGames } from "../../features/recommendations/recommendationSlice";

// Dynamic import with SSR disabled to prevent hydration mismatches
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

export default function FavoritesPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.user);
  const favorites = useSelector((state) => state.favorites?.favorites ?? EMPTY_ARRAY);
  const isLoading = useSelector((state) => state.favorites?.isLoading ?? false);
  const isReviewLoading = useSelector((state) => state.favorites?.isReviewLoading ?? false);
  const byGameId = useSelector((state) => state.recommendations?.byGameId ?? EMPTY_OBJECT);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("ALL");
  const [activeModalGameId, setActiveModalGameId] = useState(null);

  // Review Modal State
  const [reviewModalGame, setReviewModalGame] = useState(null);

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

  const handleOpenSimilar = (game) => {
    const lookupId = game.gameId || game._id || game.id;
    setActiveModalGameId(lookupId);
    dispatch(getSimilarGames(lookupId));
  };

  const closeModal = () => {
    setActiveModalGameId(null);
  };

  // Open Review Modal with previous contents if present
  const handleOpenReviewModal = (e, game) => {
    e.preventDefault();
    e.stopPropagation();

    const existingReview = game.review;
    setReviewModalGame({
      gameId: game.gameId,
      title: game.title,
      reviewTitle: existingReview?.title || "",
      content: existingReview?.content || "",
      rating: existingReview?.rating ?? "",
      isExisting: Boolean(existingReview && (existingReview.title || existingReview.content)),
    });
  };

  const handleCloseReviewModal = () => {
    setReviewModalGame(null);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!reviewModalGame) return;

    await dispatch(
      saveGameReview({
        gameId: reviewModalGame.gameId,
        reviewData: {
          title: reviewModalGame.reviewTitle,
          content: reviewModalGame.content,
          rating: reviewModalGame.rating ? Number(reviewModalGame.rating) : null,
        },
      })
    );

    handleCloseReviewModal();
  };

  const handleDeleteReviewOnly = async () => {
    if (!reviewModalGame) return;
    await dispatch(removeGameReview(reviewModalGame.gameId));
    handleCloseReviewModal();
  };

  const activeSimilarData = activeModalGameId ? byGameId[activeModalGameId] : null;

  const genres = [
    "ALL",
    ...new Set(favorites.map((fav) => fav.genre).filter(Boolean)),
  ];

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
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-brown/20 bg-brown/10 p-4"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
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
            {filteredFavorites.map((game) => {
              const hasReview = Boolean(game.review && (game.review.title || game.review.content));

              return (
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

                    {/* Top Action Overlay: Write/Edit Review Button & Remove Button */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                      {/* Write/Edit Review Pencil Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenReviewModal(e, game)}
                        title={hasReview ? "Edit your review" : "Write a review"}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-110 ${
                          hasReview
                            ? "border-tan/50 bg-tan text-carafe shadow-md hover:bg-white"
                            : "border-brown/40 bg-carafe/90 text-tan hover:bg-brown/80 hover:text-white"
                        }`}
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>

                      {/* Remove Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, game.gameId)}
                        title="Remove from favorites"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-danger/40 bg-carafe/90 text-danger backdrop-blur-md transition-all hover:scale-110 hover:bg-danger hover:text-white"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Game Metadata */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        {game.genre && (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-tan">
                            {game.genre}
                          </span>
                        )}

                        {hasReview && (
                          <span className="inline-flex items-center gap-1 rounded bg-tan/15 px-1.5 py-0.5 text-[10px] font-bold text-tan border border-tan/30">
                            {game.review?.rating ? `★ ${game.review.rating}/10` : "Reviewed"}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1 line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-tan">
                        {game.title}
                      </h2>

                      {/* Review Snippet if available */}
                      {hasReview && game.review?.title && (
                        <p className="mt-1 line-clamp-1 text-xs italic text-tan/90 font-serif">
                          &quot;{game.review.title}&quot;
                        </p>
                      )}

                      <div className="mt-3 space-y-1 text-xs text-tan/80">
                        <p className="truncate">
                          <span className="text-sand/50">Publisher:</span> {game.publisher || "N/A"}
                        </p>
                        <p className="truncate">
                          <span className="text-sand/50">Release:</span> {game.release_date || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-brown/20 pt-3">
                      <Link
                        href={`/games/${game.gameId || game._id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-brown/25 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown/50 hover:text-white"
                      >
                        Details
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleOpenSimilar(game)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-tan/40 bg-tan/10 py-2 text-xs font-semibold text-tan transition-all hover:border-tan hover:bg-tan hover:text-carafe"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
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
                        <span>Similar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Markdown Review Editor Modal */}
        {reviewModalGame && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={handleCloseReviewModal}
          >
            <div
              className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-brown/40 bg-carafe shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-brown/30 bg-brown/15 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tan/10 text-tan border border-tan/30">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {reviewModalGame.isExisting ? "Edit Review" : "Write Review"}
                    </h3>
                    <p className="text-xs text-tan truncate max-w-md">{reviewModalGame.title}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseReviewModal}
                  className="rounded-lg border border-brown/40 p-1.5 text-tan transition-colors hover:bg-brown/30 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSaveReview} className="flex flex-1 flex-col overflow-y-auto p-6 space-y-4">
                {/* Title and Rating Inputs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tan">
                      Review Headline / Title
                    </label>
                    <input
                      type="text"
                      value={reviewModalGame.reviewTitle}
                      onChange={(e) =>
                        setReviewModalGame({ ...reviewModalGame, reviewTitle: e.target.value })
                      }
                      placeholder="e.g. Masterpiece with exceptional world-building"
                      className="w-full rounded-lg border border-brown/40 bg-carafe/90 px-3.5 py-2 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tan">
                      Score (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={reviewModalGame.rating}
                      onChange={(e) =>
                        setReviewModalGame({
                          ...reviewModalGame,
                          rating: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      placeholder="10"
                      className="w-full rounded-lg border border-brown/40 bg-carafe/90 px-3.5 py-2 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                    />
                  </div>
                </div>

                {/* Markdown Editor Area */}
                <div className="flex-1 space-y-1.5" data-color-mode="dark">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-tan">
                    Markdown Notes & Detailed Critique
                  </label>
                  <div className="overflow-hidden rounded-xl border border-brown/40 bg-carafe">
                    <MDEditor
                      value={reviewModalGame.content}
                      onChange={(val) =>
                        setReviewModalGame({ ...reviewModalGame, content: val || "" })
                      }
                      height={280}
                      preview="edit"
                    />
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between border-t border-brown/20 pt-4">
                  {reviewModalGame.isExisting ? (
                    <button
                      type="button"
                      onClick={handleDeleteReviewOnly}
                      disabled={isReviewLoading}
                      className="rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2 text-xs font-semibold text-danger transition-all hover:bg-danger hover:text-white disabled:opacity-50"
                    >
                      Delete Review
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseReviewModal}
                      className="rounded-lg border border-brown/40 px-4 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isReviewLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-tan px-5 py-2 text-xs font-bold text-carafe shadow-md transition-all hover:bg-white disabled:opacity-50"
                    >
                      {isReviewLoading
                        ? "Saving..."
                        : reviewModalGame.isExisting
                        ? "Update Review"
                        : "Post Review"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Similar Games Modal Drawer */}
        {activeModalGameId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-brown/40 bg-carafe shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-brown/30 bg-brown/15 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Similar Games
                    {activeSimilarData?.target?.title && (
                      <span className="font-normal text-tan"> to {activeSimilarData.target.title}</span>
                    )}
                  </h3>
                  <p className="text-xs text-tan/70">Based on genre, developer, and platform</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-brown/40 p-1.5 text-tan transition-colors hover:bg-brown/30 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
                {activeSimilarData?.status === "loading" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-28 animate-pulse rounded-xl border border-brown/20 bg-brown/10" />
                    ))}
                  </div>
                ) : activeSimilarData?.status === "failed" ? (
                  <div className="py-12 text-center text-danger">
                    <p className="font-medium">{activeSimilarData.error || "Failed to load similar games."}</p>
                    <button
                      type="button"
                      onClick={() => dispatch(getSimilarGames(activeModalGameId))}
                      className="mt-3 rounded-lg bg-brown px-4 py-1.5 text-xs text-sand hover:text-white"
                    >
                      Retry
                    </button>
                  </div>
                ) : !activeSimilarData?.similar || activeSimilarData.similar.length === 0 ? (
                  <div className="py-12 text-center text-tan">
                    <p>No similar titles computed yet for this game.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {activeSimilarData.similar.map((simGame) => (
                      <div
                        key={simGame.id || simGame.catalogId}
                        className="group flex gap-3.5 overflow-hidden rounded-xl border border-brown/30 bg-brown/10 p-3 transition-all hover:border-tan/40 hover:bg-brown/20"
                      >
                        <div className="relative h-24 w-18 flex-shrink-0 overflow-hidden rounded-lg bg-carafe">
                          <Image
                            src={showGameImage(simGame.img)}
                            alt={simGame.title}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold uppercase text-tan">
                                {simGame.console || simGame.genre}
                              </span>
                              {typeof simGame.similarityScore === "number" && (
                                <span className="rounded bg-tan/20 px-1.5 py-0.5 text-[10px] font-bold text-tan">
                                  {Math.round(simGame.similarityScore * 100)}% Match
                                </span>
                              )}
                            </div>
                            <h4 className="mt-1 line-clamp-1 text-sm font-bold text-white group-hover:text-tan">
                              {simGame.title}
                            </h4>
                            <p className="line-clamp-1 text-[11px] text-tan/70">
                              {simGame.developer || simGame.publisher || "N/A"}
                            </p>
                          </div>

                          <div className="mt-2 flex items-center justify-between border-t border-brown/20 pt-2">
                            <span className="text-[11px] text-sand/80">
                              {simGame.criticScore ? `★ ${simGame.criticScore}` : ""}
                            </span>
                            <Link
                              href={`/games/${simGame.catalogId || simGame.id}`}
                              onClick={closeModal}
                              className="text-xs font-semibold text-tan underline-offset-4 hover:underline"
                            >
                              View Game →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}