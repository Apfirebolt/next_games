"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  setActiveConversation,
} from "../../features/conversations/conversationSlice";

// Required stylesheets for UIW Markdown Editor & Previewer
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamically import MDEditor components with SSR disabled
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MarkdownViewer = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false }
);

// Dynamically import EmojiPicker to avoid SSR window errors
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function MessagesPage() {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const {
    conversations = [],
    activeConversation = null,
    messages = [],
    isLoadingConversations = false,
    isLoadingMessages = false,
    isSendingMessage = false,
  } = useSelector(
    (state) =>
      state.conversations || {
        conversations: [],
        activeConversation: null,
        messages: [],
        isLoadingConversations: false,
        isLoadingMessages: false,
        isSendingMessage: false,
      }
  );

  const [inboxSearch, setInboxSearch] = useState("");
  const [content, setContent] = useState("");
  const [editorTab, setEditorTab] = useState("edit"); // 'edit' | 'preview'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 1. Initial fetch of conversations on mount
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchConversations());
    }
  }, [dispatch, currentUserId]);

  // 2. Poll active conversation every 4s for live message updates
  useEffect(() => {
    if (!activeConversation?._id) return;

    dispatch(fetchMessages(activeConversation._id));

    const pollInterval = setInterval(() => {
      dispatch(fetchMessages(activeConversation._id));
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [activeConversation?._id, dispatch]);

  // 3. Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Click-outside and ESC key dismiss for emoji popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEmojiPicker]);

  // Filter conversations by friend username or name
  const filteredConversations = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    if (!inboxSearch.trim()) return list;

    const query = inboxSearch.toLowerCase().trim();
    return list.filter((conv) => {
      const p = conv.participant;
      if (!p) return false;
      const username = p.username?.toLowerCase() || "";
      const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      return username.includes(query) || name.includes(query);
    });
  }, [conversations, inboxSearch]);

  const handleSelectConversation = (conv) => {
    dispatch(setActiveConversation(conv));
    setContent("");
    setEditorTab("edit");
    setShowEmojiPicker(false);
  };

  // Insert emoji at cursor position or append to text
  const handleEmojiClick = (emojiData) => {
    const textarea = document.querySelector(".w-md-editor-text-input");
    const emoji = emojiData.emoji;

    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const updated = content.substring(0, start) + emoji + content.substring(end);
      setContent(updated);

      // Restore cursor position directly after the inserted emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
    }

    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if (!content.trim() || !activeConversation?._id || isSendingMessage) return;

    const payload = {
      conversationId: activeConversation._id,
      content: content.trim(),
    };

    setContent("");
    setShowEmojiPicker(false);
    await dispatch(sendMessage(payload));
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to send
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeFriend = activeConversation?.participant;
  const activeFriendId = activeFriend?._id || activeFriend?.id;

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex h-[calc(100vh-12rem)] min-h-[580px] overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 backdrop-blur-sm">
          
          {/* LEFT COLUMN: CONVERSATION ROSTER */}
          <aside className="flex w-full flex-col border-r border-brown/30 bg-carafe/50 sm:w-80 md:w-96">
            {/* Inbox Header & Search */}
            <div className="border-b border-brown/30 p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-white">Direct Messages</h1>
                <Link
                  href="/friends"
                  className="rounded-lg bg-brown/30 px-2.5 py-1 text-xs font-semibold text-tan transition hover:bg-brown hover:text-white"
                >
                  Find Friends
                </Link>
              </div>

              <div className="relative mt-3">
                <input
                  type="text"
                  placeholder="Filter chats..."
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                  className="w-full rounded-lg border border-brown/40 bg-carafe/80 py-1.5 pl-8 pr-3 text-xs text-sand placeholder-tan/40 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />
                <svg
                  className="absolute left-2.5 top-2 h-3.5 w-3.5 text-tan/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations ? (
                <div className="space-y-3 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-brown/20" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-tan/70">
                  {inboxSearch
                    ? "No chats match your search."
                    : "No active conversations yet."}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const participant = conv.participant;
                  const isSelected = activeConversation?._id === conv._id;

                  return (
                    <button
                      key={conv._id}
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      className={`flex w-full items-center gap-3 border-b border-brown/20 p-3.5 text-left transition-colors ${
                        isSelected
                          ? "border-l-4 border-l-tan bg-brown/30"
                          : "hover:bg-brown/15"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-tan/30 bg-carafe font-bold uppercase text-tan">
                        {participant?.image ? (
                          <Image
                            src={participant.image}
                            alt={participant.username || "Friend"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          participant?.username?.charAt(0) || "P"
                        )}
                      </div>

                      {/* Snippet */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-bold text-white">
                            @{participant?.username || "Unknown"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-extrabold text-carafe">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-tan/70">
                          {conv.lastMessage?.content
                            ? conv.lastMessage.content.replace(/[#*`_~]/g, "")
                            : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: ACTIVE CHAT VIEW */}
          <section className="flex flex-1 flex-col bg-carafe/30">
            {activeConversation ? (
              <>
                {/* Chat Top Banner */}
                <div className="flex items-center justify-between border-b border-brown/30 bg-carafe/70 px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-tan/30 bg-carafe text-xs font-bold uppercase text-tan">
                      {activeFriend?.image ? (
                        <Image
                          src={activeFriend.image}
                          alt={activeFriend.username || "User"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        activeFriend?.username?.charAt(0) || "P"
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        @{activeFriend?.username}
                      </h2>
                      <p className="text-[10px] text-tan/70">
                        {`${activeFriend?.firstName || ""} ${activeFriend?.lastName || ""}`.trim() ||
                          "Friend"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/users/${activeFriendId}`}
                    className="text-xs font-semibold text-tan hover:text-white transition"
                  >
                    View Profile &rarr;
                  </Link>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-tan/60">
                      Loading chat history...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-xs text-tan/60">
                      <p className="font-semibold text-sand">No messages exchanged yet.</p>
                      <p className="mt-1">Write your first Markdown note below!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
                      const isMe = senderId?.toString() === currentUserId?.toString();

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            data-color-mode="dark"
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-md sm:max-w-[70%] ${
                              isMe
                                ? "rounded-tr-none bg-brown/80 text-sand border border-brown"
                                : "rounded-tl-none bg-carafe border border-brown/40 text-sand"
                            }`}
                          >
                            <MarkdownViewer
                              source={msg.content}
                              className="!bg-transparent !text-xs !text-sand"
                            />
                          </div>
                          <span className="mt-1 px-1 font-mono text-[9px] text-tan/60">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Markdown Input Composer */}
                <div className="relative border-t border-brown/30 bg-carafe/80 p-4">
                  
                  {/* Floating Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-24 right-6 z-50 rounded-2xl border border-brown/40 bg-carafe shadow-2xl overflow-hidden"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme="dark"
                        lazyLoadEmojis={true}
                        searchPlaceHolder="Search emojis..."
                        previewConfig={{ showPreview: false }}
                        width={320}
                        height={380}
                      />
                    </div>
                  )}

                  <div
                    className="relative rounded-xl border border-brown/40 bg-carafe focus-within:border-tan overflow-hidden"
                    data-color-mode="dark"
                    onKeyDown={handleKeyDown}
                  >
                    <MDEditor
                      value={content}
                      onChange={(val) => setContent(val || "")}
                      height={130}
                      preview={editorTab}
                      hideToolbar={true}
                      visibleDragbar={false}
                      textareaProps={{
                        placeholder: "Write a message... (Markdown supported)",
                        className: "!text-sand !bg-transparent placeholder:text-tan/40 !p-3 !text-xs",
                      }}
                      className="!border-none !bg-transparent text-xs"
                    />

                    {/* Editor Control Toolbar */}
                    <div className="flex items-center justify-between border-t border-brown/20 bg-brown/10 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditorTab("edit")}
                          className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                            editorTab === "edit"
                              ? "bg-brown/40 text-white"
                              : "text-tan/70 hover:text-white"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorTab("preview")}
                          className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                            editorTab === "preview"
                              ? "bg-brown/40 text-white"
                              : "text-tan/70 hover:text-white"
                          }`}
                        >
                          Preview
                        </button>

                        {/* Emoji Picker Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker((prev) => !prev)}
                          title="Insert Emoji"
                          className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                            showEmojiPicker
                              ? "bg-brown/50 text-white"
                              : "text-tan/70 hover:bg-brown/30 hover:text-white"
                          }`}
                        >
                          <span>😊</span>
                        </button>

                        <span className="hidden text-[10px] text-tan/50 md:inline ml-2">
                          Tip: <kbd className="rounded bg-brown/30 px-1 font-mono">Cmd/Ctrl + Enter</kbd> to send
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || !content.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-tan px-3.5 py-1.5 text-xs font-bold text-carafe shadow transition hover:bg-white disabled:opacity-50"
                      >
                        {isSendingMessage ? (
                          <>
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            <span>Send</span>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-bold text-white">Your Messages</h3>
                <p className="mt-1 text-xs text-tan">
                  Select a chat thread from the left or connect with friends to begin messaging.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}