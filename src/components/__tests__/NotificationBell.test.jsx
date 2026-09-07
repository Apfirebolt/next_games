// src/components/__tests__/NotificationBell.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import NotificationBell from "../NotificationBell";
import notificationReducer from "../../features/notifications/notificationSlice";
import notificationService from "../../features/notifications/notificationService";

vi.mock("../../features/notifications/notificationService");
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: (props) => <img {...props} alt={props.alt || ""} />,
}));

const notifications = [
  {
    _id: "n1",
    message: "Alice sent you a friend request",
    type: "friend_request_sent",
    isRead: false,
    createdAt: "2024-01-01T10:00:00Z",
    sender: { username: "alice", image: "https://img/alice.png" },
  },
  {
    _id: "n2",
    message: "Bob replied to your thread",
    type: "thread_reply",
    threadId: "t123",
    isRead: true,
    createdAt: "2024-01-02T11:00:00Z",
    sender: { username: "bob" },
  },
  {
    _id: "n3",
    message: "Someone commented on your post",
    type: "comment_reply",
    isRead: false,
    createdAt: "2024-01-03T12:00:00Z",
  },
];

function renderWithStore({ items = [], unreadCount = 0 } = {}) {
  notificationService.getNotifications.mockResolvedValue({
    notifications: items,
    unreadCount,
  });
  const store = configureStore({
    reducer: { notifications: notificationReducer },
    preloadedState: {
      notifications: {
        notifications: items,
        unreadCount,
        isLoading: false,
        isError: false,
        message: "",
      },
    },
  });
  render(
    <Provider store={store}>
      <NotificationBell />
    </Provider>
  );
  return store;
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationService.markAllAsRead.mockResolvedValue({});
    notificationService.markSingleAsRead.mockImplementation((id) =>
      Promise.resolve({ notification: { _id: id, isRead: true } })
    );
  });

  it("fetches notifications on mount", () => {
    renderWithStore();
    expect(notificationService.getNotifications).toHaveBeenCalledTimes(1);
  });

  it("renders the trigger button without an unread badge when count is 0", () => {
    renderWithStore({ items: [], unreadCount: 0 });
    expect(screen.getByLabelText("Open notifications")).toBeInTheDocument();
    expect(screen.queryByText(/^\d+$|9\+/)).not.toBeInTheDocument();
  });

  it("shows the unread count, capping the badge display at 9+", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("shows the exact unread count when 9 or fewer", () => {
    renderWithStore({ items: notifications, unreadCount: 3 });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows an empty state message when there are no notifications", () => {
    renderWithStore({ items: [], unreadCount: 0 });
    fireEvent.click(screen.getByLabelText("Open notifications"));
    expect(
      screen.getByText("No notifications right now.")
    ).toBeInTheDocument();
  });

  it("renders the notification list with correct links, avatar and fallback initials", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    expect(screen.getByText("Alice sent you a friend request")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alice sent you a friend request/i })).toHaveAttribute(
      "href",
      "/friends"
    );
    expect(screen.getByRole("link", { name: /Bob replied to your thread/i })).toHaveAttribute(
      "href",
      "/forums/threads/t123"
    );
    expect(
      screen.getByRole("link", { name: /Someone commented on your post/i })
    ).toHaveAttribute("href", "/notifications");

    expect(screen.getByAltText("alice")).toHaveAttribute("src", "https://img/alice.png");
    expect(screen.getByText("b")).toBeInTheDocument(); // bob's fallback initial
    expect(screen.getByText("U")).toBeInTheDocument(); // no sender at all
  });

  it("marks an unread notification as read and closes the dropdown when clicked", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    fireEvent.click(screen.getByRole("link", { name: /Alice sent you a friend request/i }));

    expect(notificationService.markSingleAsRead).toHaveBeenCalledWith("n1");
    expect(screen.queryByText("No notifications right now.")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice sent you a friend request")).not.toBeInTheDocument();
  });

  it("does not mark an already-read notification as read when clicked", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    fireEvent.click(screen.getByRole("link", { name: /Bob replied to your thread/i }));

    expect(notificationService.markSingleAsRead).not.toHaveBeenCalled();
  });

  it("marks all notifications as read when the button is clicked", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    fireEvent.click(screen.getByText("Mark all read"));

    expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it("hides the Mark all read button when unread count is 0", () => {
    renderWithStore({ items: [], unreadCount: 0 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("closes the dropdown when pressing Escape", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("closes the dropdown when 'View all notifications' is clicked", () => {
    renderWithStore({ items: notifications, unreadCount: 12 });
    fireEvent.click(screen.getByLabelText("Open notifications"));

    fireEvent.click(screen.getByRole("link", { name: /view all notifications/i }));

    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });
});
