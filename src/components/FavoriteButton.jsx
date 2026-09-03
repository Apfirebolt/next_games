// src/components/FavoriteButton.jsx
"use client";

import { useSelector, useDispatch } from "react-redux";
import { addFavorite, removeFavorite } from "../features/favorites/favoriteSlice";
import { toast } from "react-toastify";

export default function FavoriteButton({ game, className = "" }) {
  const dispatch = useDispatch();

  // Read current user & cached favorite IDs from Redux
  const user = useSelector((state) => state.auth?.user);
  const favoriteIds = useSelector(
    (state) => state.favorites?.favoriteIds || []
  );

  const gameId = Number(game?.id || game?.gameId);
  const isFavorited = favoriteIds.includes(gameId);

  const handleToggle = (e) => {
    // Prevent triggering parent Link/Card navigation
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!user) {
      toast.info("Please sign in to save games to your collection.");
      return;
    }

    if (isFavorited) {
      dispatch(removeFavorite(gameId));
    } else {
      // Pass clean game payload matching your Favorite model
      dispatch(
        addFavorite({
          id: gameId,
          title: game.title,
          img: game.img || "",
          console: game.console || "",
          genre: game.genre || "",
          publisher: game.publisher || "",
          developer: game.developer || "",
          critic_score: Number(game.critic_score) || 0,
          total_sales: Number(game.total_sales) || 0,
          release_date: game.release_date || "",
        })
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isFavorited ? "Remove from saved games" : "Save game to favorites"}
      aria-label={isFavorited ? "Remove from saved games" : "Save game to favorites"}
      className={`group relative flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan ${
        isFavorited
          ? "border-tan/70 bg-tan/20 text-tan shadow-sm hover:bg-tan/30"
          : "border-brown/40 bg-carafe/80 text-tan/70 hover:border-tan/50 hover:bg-brown/40 hover:text-white"
      } ${className}`}
    >
      <svg
        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
          isFavorited ? "fill-tan text-tan" : "fill-none text-current"
        }`}
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
    </button>
  );
}