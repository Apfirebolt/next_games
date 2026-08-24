"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getGameById } from "../../../features/gameSlice";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import Loader from "../../../components/Loader";

export default function GameDetail() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const game = useSelector((state) => state.game.game);
  const isLoading = useSelector((state) => state.game.isLoading);

  useEffect(() => {
    if (id) {
      dispatch(getGameById(id));
    }
  }, [dispatch, id]);

  const showGameImage = (imgSrc) => {
    if (!imgSrc) return "/placeholder-game.png";
    return imgSrc.startsWith("http") ? imgSrc : `https://www.vgchartz.com${imgSrc}`;
  };

  const getScoreColor = (score) => {
    const num = parseFloat(score);
    if (!num) return "text-tan border-brown/30 bg-brown/10";
    if (num >= 8.0) return "text-success border-success/30 bg-success/10";
    if (num >= 6.0) return "text-warning border-warning/30 bg-warning/10";
    return "text-danger border-danger/30 bg-danger/10";
  };

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb / Back Action */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium text-tan">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>
          <span>/</span>
          <span className="truncate text-sand/60">{game?.title || "Game Details"}</span>
        </div>

        {isLoading ? (
          <Loader text="Loading Game Details..." />
        ) : game ? (
          <div className="overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 shadow-2xl backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:p-10">
              
              {/* Media / Poster Showcase */}
              <div className="flex flex-col items-center justify-start lg:col-span-5">
                <div className="group relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl border border-brown/40 bg-carafe/80 shadow-lg">
                  <img
                    src={showGameImage(game.img)}
                    alt={game.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {game.console && (
                    <span className="absolute top-3 left-3 rounded-md bg-carafe/90 px-2.5 py-1 text-xs font-bold tracking-wider text-sand uppercase backdrop-blur-md border border-brown/40">
                      {game.console}
                    </span>
                  )}
                </div>
              </div>

              {/* Information & Specifications */}
              <div className="flex flex-col justify-between lg:col-span-7">
                <div>
                  {/* Genre Tag */}
                  {game.genre && (
                    <span className="inline-block rounded-full border border-tan/30 bg-tan/10 px-3 py-0.5 text-xs font-semibold text-tan uppercase tracking-wide">
                      {game.genre}
                    </span>
                  )}

                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {game.title}
                  </h1>

                  {/* Highlights Bar */}
                  <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-brown/20 py-4">
                    {/* Critic Score */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-tan uppercase tracking-wider">Score</span>
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-sm font-bold ${getScoreColor(
                          game.critic_score
                        )}`}
                      >
                        {game.critic_score ? `${game.critic_score}/10` : "N/A"}
                      </span>
                    </div>

                    {/* Sales metric */}
                    {game.total_sales && (
                      <div className="flex items-center gap-2 border-l border-brown/30 pl-4">
                        <span className="text-xs text-tan uppercase tracking-wider">Sales</span>
                        <span className="text-sm font-bold text-white">
                          {game.total_sales}M Units
                        </span>
                      </div>
                    )}

                    {/* Release Date */}
                    {game.release_date && (
                      <div className="flex items-center gap-2 border-l border-brown/30 pl-4">
                        <span className="text-xs text-tan uppercase tracking-wider">Released</span>
                        <span className="text-sm font-semibold text-sand">
                          {game.release_date}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Specs Grid */}
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-brown/30 bg-carafe/60 p-3.5">
                      <span className="block text-xs font-semibold text-tan/70 uppercase">Developer</span>
                      <span className="mt-1 block text-sm font-medium text-sand truncate">
                        {game.developer || "Not specified"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-brown/30 bg-carafe/60 p-3.5">
                      <span className="block text-xs font-semibold text-tan/70 uppercase">Publisher</span>
                      <span className="mt-1 block text-sm font-medium text-sand truncate">
                        {game.publisher || "Not specified"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-brown/30 bg-carafe/60 p-3.5">
                      <span className="block text-xs font-semibold text-tan/70 uppercase">Platform</span>
                      <span className="mt-1 block text-sm font-medium text-sand truncate">
                        {game.console || "Multi-platform"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-brown/30 bg-carafe/60 p-3.5">
                      <span className="block text-xs font-semibold text-tan/70 uppercase">Genre</span>
                      <span className="mt-1 block text-sm font-medium text-sand truncate">
                        {game.genre || "General"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Interactive CTA */}
                <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-brown/20">
                  <Link
                    href="/games"
                    className="inline-flex items-center justify-center rounded-lg bg-brown px-5 py-2.5 text-sm font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white"
                  >
                    Browse More Games
                  </Link>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <h2 className="text-xl font-bold text-white">Game Not Found</h2>
            <p className="mt-2 text-sm text-tan">The requested title could not be retrieved.</p>
            <Link
              href="/games"
              className="mt-6 rounded-lg bg-brown px-4 py-2 text-sm font-semibold text-sand hover:bg-brown/80"
            >
              Return to Catalog
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}