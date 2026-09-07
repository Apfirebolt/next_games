// src/__tests__/Notifications.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import NotificationsPage from "../app/notifications/page";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../features/notifications/notificationSlice";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, ...props }) => <img src={src} alt={alt || ""} {...props} />,
}));

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("../features/notifications/notificationSlice", () => ({
  fetchNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const notifications = [
  {
    _id: "n1",
    type: "friend_request_sent",
    isRead: false,
    message: "Alice sent you a friend request",
    sender: { username: "alice", image: "https://cdn.example.com/alice.png" },
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    _id: "n2",
    type: "thread_reply",
    threadId: "t1",
    isRead: true,
    message: "Bob replied to your thread",
    sender: { username: "bob" },
    createdAt: "2024-01-02T11:00:00Z",
  },
  {
    _id: "n3",
    type: "comment_reply",
    isRead: false,
    message: "Carol commented on your post",
    createdAt: "2024-01-03T12:00:00Z",
  },
];

function renderWithStore({ user = { id: "u1" }, notifState = {} } = {}) {
  const notificationState = {
    notifications,
    unreadCount: 2,
    isLoading: false,
    ...notifState,
  };

  const store = configureStore({
    reducer: {
      auth: (state = { user }, action) => state,
      notifications: (state = notificationState, action) => state,
    },
    preloadedState: {
      auth: { user },
      notifications: notificationState,
    },
  });

  return render(
    <Provider store={store}>
      <NotificationsPage />
    </Provider>
  );
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchNotifications.mockReturnValue({ type: "notifications/fetch" });
    markAllNotificationsRead.mockReturnValue({ type: "notifications/markAllRead" });
    markNotificationRead.mockReturnValue({ type: "notifications/markRead" });
  });

  it("renders Header, Footer, and the banner heading", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /your notifications/i })
    ).toBeInTheDocument();
  });

  it("fetches notifications on mount only when a user is logged in", () => {
    renderWithStore({ user: null });
    expect(fetchNotifications).not.toHaveBeenCalled();

    renderWithStore();
    expect(fetchNotifications).toHaveBeenCalledTimes(1);
  });

  it("shows the 'Mark all as read' button only when there are unread notifications", () => {
    renderWithStore({ notifState: { unreadCount: 0 } });
    expect(screen.queryByRole("button", { name: /mark all as read/i })).not.toBeInTheDocument();

    renderWithStore();
    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it("shows filter tab counts for all and unread notifications", () => {
    renderWithStore();

    expect(screen.getByRole("button", { name: "All (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unread (2)" })).toBeInTheDocument();
  });

  it("shows loading skeletons while notifications are loading", () => {
    const { container } = renderWithStore({ notifState: { isLoading: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(5);
  });

  it("shows an empty state when there are no notifications", () => {
    renderWithStore({ notifState: { notifications: [], unreadCount: 0 } });

    expect(screen.getByText("No notifications found.")).toBeInTheDocument();
  });

  it("renders notifications with resolved links, avatar fallback, and unread indicators", () => {
    renderWithStore();

    expect(screen.getByText("Alice sent you a friend request")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alice sent you a friend request/i })).toHaveAttribute(
      "href",
      "/friends"
    );
    expect(screen.getByRole("link", { name: /bob replied to your thread/i })).toHaveAttribute(
      "href",
      "/forums/threads/t1"
    );
    expect(screen.getByRole("link", { name: /carol commented on your post/i })).toHaveAttribute(
      "href",
      "#"
    );

    expect(screen.getByAltText("alice")).toHaveAttribute("src", "https://cdn.example.com/alice.png");
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("marks an unread notification as read when clicked, but not an already-read one", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("link", { name: /alice sent you a friend request/i }));
    expect(markNotificationRead).toHaveBeenCalledWith("n1");

    markNotificationRead.mockClear();
    fireEvent.click(screen.getByRole("link", { name: /bob replied to your thread/i }));
    expect(markNotificationRead).not.toHaveBeenCalled();
  });

  it("filters to only unread notifications", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: "Unread (2)" }));

    expect(screen.getByText("Alice sent you a friend request")).toBeInTheDocument();
    expect(screen.getByText("Carol commented on your post")).toBeInTheDocument();
    expect(screen.queryByText("Bob replied to your thread")).not.toBeInTheDocument();
  });

  it("filters to only friend/social notifications", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: "Friends & Requests" }));

    expect(screen.getByText("Alice sent you a friend request")).toBeInTheDocument();
    expect(screen.queryByText("Bob replied to your thread")).not.toBeInTheDocument();
    expect(screen.queryByText("Carol commented on your post")).not.toBeInTheDocument();
  });

  it("filters to only forum reply notifications", () => {
    renderWithStore();

    fireEvent.click(screen.getByRole("button", { name: "Forum Replies" }));

    expect(screen.getByText("Bob replied to your thread")).toBeInTheDocument();
    expect(screen.getByText("Carol commented on your post")).toBeInTheDocument();
    expect(screen.queryByText("Alice sent you a friend request")).not.toBeInTheDocument();
  });
});
