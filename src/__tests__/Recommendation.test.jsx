// src/__tests__/Recommendation.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import RecommendationsPage from "../app/recommendation/page";
import { getUserRecommendations } from "../features/recommendations/recommendationSlice";

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

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("../features/recommendations/recommendationSlice", async () => {
  const actual = await vi.importActual("../features/recommendations/recommendationSlice");
  return {
    ...actual,
    getUserRecommendations: vi.fn(),
  };
});

const baseRecState = {
  items: [],
  isEligible: false,
  requiredCount: 3,
  currentCount: 0,
  status: "idle",
  error: null,
};

const sampleItems = [
  {
    catalogId: 1,
    title: "Space Raiders",
    genre: "Action",
    developer: "Nova Dev",
    console: "PS5",
    score: 92,
    criticScore: 8.5,
    releaseDate: "2022",
    img: "https://cdn.example.com/space.png",
  },
  {
    catalogId: 2,
    title: "Puzzle Quest",
    genre: "Puzzle",
    developer: "Brainy Games",
    console: "Switch",
    releaseDate: "2021",
    img: "/images/puzzle.png",
  },
];

function renderWithStore({ user = { id: "u1" }, recState = {} } = {}) {
  const userRecommendations = { ...baseRecState, ...recState };

  const store = configureStore({
    reducer: {
      auth: (state = { user }, action) => state,
      recommendations: (state = { userRecommendations }, action) => state,
    },
    preloadedState: {
      auth: { user },
      recommendations: { userRecommendations },
    },
  });

  return render(
    <Provider store={store}>
      <RecommendationsPage />
    </Provider>
  );
}

describe("RecommendationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserRecommendations.mockReturnValue({ type: "recommendations/getUserRecommendations" });
  });

  it("renders Header, Footer and the hero banner", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /recommended for you/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view vault/i })).toHaveAttribute(
      "href",
      "/favorites"
    );
  });

  it("shows the sign-in prompt and does not fetch recommendations when logged out", () => {
    renderWithStore({ user: null });

    expect(
      screen.getByText(/sign in for personalized recommendations/i)
    ).toBeInTheDocument();
    expect(getUserRecommendations).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /sign in to levelvault/i }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("fetches recommendations on mount when a user is logged in", () => {
    renderWithStore();

    expect(getUserRecommendations).toHaveBeenCalledTimes(1);
  });

  it("disables the refresh button while loading, and dispatches again when clicked", () => {
    renderWithStore({ recState: { status: "loading" } });
    getUserRecommendations.mockClear();

    const refreshBtn = screen.getByRole("button", { name: /refresh/i });
    expect(refreshBtn).toBeDisabled();
  });

  it("shows loading skeletons while fetching the first page", () => {
    const { container } = renderWithStore({ recState: { status: "loading", items: [] } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(8);
  });

  it("shows an error state and retries on 'Try Again' click", () => {
    renderWithStore({ recState: { status: "failed", error: "Server exploded" } });
    getUserRecommendations.mockClear();

    expect(screen.getByText("Server exploded")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(getUserRecommendations).toHaveBeenCalledTimes(1);
  });

  it("shows the ineligible under-threshold state with progress", () => {
    renderWithStore({
      recState: { status: "succeeded", isEligible: false, currentCount: 1, requiredCount: 3 },
    });

    expect(screen.getByText("Save 2 More Games")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse games catalog/i })).toHaveAttribute(
      "href",
      "/games"
    );
  });

  it("uses singular 'Game' copy when exactly one more save is required", () => {
    renderWithStore({
      recState: { status: "succeeded", isEligible: false, currentCount: 2, requiredCount: 3 },
    });

    expect(screen.getByText("Save 1 More Game")).toBeInTheDocument();
  });

  it("renders the recommendation grid with badges, links, and resolved image sources", () => {
    renderWithStore({
      recState: { status: "succeeded", isEligible: true, items: sampleItems },
    });

    expect(screen.getByText("Space Raiders")).toBeInTheDocument();
    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
    expect(screen.getByText("92 Affinity")).toBeInTheDocument();
    expect(screen.getByText("★ 8.5")).toBeInTheDocument();
    expect(screen.getByText(/Nova Dev/)).toBeInTheDocument();

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "https://cdn.example.com/space.png");
    expect(images[1]).toHaveAttribute("src", "https://www.vgchartz.com/images/puzzle.png");

    expect(screen.getAllByRole("link", { name: /explore title/i })[0]).toHaveAttribute(
      "href",
      "/games/1"
    );
  });

  it("filters the grid by search query across title and developer", () => {
    renderWithStore({
      recState: { status: "succeeded", isEligible: true, items: sampleItems },
    });

    fireEvent.change(screen.getByPlaceholderText(/filter recommendations/i), {
      target: { value: "brainy" },
    });

    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
    expect(screen.queryByText("Space Raiders")).not.toBeInTheDocument();
  });

  it("filters the grid by genre pill selection", () => {
    renderWithStore({
      recState: { status: "succeeded", isEligible: true, items: sampleItems },
    });

    fireEvent.click(screen.getByRole("button", { name: "Puzzle" }));

    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
    expect(screen.queryByText("Space Raiders")).not.toBeInTheDocument();
  });

  it("shows an empty filter state and resets filters on click", () => {
    renderWithStore({
      recState: { status: "succeeded", isEligible: true, items: sampleItems },
    });

    fireEvent.change(screen.getByPlaceholderText(/filter recommendations/i), {
      target: { value: "no-match-here" },
    });

    expect(screen.getByText(/No recommendations match "no-match-here"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(screen.getByText("Space Raiders")).toBeInTheDocument();
    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
  });
});
