// src/__tests__/Messages.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import MessagesPage from "../app/messages/page";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  setActiveConversation,
} from "../features/conversations/conversationSlice";

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

// The page dynamically imports MDEditor, then MDEditor.Markdown, then EmojiPicker
// (in that order) — stub each call based on its position to keep the mock simple.
vi.mock("next/dynamic", () => {
  let callCount = 0;
  return {
    default: () => {
      callCount += 1;
      if (callCount === 1) {
        return ({ value, onChange, textareaProps }) => (
          <textarea
            data-testid="md-editor"
            value={value}
            placeholder={textareaProps?.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      }
      if (callCount === 2) {
        return ({ source }) => <div data-testid="markdown-viewer">{source}</div>;
      }
      return ({ onEmojiClick }) => (
        <button type="button" onClick={() => onEmojiClick({ emoji: "😀" })}>
          Mock Emoji
        </button>
      );
    },
  };
});

vi.mock("../features/conversations/conversationSlice", () => ({
  fetchConversations: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  setActiveConversation: vi.fn(),
}));

const conversations = [
  {
    _id: "c1",
    participant: { _id: "f1", username: "alice", image: "https://cdn.example.com/alice.png" },
    unreadCount: 2,
    lastMessage: { content: "**hey** there" },
  },
  {
    _id: "c2",
    participant: { _id: "f2", username: "bob" },
    unreadCount: 0,
    lastMessage: null,
  },
];

const messages = [
  { _id: "m1", sender: "u1", content: "Hi Bob", createdAt: "2024-01-01T10:00:00Z" },
  { _id: "m2", sender: "f2", content: "Hi there", createdAt: "2024-01-01T10:01:00Z" },
];

function renderWithStore({ user = { id: "u1" }, convState = {} } = {}) {
  const conversationState = {
    conversations,
    activeConversation: null,
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSendingMessage: false,
    ...convState,
  };

  const store = configureStore({
    reducer: {
      auth: (state = { user }, action) => state,
      conversations: (state = conversationState, action) => state,
    },
    preloadedState: {
      auth: { user },
      conversations: conversationState,
    },
  });

  return render(
    <Provider store={store}>
      <MessagesPage />
    </Provider>
  );
}

describe("MessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Element.prototype.scrollIntoView = vi.fn();
    fetchConversations.mockReturnValue({ type: "conversations/fetchAll" });
    fetchMessages.mockReturnValue({ type: "conversations/fetchMessages" });
    sendMessage.mockReturnValue({ type: "conversations/sendMessage" });
    setActiveConversation.mockReturnValue({ type: "conversations/setActive" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders Header, Footer, and the inbox heading", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /direct messages/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /find friends/i })).toHaveAttribute(
      "href",
      "/friends"
    );
  });

  it("fetches conversations on mount when logged in", () => {
    renderWithStore();

    expect(fetchConversations).toHaveBeenCalledTimes(1);
  });

  it("does not fetch conversations when logged out", () => {
    renderWithStore({ user: null });

    expect(fetchConversations).not.toHaveBeenCalled();
  });

  it("shows loading skeletons for the conversation list", () => {
    const { container } = renderWithStore({ convState: { isLoadingConversations: true } });

    expect(container.querySelectorAll(".animate-pulse").length).toBe(4);
  });

  it("renders conversations with avatar, unread badge, and stripped markdown preview", () => {
    renderWithStore();

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("hey there")).toBeInTheDocument();
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    expect(screen.getByAltText("alice")).toHaveAttribute(
      "src",
      "https://cdn.example.com/alice.png"
    );
  });

  it("filters conversations by participant username", () => {
    renderWithStore();

    fireEvent.change(screen.getByPlaceholderText(/filter chats/i), {
      target: { value: "bob" },
    });

    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
  });

  it("shows a no-match message when the search filter has no results", () => {
    renderWithStore();

    fireEvent.change(screen.getByPlaceholderText(/filter chats/i), {
      target: { value: "zzz" },
    });

    expect(screen.getByText("No chats match your search.")).toBeInTheDocument();
  });

  it("shows the empty inbox message when there are no conversations", () => {
    renderWithStore({ convState: { conversations: [] } });

    expect(screen.getByText("No active conversations yet.")).toBeInTheDocument();
  });

  it("shows the placeholder panel when no conversation is selected", () => {
    renderWithStore();

    expect(screen.getByText("Your Messages")).toBeInTheDocument();
  });

  it("selects a conversation and dispatches setActiveConversation", () => {
    renderWithStore();

    fireEvent.click(screen.getByText("@alice"));

    expect(setActiveConversation).toHaveBeenCalledWith(conversations[0]);
  });

  it("fetches messages on mount and polls every 4 seconds while a conversation is active", () => {
    renderWithStore({ convState: { activeConversation: conversations[0] } });

    expect(fetchMessages).toHaveBeenCalledWith("c1");

    fetchMessages.mockClear();
    vi.advanceTimersByTime(4000);
    expect(fetchMessages).toHaveBeenCalledWith("c1");

    fetchMessages.mockClear();
    vi.advanceTimersByTime(4000);
    expect(fetchMessages).toHaveBeenCalledWith("c1");
  });

  it("renders the chat header, empty message state, and view profile link for the active conversation", () => {
    renderWithStore({ convState: { activeConversation: conversations[0] } });

    expect(screen.getByRole("heading", { name: "@alice" })).toBeInTheDocument();
    expect(screen.getByText("No messages exchanged yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view profile/i })).toHaveAttribute(
      "href",
      "/users/f1"
    );
  });

  it("renders messages aligned by sender", () => {
    renderWithStore({
      convState: { activeConversation: conversations[0], messages },
    });

    const viewers = screen.getAllByTestId("markdown-viewer");
    expect(viewers[0]).toHaveTextContent("Hi Bob");
    expect(viewers[1]).toHaveTextContent("Hi there");
  });

  it("disables the send button until content is entered, then sends and clears the editor", async () => {
    renderWithStore({ convState: { activeConversation: conversations[0] } });

    const editor = screen.getByTestId("md-editor");
    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    expect(sendBtn).toBeDisabled();

    fireEvent.change(editor, { target: { value: "Hello there" } });
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    expect(sendMessage).toHaveBeenCalledWith({
      conversationId: "c1",
      content: "Hello there",
    });
    await waitFor(() => {
      expect(editor).toHaveValue("");
    });
  });

  it("shows a sending indicator and disables the send button while a message is in flight", () => {
    renderWithStore({
      convState: { activeConversation: conversations[0], isSendingMessage: true },
    });

    fireEvent.change(screen.getByTestId("md-editor"), { target: { value: "Hi" } });

    expect(screen.getByText("Sending...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });

  it("switches between Write and Preview editor tabs", () => {
    renderWithStore({ convState: { activeConversation: conversations[0] } });

    const writeTab = screen.getByRole("button", { name: "Write" });
    const previewTab = screen.getByRole("button", { name: "Preview" });

    expect(writeTab).toHaveClass("bg-brown/40");
    fireEvent.click(previewTab);
    expect(previewTab).toHaveClass("bg-brown/40");
  });

  it("toggles the emoji picker and inserts an emoji into the message content", () => {
    renderWithStore({ convState: { activeConversation: conversations[0] } });

    fireEvent.click(screen.getByTitle("Insert Emoji"));
    expect(screen.getByText("Mock Emoji")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Mock Emoji"));

    expect(screen.getByTestId("md-editor")).toHaveValue("😀");
    expect(screen.queryByText("Mock Emoji")).not.toBeInTheDocument();
  });

  it("sends a message using the Cmd/Ctrl+Enter keyboard shortcut", () => {
    renderWithStore({ convState: { activeConversation: conversations[0] } });

    fireEvent.change(screen.getByTestId("md-editor"), { target: { value: "Quick note" } });
    fireEvent.keyDown(screen.getByTestId("md-editor"), { key: "Enter", ctrlKey: true });

    expect(sendMessage).toHaveBeenCalledWith({
      conversationId: "c1",
      content: "Quick note",
    });
  });
});
