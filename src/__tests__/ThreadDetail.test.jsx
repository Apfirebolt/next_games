// src/__tests__/ThreadDetail.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ThreadDetailPage from "../app/forums/[threadId]/page";
import { fetchThreadById } from "../features/threads/threadSlice";
import {
  fetchPostsByThread,
  createPost,
  setActiveQuote,
  clearActiveQuote,
  setReplyToParentId,
  clearReplyToParentId,
} from "../features/posts/postSlice";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
let mockParams = { threadId: "th1" };

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

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, priority, sizes, ...props }) => (
    <img src={src} alt={alt || ""} {...props} />
  ),
}));

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("../features/threads/threadSlice", () => ({
  fetchThreadById: vi.fn(),
}));

vi.mock("../features/posts/postSlice", () => ({
  fetchPostsByThread: vi.fn(),
  createPost: vi.fn(),
  setActiveQuote: vi.fn(),
  clearActiveQuote: vi.fn(),
  setReplyToParentId: vi.fn(),
  clearReplyToParentId: vi.fn(),
}));

const currentThread = {
  _id: "th1",
  title: "Best RPGs of 2024",
  categoryId: { _id: "cat1", title: "RPG Talk" },
  creator: { username: "alice" },
  createdAt: "2024-01-01T10:00:00Z",
  viewsCount: 150,
  replyCount: 2,
  isPinned: true,
  isLocked: false,
};

const posts = [
  {
    _id: "p1",
    parentId: null,
    author: { username: "alice" },
    content: "Opening post content",
    createdAt: "2024-01-01T10:05:00Z",
  },
  {
    _id: "p2",
    parentId: "p1",
    depth: 1,
    author: { username: "bob" },
    content: "Reply content",
    createdAt: "2024-01-02T09:00:00Z",
    quote: { authorName: "alice", selectedText: "quoted bit" },
  },
];

function renderWithStore({ user = { id: "u1" }, threadsState = {}, postsState = {} } = {}) {
  const threadState = {
    currentThread,
    isThreadDetailLoading: false,
    ...threadsState,
  };
  const postState = {
    posts,
    isLoading: false,
    isSubmitLoading: false,
    activeQuote: null,
    replyToParentId: null,
    ...postsState,
  };

  const store = configureStore({
    reducer: {
      auth: (state = { user }, action) => state,
      threads: (state = threadState, action) => state,
      posts: (state = postState, action) => state,
    },
    preloadedState: {
      auth: { user },
      threads: threadState,
      posts: postState,
    },
  });

  return render(
    <Provider store={store}>
      <ThreadDetailPage />
    </Provider>
  );
}

describe("ThreadDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { threadId: "th1" };
    Element.prototype.scrollIntoView = vi.fn();
    fetchThreadById.mockReturnValue({ type: "threads/fetchById" });
    fetchPostsByThread.mockReturnValue({ type: "posts/fetchByThread" });
    createPost.mockReturnValue({ type: "posts/create/fulfilled" });
    setActiveQuote.mockReturnValue({ type: "posts/setActiveQuote" });
    clearActiveQuote.mockReturnValue({ type: "posts/clearActiveQuote" });
    setReplyToParentId.mockReturnValue({ type: "posts/setReplyToParentId" });
    clearReplyToParentId.mockReturnValue({ type: "posts/clearReplyToParentId" });
  });

  it("renders Header, Footer, and breadcrumb links", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forums" })).toHaveAttribute("href", "/forums");
    expect(screen.getByRole("link", { name: "RPG Talk" })).toHaveAttribute(
      "href",
      "/forums/category/cat1"
    );
  });

  it("dispatches fetchThreadById and fetchPostsByThread with the route thread id", () => {
    renderWithStore();

    expect(fetchThreadById).toHaveBeenCalledWith("th1");
    expect(fetchPostsByThread).toHaveBeenCalledWith({ threadId: "th1", mode: "tree" });
  });

  it("does not dispatch fetches when there is no thread id", () => {
    mockParams = {};
    renderWithStore();

    expect(fetchThreadById).not.toHaveBeenCalled();
    expect(fetchPostsByThread).not.toHaveBeenCalled();
  });

  it("shows loading skeletons while thread or posts are loading", () => {
    const { container } = renderWithStore({ postsState: { isLoading: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
    expect(screen.queryByText("Opening post content")).not.toBeInTheDocument();
  });

  it("renders the thread hero banner with badges and stats", () => {
    renderWithStore();

    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Best RPGs of 2024" })).toBeInTheDocument();
    expect(screen.getAllByText("alice").length).toBeGreaterThan(0);
    expect(screen.getByText("150 Views")).toBeInTheDocument();
    expect(screen.getByText("2 Replies")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /post reply/i })).toBeInTheDocument();
  });

  it("hides the 'Post Reply' shortcut and shows a locked notice when the thread is locked", () => {
    renderWithStore({ threadsState: { currentThread: { ...currentThread, isLocked: true } } });

    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^post reply$/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/this discussion has been locked by moderators/i)
    ).toBeInTheDocument();
  });

  it("renders the opening post and reply stream with author fallback and quote callouts", () => {
    renderWithStore();

    expect(screen.getByText("Opening post content")).toBeInTheDocument();
    expect(screen.getByText("Original Poster")).toBeInTheDocument();
    expect(screen.getByText("Responses (1)")).toBeInTheDocument();
    expect(screen.getByText("Reply content")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText(/alice wrote:/)).toBeInTheDocument();
    expect(screen.getByText(/quoted bit/)).toBeInTheDocument();
  });

  it("dispatches setReplyToParentId and scrolls to the editor when replying to a post", () => {
    renderWithStore();

    fireEvent.click(screen.getAllByRole("button", { name: "Reply" })[0]);

    expect(setReplyToParentId).toHaveBeenCalledWith("p1");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("shows a sign-in prompt in the editor area when logged out", () => {
    renderWithStore({ user: null });

    expect(screen.getByText("Join the Discussion")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sign in to reply/i }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("shows 'Replying to Comment' and clears the reply target on cancel", () => {
    renderWithStore({ postsState: { replyToParentId: "p2" } });

    expect(screen.getByText("Replying to Comment")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel direct reply/i }));

    expect(clearReplyToParentId).toHaveBeenCalledTimes(1);
    expect(clearActiveQuote).toHaveBeenCalledTimes(1);
  });

  it("shows the active quote preview and clears it via the close button", () => {
    renderWithStore({
      postsState: { activeQuote: { authorName: "alice", selectedText: "nice point" } },
    });

    expect(screen.getByText("Quoting alice")).toBeInTheDocument();
    expect(screen.getByText(/nice point/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("✕"));
    expect(clearActiveQuote).toHaveBeenCalledTimes(1);
  });

  it("disables submission until content is entered, then submits and clears the field", async () => {
    renderWithStore();

    const textarea = screen.getByPlaceholderText(/share your thoughts/i);
    const submitBtn = screen.getByRole("button", { name: /submit reply/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "My thoughts here" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    expect(createPost).toHaveBeenCalledWith({
      threadId: "th1",
      content: "My thoughts here",
      parentId: null,
      quote: undefined,
    });
    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("keeps the reply content when submission fails", async () => {
    createPost.mockReturnValue({ type: "posts/create/rejected", error: { message: "Failed" } });
    renderWithStore();

    const textarea = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(textarea, { target: { value: "My thoughts here" } });
    fireEvent.click(screen.getByRole("button", { name: /submit reply/i }));

    await waitFor(() => {
      expect(createPost).toHaveBeenCalledTimes(1);
    });
    expect(textarea).toHaveValue("My thoughts here");
  });

  it("shows a quote-selection popover on text selection and applies it on click", () => {
    renderWithStore();

    window.getSelection = () => ({
      toString: () => "a great insight",
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ left: 100, width: 20, top: 50 }),
      }),
    });

    fireEvent.mouseUp(screen.getByText("Opening post content"));

    const quoteBtn = screen.getByRole("button", { name: /quote selection/i });
    expect(quoteBtn).toBeInTheDocument();

    fireEvent.click(quoteBtn);

    expect(setActiveQuote).toHaveBeenCalledWith({
      originalPostId: "p1",
      authorName: "alice",
      selectedText: "a great insight",
    });
    expect(setReplyToParentId).toHaveBeenCalledWith("p1");
    expect(screen.queryByRole("button", { name: /quote selection/i })).not.toBeInTheDocument();
  });
});
