// src/__tests__/CategoryDetail.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CategoryDetailPage from "../app/forums/category/[id]/page";
import { fetchCategories } from "../features/categories/categorySlice";
import { fetchThreads, createThread, setViewMode } from "../features/threads/threadSlice";
import httpClient from "../plugins/interceptor";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
let mockParams = { id: "cat1" };

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

vi.mock("../features/categories/categorySlice", () => ({
  fetchCategories: vi.fn(),
}));

vi.mock("../features/threads/threadSlice", () => ({
  fetchThreads: vi.fn(),
  createThread: vi.fn(),
  setViewMode: vi.fn(),
}));

vi.mock("../plugins/interceptor", () => ({
  default: { post: vi.fn() },
}));

const categories = [
  { _id: "cat1", slug: "general", title: "General Discussion", description: "Talk about anything" },
];

const threads = [
  {
    _id: "t1",
    title: "Best builds",
    isPinned: true,
    replyCount: 5,
    viewsCount: 100,
    createdAt: "2024-01-01T00:00:00Z",
    creator: { username: "alice" },
    latestPost: { username: "bob", createdAt: "2024-01-05T00:00:00Z" },
  },
  {
    _id: "t2",
    title: "Newbie question",
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
  const categoryState = { categories, isLoading: false, ...categoriesState };
  const threadState = {
    threads,
    isLoading: false,
    isCreateLoading: false,
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
      <CategoryDetailPage />
    </Provider>
  );
}

describe("CategoryDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { id: "cat1" };
    fetchCategories.mockReturnValue({ type: "categories/fetchAll" });
    fetchThreads.mockReturnValue({ type: "threads/fetchAll" });
    setViewMode.mockReturnValue({ type: "threads/setViewMode" });
    createThread.mockReturnValue({
      type: "threads/create/fulfilled",
      payload: { thread: { _id: "newThread1" } },
    });
  });

  it("renders Header, Footer, breadcrumb, and category title/description", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forums" })).toHaveAttribute("href", "/forums");
    expect(
      screen.getByRole("heading", { level: 1, name: "General Discussion" })
    ).toBeInTheDocument();
    expect(screen.getByText("Talk about anything")).toBeInTheDocument();
  });

  it("fetches categories only when the list is empty, and always fetches threads for the category", () => {
    renderWithStore({ categoriesState: { categories: [] } });
    expect(fetchCategories).toHaveBeenCalledTimes(1);
    expect(fetchThreads).toHaveBeenCalledWith({ categoryId: "cat1", limit: 100 });

    vi.clearAllMocks();
    renderWithStore({ categoriesState: { categories } });
    expect(fetchCategories).not.toHaveBeenCalled();
  });

  it("renders aggregate stats for the category's threads", () => {
    renderWithStore();

    expect(screen.getAllByText("2").length).toBe(2); // Total Topics & Participants
    expect(screen.getByText("Total Responses").nextElementSibling).toHaveTextContent("5");
    expect(screen.getByText("110")).toBeInTheDocument(); // Thread Views
    expect(screen.getByText("2.5")).toBeInTheDocument(); // Avg Replies / Thread
  });

  it("shows loading skeletons while categories or threads are loading", () => {
    const { container } = renderWithStore({ threadsState: { isLoading: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(6);
    expect(screen.queryByText("Best builds")).not.toBeInTheDocument();
  });

  it("shows a 'No threads found' state and opens the create modal from it", () => {
    renderWithStore({ threadsState: { threads: [] } });

    expect(screen.getByText("No threads found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /start first discussion/i }));

    expect(screen.getByText("Start a New Thread")).toBeInTheDocument();
  });

  it("renders threads in table view with pinned tag, author fallback, and latest post", () => {
    renderWithStore();

    expect(screen.getAllByText("Pinned").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Best builds" })).toHaveAttribute(
      "href",
      "/forums/t1"
    );
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("No replies")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("renders threads in card view when viewMode is 'card'", () => {
    renderWithStore({ threadsState: { viewMode: "card" } });

    expect(screen.getAllByText(/view thread →/i).length).toBe(2);
    expect(screen.getAllByText("General Discussion").length).toBeGreaterThan(0);
  });

  it("dispatches setViewMode when switching view modes", () => {
    renderWithStore();

    fireEvent.click(screen.getByTitle("Card View"));
    expect(setViewMode).toHaveBeenCalledWith("card");

    fireEvent.click(screen.getByTitle("Table View"));
    expect(setViewMode).toHaveBeenCalledWith("table");
  });

  it("filters threads by search query across title and creator", () => {
    renderWithStore();

    fireEvent.change(screen.getByPlaceholderText(/search within this forum/i), {
      target: { value: "newbie" },
    });

    expect(screen.getByText("Newbie question")).toBeInTheDocument();
    expect(screen.queryByText("Best builds")).not.toBeInTheDocument();
  });

  it("filters threads using the Pinned and Unanswered pills", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: "Pinned" }));
    expect(screen.getByText("Best builds")).toBeInTheDocument();
    expect(screen.queryByText("Newbie question")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unanswered" }));
    expect(screen.getByText("Newbie question")).toBeInTheDocument();
    expect(screen.queryByText("Best builds")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All Topics" }));
    expect(screen.getByText("Best builds")).toBeInTheDocument();
    expect(screen.getByText("Newbie question")).toBeInTheDocument();
  });

  it("redirects to login when opening the create modal while logged out", () => {
    renderWithStore({ user: null });

    fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));

    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Start a New Thread")).not.toBeInTheDocument();
  });

  describe("CreateThreadModal", () => {
    it("disables submission until title and content are filled, then creates the thread and navigates", async () => {
      renderWithStore();

      fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));
      const submitBtn = screen.getByRole("button", { name: /publish thread/i });
      expect(submitBtn).toBeDisabled();

      fireEvent.change(
        screen.getByPlaceholderText(/recommended poly strings for crisp control/i),
        { target: { value: "My new topic" } }
      );
      fireEvent.change(
        screen.getByPlaceholderText(/provide details, context, questions/i),
        { target: { value: "Here is my opening message." } }
      );
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);

      expect(createThread).toHaveBeenCalledWith({
        categoryId: "cat1",
        title: "My new topic",
        content: "Here is my opening message.",
        media: null,
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/forums/newThread1");
      });
      expect(screen.queryByText("Start a New Thread")).not.toBeInTheDocument();
    });

    it("keeps the modal open and does not navigate when thread creation fails", async () => {
      createThread.mockReturnValue({
        type: "threads/create/rejected",
        error: { message: "Failed" },
      });
      renderWithStore();

      fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));
      fireEvent.change(
        screen.getByPlaceholderText(/recommended poly strings for crisp control/i),
        { target: { value: "My new topic" } }
      );
      fireEvent.change(
        screen.getByPlaceholderText(/provide details, context, questions/i),
        { target: { value: "Here is my opening message." } }
      );
      fireEvent.click(screen.getByRole("button", { name: /publish thread/i }));

      await waitFor(() => {
        expect(createThread).toHaveBeenCalledTimes(1);
      });
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText("Start a New Thread")).toBeInTheDocument();
    });

    it("closes via the Cancel button", () => {
      renderWithStore();

      fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByText("Start a New Thread")).not.toBeInTheDocument();
    });

    it("uploads a valid image and allows removing it", async () => {
      httpClient.post.mockResolvedValue({
        data: { url: "https://cdn.example.com/upload.png", publicId: "pub123" },
      });
      renderWithStore();

      fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));

      const file = new File(["content"], "photo.png", { type: "image/png" });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(httpClient.post).toHaveBeenCalledWith("upload", expect.any(FormData));
      });
      expect(await screen.findByText("Image attached successfully")).toBeInTheDocument();
      expect(screen.getByText("pub123")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /remove/i }));
      expect(screen.queryByText("Image attached successfully")).not.toBeInTheDocument();
    });

    it("shows an error for a non-image file and does not upload it", () => {
      renderWithStore();

      fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));

      const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(
        screen.getByText("Please select a valid image file (JPEG, PNG, WEBP).")
      ).toBeInTheDocument();
      expect(httpClient.post).not.toHaveBeenCalled();
    });

    it("shows an error for an oversized image file", () => {
      renderWithStore();

      fireEvent.click(screen.getByRole("button", { name: /post new thread/i }));

      const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", {
        type: "image/png",
      });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [bigFile] } });

      expect(screen.getByText("Image size must be under 5MB.")).toBeInTheDocument();
      expect(httpClient.post).not.toHaveBeenCalled();
    });
  });
});
