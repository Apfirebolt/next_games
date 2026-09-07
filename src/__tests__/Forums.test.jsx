// src/__tests__/Forums.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ForumsPage from "../app/forums/page";
import {
  fetchCategories,
  createCategory,
  resetCategoryStatus,
} from "../features/categories/categorySlice";
import { fetchThreads, setViewMode } from "../features/threads/threadSlice";

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

vi.mock("../features/categories/categorySlice", () => ({
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  resetCategoryStatus: vi.fn(),
}));

vi.mock("../features/threads/threadSlice", () => ({
  fetchThreads: vi.fn(),
  setViewMode: vi.fn(),
}));

const categories = [
  { _id: "cat1", title: "General Discussion", description: "Talk about anything", postCount: 5 },
  { _id: "cat2", title: "Strategy Tips", description: "Share strategies" },
];

const threads = [
  {
    _id: "t1",
    categoryId: "cat1",
    title: "Welcome thread",
    isPinned: true,
    replyCount: 4,
    viewsCount: 120,
    createdAt: "2024-01-01T00:00:00Z",
    creator: { username: "alice" },
    latestPost: { username: "bob", createdAt: "2024-01-05T00:00:00Z" },
  },
  {
    _id: "t2",
    categoryId: "cat1",
    title: "Best builds thread",
    replyCount: 0,
    viewsCount: 10,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

function renderWithStore({
  user = { id: "u1" },
  categoriesState = {},
  threadsState = {},
} = {}) {
  const categoryState = {
    categories,
    isLoading: false,
    isCreateLoading: false,
    ...categoriesState,
  };
  const threadState = {
    threads,
    isLoading: false,
    viewMode: "table",
    ...threadsState,
  };

  const store = configureStore({
    reducer: {
      auth: (state = { user }, action) => state,
      categories: (state = categoryState, action) => state,
      threads: (state = threadState, action) => state,
    },
    preloadedState: {
      auth: { user },
      categories: categoryState,
      threads: threadState,
    },
  });

  return render(
    <Provider store={store}>
      <ForumsPage />
    </Provider>
  );
}

describe("ForumsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCategories.mockReturnValue({ type: "categories/fetchAll" });
    fetchThreads.mockReturnValue({ type: "threads/fetchAll" });
    setViewMode.mockReturnValue({ type: "threads/setViewMode" });
    resetCategoryStatus.mockReturnValue({ type: "categories/resetStatus" });
  });

  it("renders Header, Footer, banner heading, and the category/thread summary", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /discussion forums/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/2 categories with 2 active threads\./)).toBeInTheDocument();
  });

  it("fetches categories and threads on mount", () => {
    renderWithStore();

    expect(fetchCategories).toHaveBeenCalledTimes(1);
    expect(fetchThreads).toHaveBeenCalledWith({ limit: 100 });
  });

  it("shows the 'New Category' button only when a user is logged in", () => {
    const { rerender } = renderWithStore({ user: null });
    expect(screen.queryByRole("button", { name: /new category/i })).not.toBeInTheDocument();

    renderWithStore();
    expect(screen.getByRole("button", { name: /new category/i })).toBeInTheDocument();
  });

  it("shows loading skeletons while categories or threads are loading", () => {
    const { container } = renderWithStore({ categoriesState: { isLoading: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
    expect(screen.queryByRole("heading", { name: "General Discussion" })).not.toBeInTheDocument();
  });

  it("shows an empty categories state with a sign-in link when logged out", () => {
    renderWithStore({ user: null, categoriesState: { categories: [] } });

    expect(screen.getByText("No Categories Available")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in to contribute/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("shows a 'Create First Category' button in the empty state when logged in", () => {
    renderWithStore({ categoriesState: { categories: [] } });

    fireEvent.click(screen.getByRole("button", { name: /create first category/i }));

    expect(screen.getByText("Create Forum Category")).toBeInTheDocument();
  });

  it("filters categories by search query", () => {
    renderWithStore();

    fireEvent.change(screen.getByPlaceholderText(/search topics or categories/i), {
      target: { value: "strategy" },
    });

    expect(screen.getByRole("heading", { name: "Strategy Tips" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "General Discussion" })).not.toBeInTheDocument();
  });

  it("filters categories using the category tab pills", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: "Strategy Tips" }));

    expect(screen.getByRole("heading", { name: "Strategy Tips" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "General Discussion" })).not.toBeInTheDocument();
  });

  it("shows a no-match state and resets filters on click", () => {
    renderWithStore();

    fireEvent.change(screen.getByPlaceholderText(/search topics or categories/i), {
      target: { value: "zzz-nomatch" },
    });
    expect(screen.getByText(/No categories or threads match "zzz-nomatch"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(screen.getByRole("heading", { name: "General Discussion" })).toBeInTheDocument();
  });

  it("renders the category header with thread/post counts and empty-thread categories", () => {
    renderWithStore();

    expect(screen.getByText("2 threads")).toBeInTheDocument();
    expect(screen.getByText(/No threads have been started in Strategy Tips yet\./)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start the first conversation/i })
    ).toHaveAttribute("href", "/forums/new-thread?categoryId=cat2");
  });

  it("renders threads in table view with pinned tag, author fallback, and latest post", () => {
    renderWithStore();

    expect(screen.getByText("Welcome thread")).toBeInTheDocument();
    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("No replies")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("renders threads in card view when viewMode is 'card'", () => {
    renderWithStore({ threadsState: { viewMode: "card" } });

    expect(screen.getAllByText(/read →/i).length).toBeGreaterThan(0);
  });

  it("dispatches setViewMode when clicking the view switcher buttons", () => {
    renderWithStore();

    fireEvent.click(screen.getByTitle("Card View"));
    expect(setViewMode).toHaveBeenCalledWith("card");

    fireEvent.click(screen.getByTitle("Table View"));
    expect(setViewMode).toHaveBeenCalledWith("table");
  });

  it("disables category submission until a title is entered, then creates it", async () => {
    createCategory.mockReturnValue(() =>
      Promise.resolve({ type: "categories/create/fulfilled" })
    );
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: /new category/i }));
    const submitBtn = screen.getByRole("button", { name: /^create category$/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/hardware & racquets/i), {
      target: { value: "Off Topic" },
    });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await vi.waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Off Topic" })
      );
    });
    await vi.waitFor(() => {
      expect(screen.queryByText("Create Forum Category")).not.toBeInTheDocument();
    });
  });

  it("keeps the modal open when category creation fails", async () => {
    createCategory.mockReturnValue(() =>
      Promise.resolve({ type: "categories/create/rejected", error: { message: "Failed" } })
    );
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: /new category/i }));
    fireEvent.change(screen.getByPlaceholderText(/hardware & racquets/i), {
      target: { value: "Off Topic" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create category$/i }));

    await vi.waitFor(() => {
      expect(createCategory).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("Create Forum Category")).toBeInTheDocument();
  });

  it("closes the modal and resets category status via the Cancel button", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: /new category/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(resetCategoryStatus).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Create Forum Category")).not.toBeInTheDocument();
  });
});
