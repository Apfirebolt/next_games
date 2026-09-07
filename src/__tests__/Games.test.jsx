// src/__tests__/Games.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Games from "../app/games/page";
import { getGames } from "../features/game/gameSlice";
import { fetchFavorites } from "../features/favorites/favoriteSlice";

vi.mock("gsap", () => ({
  default: { fromTo: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("../components/FavoriteButton", () => ({
  default: ({ game }) => <button data-testid={`favorite-${game.id}`}>Favorite</button>,
}));

vi.mock("../components/Pagination", () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="mock-pagination" data-current={currentPage} data-total={totalPages}>
      <button onClick={() => onPageChange(currentPage + 1)}>Next Page</button>
    </div>
  ),
}));

vi.mock("../features/game/gameSlice", () => ({
  getGames: vi.fn(),
}));

vi.mock("../features/favorites/favoriteSlice", () => ({
  fetchFavorites: vi.fn(),
}));

const sampleGames = [
  {
    id: 1,
    title: "Space Raiders",
    genre: "Action",
    console: "PS5",
    publisher: "Nova Studios",
    release_date: "2022",
    critic_score: 8.5,
    img: "https://cdn.example.com/space-raiders.png",
  },
  {
    id: 2,
    title: "Puzzle Quest",
    genre: "Puzzle",
    console: "Switch",
    publisher: "Brainy Games",
    release_date: "2021",
    critic_score: null,
    img: "/images/relative-cover.png",
  },
];

function renderWithStore({
  gameList = { results: [], count: 0 },
  isLoading = false,
  user = null,
} = {}) {
  const store = configureStore({
    reducer: {
      game: (state = { gameList, isLoading }, action) => state,
      auth: (state = { user }, action) => state,
    },
    preloadedState: {
      game: { gameList, isLoading },
      auth: { user },
    },
  });

  const renderResult = render(
    <Provider store={store}>
      <Games />
    </Provider>
  );

  return { store, ...renderResult };
}

describe("Games page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getGames.mockReturnValue({ type: "game/list" });
    fetchFavorites.mockReturnValue({ type: "favorites/fetchAll" });
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders Header, Footer, banner heading and the search input", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /game catalog/i })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search by title, genre, or publisher/i)
    ).toBeInTheDocument();
  });

  it("fetches games on mount but not favorites when no user is logged in", () => {
    renderWithStore();

    expect(getGames).toHaveBeenCalledWith({ page: 1, search: "" });
    expect(fetchFavorites).not.toHaveBeenCalled();
  });

  it("fetches favorites when a user is logged in", () => {
    renderWithStore({ user: { id: "u1" } });

    expect(fetchFavorites).toHaveBeenCalledTimes(1);
  });

  it("shows the loader and hides the grid while isLoading is true", () => {
    renderWithStore({ isLoading: true, gameList: { results: sampleGames, count: 2 } });

    expect(screen.getByText("Fetching Games...")).toBeInTheDocument();
    expect(screen.queryByText("Space Raiders")).not.toBeInTheDocument();
  });

  it("renders game cards with title, metadata, and a resolved image source", () => {
    renderWithStore({ gameList: { results: sampleGames, count: 2 } });

    expect(screen.getByText("Space Raiders")).toBeInTheDocument();
    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
    expect(screen.getByText(/Nova Studios/)).toBeInTheDocument();
    expect(screen.getByText("★ 8.5")).toBeInTheDocument();
    expect(screen.getByText("PS5")).toBeInTheDocument();

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "https://cdn.example.com/space-raiders.png");
    expect(images[1]).toHaveAttribute("src", "https://www.vgchartz.com/images/relative-cover.png");

    expect(screen.getAllByRole("link", { name: /view details/i })[0]).toHaveAttribute(
      "href",
      "/games/1"
    );
    expect(screen.getByTestId("favorite-1")).toBeInTheDocument();
  });

  it("shows an empty state message with the current search text and clears it on button click", async () => {
    renderWithStore({ gameList: { results: [], count: 0 } });

    const searchInput = screen.getByPlaceholderText(/search by title, genre, or publisher/i);
    fireEvent.change(searchInput, { target: { value: "zorp" } });

    expect(screen.getByText(/No games found matching "zorp"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
  });

  it("debounces search input and re-dispatches getGames with the typed query", async () => {
    renderWithStore({ gameList: { results: [], count: 0 } });
    getGames.mockClear();

    const searchInput = screen.getByPlaceholderText(/search by title, genre, or publisher/i);
    fireEvent.change(searchInput, { target: { value: "mario" } });

    expect(getGames).not.toHaveBeenCalled();

    vi.advanceTimersByTime(350);

    await waitFor(() => {
      expect(getGames).toHaveBeenCalledWith({ page: 1, search: "mario" });
    });
  });

  it("renders pagination when there are more than 25 results and dispatches getGames on page change", () => {
    renderWithStore({ gameList: { results: sampleGames, count: 60 } });
    getGames.mockClear();

    const pagination = screen.getByTestId("mock-pagination");
    expect(pagination).toHaveAttribute("data-total", "3");

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));

    expect(getGames).toHaveBeenCalledWith({ page: 2, search: "" });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("does not render pagination when there are 25 or fewer results", () => {
    renderWithStore({ gameList: { results: sampleGames, count: 2 } });

    expect(screen.queryByTestId("mock-pagination")).not.toBeInTheDocument();
  });
});
