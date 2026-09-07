// src/__tests__/GameDetail.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import GameDetail from "../app/games/[id]/page";
import { getGameById } from "../features/game/gameSlice";

const mockBack = vi.fn();
const mockRouter = { back: mockBack };
let mockParams = { id: "42" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => mockRouter,
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

vi.mock("../features/game/gameSlice", () => ({
  getGameById: vi.fn(),
}));

const sampleGame = {
  id: 42,
  title: "Space Raiders",
  genre: "Action",
  console: "PS5",
  publisher: "Nova Studios",
  developer: "Nova Dev",
  release_date: "2022",
  critic_score: 8.5,
  total_sales: 3.2,
  img: "https://cdn.example.com/space-raiders.png",
};

function renderWithStore({ game = {}, isLoading = false } = {}) {
  const store = configureStore({
    reducer: {
      game: (state = { game, isLoading }, action) => state,
    },
    preloadedState: { game: { game, isLoading } },
  });

  return render(
    <Provider store={store}>
      <GameDetail />
    </Provider>
  );
}

describe("GameDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { id: "42" };
    getGameById.mockReturnValue({ type: "game/detail" });
  });

  it("dispatches getGameById with the route id on mount", () => {
    renderWithStore();

    expect(getGameById).toHaveBeenCalledWith("42");
  });

  it("does not dispatch getGameById when there is no id", () => {
    mockParams = {};
    renderWithStore();

    expect(getGameById).not.toHaveBeenCalled();
  });

  it("renders Header, Footer, and the back-navigation button", () => {
    renderWithStore({ game: sampleGame });

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to library/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("shows the loader while isLoading is true", () => {
    renderWithStore({ isLoading: true });

    expect(screen.getByText("Loading Game Details...")).toBeInTheDocument();
  });

  it("renders full game details with resolved image, badges, and specs", () => {
    renderWithStore({ game: sampleGame });

    expect(screen.getByRole("heading", { level: 1, name: "Space Raiders" })).toBeInTheDocument();
    expect(screen.getByAltText("Space Raiders")).toHaveAttribute(
      "src",
      "https://cdn.example.com/space-raiders.png"
    );
    expect(screen.getByText("8.5/10")).toBeInTheDocument();
    expect(screen.getByText("3.2M Units")).toBeInTheDocument();
    expect(screen.getAllByText("PS5").length).toBeGreaterThan(0);
    expect(screen.getByText("Nova Dev")).toBeInTheDocument();
    expect(screen.getByText("Nova Studios")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse more games/i })).toHaveAttribute(
      "href",
      "/games"
    );
  });

  it("resolves a relative image path against the vgchartz CDN", () => {
    renderWithStore({ game: { ...sampleGame, img: "/images/cover.png" } });

    expect(screen.getByAltText("Space Raiders")).toHaveAttribute(
      "src",
      "https://www.vgchartz.com/images/cover.png"
    );
  });

  it("shows N/A and fallback specs when optional fields are missing", () => {
    renderWithStore({
      game: { id: 42, title: "Mystery Game" },
    });

    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getAllByText("Not specified").length).toBe(2);
    expect(screen.getByText("Multi-platform")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("applies the danger score color for a low critic score", () => {
    renderWithStore({ game: { ...sampleGame, critic_score: 3.1 } });

    expect(screen.getByText("3.1/10")).toHaveClass("text-danger");
  });

  it("applies the warning score color for a mid-range critic score", () => {
    renderWithStore({ game: { ...sampleGame, critic_score: 6.5 } });

    expect(screen.getByText("6.5/10")).toHaveClass("text-warning");
  });

  it("shows the 'Game Not Found' state when there is no game", () => {
    renderWithStore({ game: null });

    expect(screen.getByRole("heading", { name: /game not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to catalog/i })).toHaveAttribute(
      "href",
      "/games"
    );
  });
});
