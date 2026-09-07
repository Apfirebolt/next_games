// src/__tests__/Favorites.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import FavoritesPage from "../app/favorites/page";
import {
  fetchFavorites,
  removeFavorite,
  saveGameReview,
  removeGameReview,
} from "../features/favorites/favoriteSlice";
import { getSimilarGames } from "../features/recommendations/recommendationSlice";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, sizes, ...props }) => <img src={src} alt={alt || ""} {...props} />,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockMDEditor = ({ value, onChange }) => (
      <textarea
        data-testid="md-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
    return MockMDEditor;
  },
}));

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("../features/favorites/favoriteSlice", () => ({
  fetchFavorites: vi.fn(),
  removeFavorite: vi.fn(),
  saveGameReview: vi.fn(),
  removeGameReview: vi.fn(),
}));

vi.mock("../features/recommendations/recommendationSlice", () => ({
  getSimilarGames: vi.fn(),
}));

const reviewedGame = {
  gameId: 1,
  title: "Space Raiders",
  genre: "Action",
  console: "PS5",
  critic_score: 8.5,
  publisher: "Nova Studios",
  release_date: "2022",
  img: "https://cdn.example.com/space.png",
  review: { title: "Great game", content: "So good", rating: 9 },
};

const plainGame = {
  gameId: 2,
  title: "Puzzle Quest",
  genre: "Puzzle",
  img: "/images/puzzle.png",
};

function renderWithStore({
  user = { id: "u1" },
  favoritesState = {},
  recommendationsState = {},
} = {}) {
  const favState = {
    favorites: [],
    isLoading: false,
    isReviewLoading: false,
    ...favoritesState,
  };
  const recState = { byGameId: {}, ...recommendationsState };

  const store = configureStore({
    reducer: {
      auth: (state = { user }, action) => state,
      favorites: (state = favState, action) => state,
      recommendations: (state = recState, action) => state,
    },
    preloadedState: {
      auth: { user },
      favorites: favState,
      recommendations: recState,
    },
  });

  return render(
    <Provider store={store}>
      <FavoritesPage />
    </Provider>
  );
}

describe("FavoritesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchFavorites.mockReturnValue({ type: "favorites/fetchAll" });
    removeFavorite.mockReturnValue({ type: "favorites/remove" });
    saveGameReview.mockReturnValue({ type: "favorites/saveReview" });
    removeGameReview.mockReturnValue({ type: "favorites/removeReview" });
    getSimilarGames.mockReturnValue({ type: "recommendations/getSimilar" });
  });

  it("renders Header, Footer, and the banner with a pluralized title count", () => {
    renderWithStore({ favoritesState: { favorites: [reviewedGame, plainGame] } });

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /saved games/i })).toBeInTheDocument();
    expect(screen.getByText("2 titles stored in your library.")).toBeInTheDocument();
  });

  it("shows the sign-in prompt and does not fetch favorites when logged out", () => {
    renderWithStore({ user: null });

    expect(screen.getByText(/sign in to view your vault/i)).toBeInTheDocument();
    expect(fetchFavorites).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /sign in to levelvault/i }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("fetches favorites on mount when logged in", () => {
    renderWithStore();

    expect(fetchFavorites).toHaveBeenCalledTimes(1);
  });

  it("shows loading skeletons while favorites are loading", () => {
    const { container } = renderWithStore({ favoritesState: { isLoading: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(8);
  });

  it("shows an empty vault state with a link back to the catalog", () => {
    renderWithStore({ favoritesState: { favorites: [] } });

    expect(screen.getByText("Your Vault is Empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse games catalog/i })).toHaveAttribute(
      "href",
      "/games"
    );
  });

  it("renders favorite cards with metadata, review badge, and detail link", () => {
    renderWithStore({ favoritesState: { favorites: [reviewedGame, plainGame] } });

    expect(screen.getByText("Space Raiders")).toBeInTheDocument();
    expect(screen.getByText("★ 9/10")).toBeInTheDocument();
    expect(screen.getByText('"Great game"')).toBeInTheDocument();
    expect(screen.getByText("★ 8.5")).toBeInTheDocument();
    expect(screen.getByText("PS5")).toBeInTheDocument();
    expect(screen.getByText(/Nova Studios/)).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /details/i })[0]
    ).toHaveAttribute("href", "/games/1");
  });

  it("filters favorites by search query across title and publisher", () => {
    renderWithStore({ favoritesState: { favorites: [reviewedGame, plainGame] } });

    fireEvent.change(screen.getByPlaceholderText(/filter saved games/i), {
      target: { value: "puzzle" },
    });

    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
    expect(screen.queryByText("Space Raiders")).not.toBeInTheDocument();
  });

  it("filters favorites using the genre pills", () => {
    renderWithStore({ favoritesState: { favorites: [reviewedGame, plainGame] } });

    fireEvent.click(screen.getByRole("button", { name: "Action" }));

    expect(screen.getByText("Space Raiders")).toBeInTheDocument();
    expect(screen.queryByText("Puzzle Quest")).not.toBeInTheDocument();
  });

  it("shows a no-match state and resets filters", () => {
    renderWithStore({ favoritesState: { favorites: [reviewedGame, plainGame] } });

    fireEvent.change(screen.getByPlaceholderText(/filter saved games/i), {
      target: { value: "zzz-nomatch" },
    });
    expect(screen.getByText(/No saved games match "zzz-nomatch"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(screen.getByText("Space Raiders")).toBeInTheDocument();
  });

  it("dispatches removeFavorite when clicking the remove button", () => {
    renderWithStore({ favoritesState: { favorites: [reviewedGame] } });

    fireEvent.click(screen.getByTitle("Remove from favorites"));

    expect(removeFavorite).toHaveBeenCalledWith(1);
  });

  describe("Review modal", () => {
    it("opens with empty fields for a game with no existing review", () => {
      renderWithStore({ favoritesState: { favorites: [plainGame] } });

      fireEvent.click(screen.getByTitle("Write a review"));

      expect(screen.getByText("Write Review")).toBeInTheDocument();
      expect(screen.getByTestId("md-editor")).toHaveValue("");
      expect(screen.queryByRole("button", { name: /delete review/i })).not.toBeInTheDocument();
    });

    it("opens pre-filled for a game with an existing review", () => {
      renderWithStore({ favoritesState: { favorites: [reviewedGame] } });

      fireEvent.click(screen.getByTitle("Edit your review"));

      expect(screen.getByText("Edit Review")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Great game")).toBeInTheDocument();
      expect(screen.getByDisplayValue("9")).toBeInTheDocument();
      expect(screen.getByTestId("md-editor")).toHaveValue("So good");
    });

    it("saves a new review with the entered fields", async () => {
      renderWithStore({ favoritesState: { favorites: [plainGame] } });

      fireEvent.click(screen.getByTitle("Write a review"));
      fireEvent.change(screen.getByPlaceholderText(/masterpiece with exceptional/i), {
        target: { value: "Pretty fun" },
      });
      fireEvent.change(screen.getByPlaceholderText("10"), { target: { value: "7" } });
      fireEvent.change(screen.getByTestId("md-editor"), { target: { value: "Body text" } });

      fireEvent.click(screen.getByRole("button", { name: /post review/i }));

      expect(saveGameReview).toHaveBeenCalledWith({
        gameId: 2,
        reviewData: { title: "Pretty fun", content: "Body text", rating: 7 },
      });
      await waitFor(() => {
        expect(screen.queryByText("Write Review")).not.toBeInTheDocument();
      });
    });

    it("deletes an existing review via the Delete Review button", async () => {
      renderWithStore({ favoritesState: { favorites: [reviewedGame] } });

      fireEvent.click(screen.getByTitle("Edit your review"));
      fireEvent.click(screen.getByRole("button", { name: /delete review/i }));

      expect(removeGameReview).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.queryByText("Edit Review")).not.toBeInTheDocument();
      });
    });

    it("closes without dispatching when Cancel is clicked", () => {
      renderWithStore({ favoritesState: { favorites: [plainGame] } });

      fireEvent.click(screen.getByTitle("Write a review"));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByText("Write Review")).not.toBeInTheDocument();
      expect(saveGameReview).not.toHaveBeenCalled();
    });
  });

  describe("Similar games modal", () => {
    it("dispatches getSimilarGames when opening the modal", () => {
      renderWithStore({ favoritesState: { favorites: [reviewedGame] } });

      fireEvent.click(screen.getByRole("button", { name: /similar/i }));

      expect(getSimilarGames).toHaveBeenCalledWith(1);
      expect(screen.getByText("Similar Games")).toBeInTheDocument();
    });

    it("shows loading skeletons while similar games are loading", () => {
      const { container } = renderWithStore({
        favoritesState: { favorites: [reviewedGame] },
        recommendationsState: { byGameId: { 1: { status: "loading" } } },
      });

      fireEvent.click(screen.getByRole("button", { name: /similar/i }));

      expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
    });

    it("shows an error state with a retry button", () => {
      renderWithStore({
        favoritesState: { favorites: [reviewedGame] },
        recommendationsState: {
          byGameId: { 1: { status: "failed", error: "Boom" } },
        },
      });

      fireEvent.click(screen.getByRole("button", { name: /similar/i }));
      expect(screen.getByText("Boom")).toBeInTheDocument();

      getSimilarGames.mockClear();
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
      expect(getSimilarGames).toHaveBeenCalledWith(1);
    });

    it("shows an empty state when there are no similar titles yet", () => {
      renderWithStore({
        favoritesState: { favorites: [reviewedGame] },
        recommendationsState: { byGameId: { 1: { status: "succeeded", similar: [] } } },
      });

      fireEvent.click(screen.getByRole("button", { name: /similar/i }));

      expect(screen.getByText("No similar titles computed yet for this game.")).toBeInTheDocument();
    });

    it("renders similar game results with match score and a link that closes the modal", () => {
      renderWithStore({
        favoritesState: { favorites: [reviewedGame] },
        recommendationsState: {
          byGameId: {
            1: {
              status: "succeeded",
              target: { title: "Space Raiders" },
              similar: [
                {
                  id: 99,
                  catalogId: 99,
                  title: "Star Fighters",
                  console: "PS5",
                  developer: "Nova Studios",
                  criticScore: 7.8,
                  similarityScore: 0.876,
                  img: "https://cdn.example.com/star.png",
                },
              ],
            },
          },
        },
      });

      fireEvent.click(screen.getByRole("button", { name: /similar/i }));

      expect(screen.getByText(/to Space Raiders/)).toBeInTheDocument();
      expect(screen.getByText("Star Fighters")).toBeInTheDocument();
      expect(screen.getByText("88% Match")).toBeInTheDocument();
      expect(screen.getByText("★ 7.8")).toBeInTheDocument();

      const viewLink = screen.getByRole("link", { name: /view game/i });
      expect(viewLink).toHaveAttribute("href", "/games/99");

      fireEvent.click(viewLink);
      expect(screen.queryByText("Star Fighters")).not.toBeInTheDocument();
    });
  });
});
