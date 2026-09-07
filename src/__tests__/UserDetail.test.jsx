// src/__tests__/UserDetail.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import UserDetailPage from "../app/users/[id]/page";
import { fetchUserById, clearSelectedUser } from "../features/user/userSlice";
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  sendFriendRequest,
  respondToFriendRequest,
  deleteFriendship,
} from "../features/friends/friendSlice";

let mockParams = { id: "target-1" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
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

vi.mock("../features/user/userSlice", () => ({
  fetchUserById: vi.fn(),
  clearSelectedUser: vi.fn(),
}));

vi.mock("../features/friends/friendSlice", () => ({
  fetchFriends: vi.fn(),
  fetchIncomingRequests: vi.fn(),
  fetchOutgoingRequests: vi.fn(),
  sendFriendRequest: vi.fn(),
  respondToFriendRequest: vi.fn(),
  deleteFriendship: vi.fn(),
}));

const targetUser = {
  _id: "target-1",
  username: "gamerpro",
  firstName: "Gamer",
  lastName: "Pro",
  email: "gamerpro@example.com",
  createdAt: "2022-03-15T00:00:00Z",
};

const favoritesResponse = [
  {
    _id: "f1",
    gameId: 10,
    title: "Space Raiders",
    genre: "Action",
    console: "PS5",
    critic_score: 8.5,
    img: "https://cdn.example.com/space.png",
  },
  {
    _id: "f2",
    gameId: 20,
    title: "Puzzle Quest",
    img: "/images/puzzle.png",
  },
];

function mockFetch(response = favoritesResponse, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
  });
}

function renderWithStore({
  currentUser = { id: "me-1" },
  userState = {},
  friendsState = {},
} = {}) {
  const userSliceState = {
    selectedUser: targetUser,
    isLoading: false,
    isError: false,
    ...userState,
  };
  const friendSliceState = {
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    isActionLoading: false,
    ...friendsState,
  };

  const store = configureStore({
    reducer: {
      auth: (state = { user: currentUser }, action) => state,
      user: (state = userSliceState, action) => state,
      friends: (state = friendSliceState, action) => state,
    },
    preloadedState: {
      auth: { user: currentUser },
      user: userSliceState,
      friends: friendSliceState,
    },
  });

  return render(
    <Provider store={store}>
      <UserDetailPage />
    </Provider>
  );
}

describe("UserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { id: "target-1" };
    mockFetch();
    fetchUserById.mockReturnValue({ type: "user/fetchById" });
    clearSelectedUser.mockReturnValue({ type: "user/clear" });
    fetchFriends.mockReturnValue({ type: "friends/fetchFriends" });
    fetchIncomingRequests.mockReturnValue({ type: "friends/fetchIncoming" });
    fetchOutgoingRequests.mockReturnValue({ type: "friends/fetchOutgoing" });
    sendFriendRequest.mockReturnValue(() =>
      Promise.resolve({ type: "friends/send/fulfilled" })
    );
    respondToFriendRequest.mockReturnValue(() =>
      Promise.resolve({ type: "friends/respond/fulfilled" })
    );
    deleteFriendship.mockReturnValue(() =>
      Promise.resolve({ type: "friends/delete/fulfilled" })
    );
  });

  it("renders Header, Footer, and the back-to-leaderboard link", async () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to leaderboard/i })).toHaveAttribute(
      "href",
      "/leaderboard"
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("dispatches fetchUserById on mount and clearSelectedUser on unmount", async () => {
    const { unmount } = renderWithStore();

    expect(fetchUserById).toHaveBeenCalledWith("target-1");
    unmount();
    expect(clearSelectedUser).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch fetchUserById when the id is the literal string 'undefined'", () => {
    mockParams = { id: "undefined" };
    renderWithStore();

    expect(fetchUserById).not.toHaveBeenCalled();
  });

  it("fetches friend relationship lists only when a user is logged in", () => {
    renderWithStore({ currentUser: null });
    expect(fetchFriends).not.toHaveBeenCalled();

    vi.clearAllMocks();
    renderWithStore();
    expect(fetchFriends).toHaveBeenCalledTimes(1);
    expect(fetchIncomingRequests).toHaveBeenCalledTimes(1);
    expect(fetchOutgoingRequests).toHaveBeenCalledTimes(1);
  });

  it("shows the loading skeleton while the profile is loading", () => {
    const { container } = renderWithStore({ userState: { isLoading: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("@gamerpro")).not.toBeInTheDocument();
  });

  it("shows a not-found state when the user has an error or no selected user", () => {
    renderWithStore({ userState: { selectedUser: null, isError: true } });

    expect(screen.getByText("Player Not Found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to leaderboard/i })).toHaveAttribute(
      "href",
      "/leaderboard"
    );
  });

  it("renders the profile header with username, join date, and full name", async () => {
    renderWithStore();

    expect(screen.getByRole("heading", { name: "@gamerpro" })).toBeInTheDocument();
    expect(screen.getByText("Gamer Pro")).toBeInTheDocument();
    expect(screen.getByText(/Joined March 15, 2022/)).toBeInTheDocument();
    expect(screen.getByText("gamerpro@example.com")).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("shows the 'Your Profile' badge when viewing your own page", () => {
    renderWithStore({ currentUser: { id: "target-1", username: "gamerpro" } });

    expect(screen.getByText("Your Profile")).toBeInTheDocument();
  });

  it("falls back to the first letter of the username when there is no avatar image", () => {
    renderWithStore({ userState: { selectedUser: { ...targetUser, image: null } } });

    expect(screen.queryByAltText("gamerpro")).not.toBeInTheDocument();
    expect(screen.getByText("g")).toBeInTheDocument();
  });

  it("renders the resolved avatar image when present", () => {
    renderWithStore({
      userState: { selectedUser: { ...targetUser, image: "https://cdn.example.com/avatar.png" } },
    });

    expect(screen.getByAltText("gamerpro")).toHaveAttribute(
      "src",
      "https://cdn.example.com/avatar.png"
    );
  });

  it("shows favorites loading skeletons before the fetch resolves", async () => {
    let resolveFetch;
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const { container } = renderWithStore();

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

    resolveFetch({ ok: true, json: async () => [] });
    await waitFor(() => {
      expect(screen.getByText("No saved games public yet")).toBeInTheDocument();
    });
  });

  it("renders the vault count and favorite game cards once favorites load", async () => {
    renderWithStore();

    expect(await screen.findByText("Space Raiders")).toBeInTheDocument();
    expect(screen.getByText("Puzzle Quest")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("★ 8.5")).toBeInTheDocument();
    expect(screen.getByText("PS5")).toBeInTheDocument();

    const images = screen.getAllByRole("img");
    const spaceImg = images.find((img) => img.getAttribute("alt") === "Space Raiders");
    const puzzleImg = images.find((img) => img.getAttribute("alt") === "Puzzle Quest");
    expect(spaceImg).toHaveAttribute("src", "https://cdn.example.com/space.png");
    expect(puzzleImg).toHaveAttribute("src", "https://www.vgchartz.com/images/puzzle.png");

    expect(
      screen.getAllByRole("link", { name: /view game details/i })[0]
    ).toHaveAttribute("href", "/games/10");
  });

  it("shows an empty vault state when the user has no public favorites", async () => {
    mockFetch([]);
    renderWithStore();

    expect(await screen.findByText("No saved games public yet")).toBeInTheDocument();
  });

  it("shows an empty vault state when the favorites request fails", async () => {
    mockFetch([], false);
    renderWithStore();

    expect(await screen.findByText("No saved games public yet")).toBeInTheDocument();
  });

  describe("FriendActionButton", () => {
    it("does not render when viewing your own profile", () => {
      renderWithStore({ currentUser: { id: "target-1", username: "gamerpro" } });

      expect(screen.queryByRole("button", { name: /add friend/i })).not.toBeInTheDocument();
    });

    it("does not render when there is no logged-in user", () => {
      renderWithStore({ currentUser: null });

      expect(screen.queryByRole("button", { name: /add friend/i })).not.toBeInTheDocument();
    });

    it("shows 'Add Friend' with no existing relationship and sends a request on click", async () => {
      renderWithStore();

      const addBtn = screen.getByRole("button", { name: /add friend/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(sendFriendRequest).toHaveBeenCalledWith("target-1");
      });
      await waitFor(() => {
        // Called once on mount and once again after the request completes
        expect(fetchOutgoingRequests).toHaveBeenCalledTimes(2);
      });
    });

    it("shows Accept/Decline for an incoming request and responds on click", async () => {
      renderWithStore({
        friendsState: {
          incomingRequests: [{ _id: "req1", requester: "target-1" }],
        },
      });

      fireEvent.click(screen.getByRole("button", { name: /accept request/i }));

      await waitFor(() => {
        expect(respondToFriendRequest).toHaveBeenCalledWith({
          friendshipId: "req1",
          action: "accept",
        });
      });
      await waitFor(() => {
        // Called once on mount and once again after the response completes
        expect(fetchFriends).toHaveBeenCalledTimes(2);
        expect(fetchIncomingRequests).toHaveBeenCalledTimes(2);
      });
    });

    it("shows 'Request Sent (Cancel)' for an outgoing request and cancels it on click", async () => {
      renderWithStore({
        friendsState: {
          outgoingRequests: [{ _id: "out1", recipient: "target-1" }],
        },
      });

      fireEvent.click(screen.getByRole("button", { name: /request sent/i }));

      await waitFor(() => {
        expect(deleteFriendship).toHaveBeenCalledWith("out1");
      });
    });

    it("shows a confirm step before unfriending an existing friend", async () => {
      renderWithStore({
        friendsState: {
          friends: [{ friendshipId: "fr1", friend: "target-1" }],
        },
      });

      fireEvent.click(screen.getByRole("button", { name: "Friends" }));
      expect(screen.getByRole("button", { name: /confirm unfriend/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /confirm unfriend/i }));

      await waitFor(() => {
        expect(deleteFriendship).toHaveBeenCalledWith("fr1");
      });
    });

    it("cancels the unfriend confirmation without dispatching", () => {
      renderWithStore({
        friendsState: {
          friends: [{ friendshipId: "fr1", friend: "target-1" }],
        },
      });

      fireEvent.click(screen.getByRole("button", { name: "Friends" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Friends" })).toBeInTheDocument();
      expect(deleteFriendship).not.toHaveBeenCalled();
    });
  });
});
