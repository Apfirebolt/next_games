// src/components/__tests__/FavoriteButton.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import FavoriteButton from "../FavoriteButton";
import favoriteReducer from "../../features/favorites/favoriteSlice";
import authReducer from "../../features/auth/authSlice";
import favoriteService from "../../features/favorites/favoriteService";
import { toast } from "react-toastify";

vi.mock("../../features/favorites/favoriteService");
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const game = { id: 1, title: "Test Game" };

function renderWithStore({ user = { id: "u1" }, favoriteIds = [] } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, favorites: favoriteReducer },
    preloadedState: {
      auth: { user, profile: null, isError: false, isSuccess: false, isLoading: false, message: "" },
      favorites: { favorites: [], favoriteIds, isLoading: false, isReviewLoading: false, isError: false, isSuccess: false, message: "" },
    },
  });
  render(
    <Provider store={store}>
      <FavoriteButton game={game} />
    </Provider>
  );
  return store;
}

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts sign-in when no user is logged in", () => {
    renderWithStore({ user: null });

    fireEvent.click(screen.getByRole("button"));

    expect(toast.info).toHaveBeenCalledWith(
      "Please sign in to save games to your collection."
    );
    expect(favoriteService.addFavorite).not.toHaveBeenCalled();
  });

  it("adds the game to favorites when logged in and not yet favorited", async () => {
    favoriteService.addFavorite.mockResolvedValue({ id: 1 });
    renderWithStore({ favoriteIds: [] });

    fireEvent.click(screen.getByRole("button", { name: /save game to favorites/i }));

    expect(favoriteService.addFavorite).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: "Test Game" })
    );
  });

  it("removes the game from favorites when already favorited", async () => {
    favoriteService.removeFavorite.mockResolvedValue({ id: 1 });
    renderWithStore({ favoriteIds: [1] });

    fireEvent.click(screen.getByRole("button", { name: /remove from saved games/i }));

    expect(favoriteService.removeFavorite).toHaveBeenCalledWith(1);
  });
});
