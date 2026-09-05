"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { fetchThreadById } from "../../../features/threads/threadSlice";
import {
  fetchPostsByThread,
  createPost,
  setActiveQuote,
  clearActiveQuote,
  setReplyToParentId,
  clearReplyToParentId,
} from "../../../features/posts/postSlice";

const EMPTY_ARRAY = [];

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const threadId = params?.threadId;

  const user = useSelector((state) => state.auth?.user);
  const currentThread = useSelector((state) => state.threads?.currentThread);
  const isThreadLoading = useSelector(
    (state) => state.threads?.isThreadDetailLoading ?? false
  );

  const posts = useSelector((state) => state.posts?.posts ?? EMPTY_ARRAY);
  const isPostsLoading = useSelector((state) => state.posts?.isLoading ?? false);
  const isSubmitLoading = useSelector(
    (state) => state.posts?.isSubmitLoading ?? false
  );
  const activeQuote = useSelector((state) => state.posts?.activeQuote);
  const replyToParentId = useSelector((state) => state.posts?.replyToParentId);

  // Form State
  const [replyContent, setReplyContent] = useState("");

  // Floating Quote Popover Coordinates
  const [quoteSelectionState, setQuoteSelectionState] = useState(null);
  const replyEditorRef = useRef(null);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId));
      dispatch(fetchPostsByThread({ threadId, mode: "tree" }));
    }
  }, [dispatch, threadId]);

  // Separate opening post from discussion replies
  const [openingPost, replies] = useMemo(() => {
    if (!posts.length) return [null, []];
    const rootPosts = posts.filter((p) => !p.parentId);
    const opening = rootPosts[0] || posts[0];
    const restReplies = posts.filter((p) => p._id !== opening._id);
    return [opening, restReplies];
  }, [posts]);

  // Handle native text selection on mouse up
  const handleMouseUpCapture = (e, post) => {
    const selection = window.getSelection();
    const text = selection?.toString()?.trim();

    if (text && text.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setQuoteSelectionState({
        text,
        originalPostId: post._id,
        authorName: post.author?.username || "Member",
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10,
      });
    } else {
      setQuoteSelectionState(null);
    }
  };

  const applySelectedQuote = () => {
    if (!quoteSelectionState) return;

    dispatch(
      setActiveQuote({
        originalPostId: quoteSelectionState.originalPostId,
        authorName: quoteSelectionState.authorName,
        selectedText: quoteSelectionState.text,
      })
    );
    dispatch(setReplyToParentId(quoteSelectionState.originalPostId));
    setQuoteSelectionState(null);

    // Scroll to reply editor smoothly
    replyEditorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenReplyTo = (post) => {
    dispatch(setReplyToParentId(post._id));
    replyEditorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    const payload = {
      threadId,
      content: replyContent,
      parentId: replyToParentId,
      quote: activeQuote || undefined,
    };

    const result = await dispatch(createPost(payload));
    if (!result.error) {
      setReplyContent("");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLoading = isThreadLoading || isPostsLoading;

  return (
    <div
      className="flex min-h-screen flex-col bg-carafe text-sand"
      onClick={() => setQuoteSelectionState(null)}
    >
      <Header />

      {/* Floating Selection Tooltip for Quoting */}
      {quoteSelectionState && (
        <div
          style={{
            position: "absolute",
            left: `${quoteSelectionState.x}px`,
            top: `${quoteSelectionState.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          className="z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={applySelectedQuote}
            className="flex items-center gap-1.5 rounded-lg border border-tan/40 bg-carafe px-3 py-1.5 text-xs font-bold text-tan shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:bg-tan hover:text-carafe"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            <span>Quote Selection</span>
          </button>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-xs text-tan">
          <Link href="/forums" className="transition-colors hover:text-white">
            Forums
          </Link>
          <span>/</span>
          {currentThread?.categoryId && (
            <>
              <Link
                href={`/forums/category/${currentThread.categoryId._id || currentThread.categoryId}`}
                className="transition-colors hover:text-white"
              >
                {currentThread.categoryId.title || "Category"}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="max-w-md truncate font-semibold text-white">
            {currentThread?.title || "Thread"}
          </span>
        </div>

        {/* Thread Header with Hero Banner */}
        {currentThread && (
          <div className="overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 backdrop-blur-sm">
            {/* Hero Image Banner */}
            {currentThread.media?.url && (
              <div className="relative h-60 w-full overflow-hidden border-b border-brown/30 bg-carafe sm:h-80 lg:h-96">
                <Image
                  src={currentThread.media.url}
                  alt={currentThread.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carafe via-carafe/30 to-transparent" />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentThread.isPinned && (
                      <span className="rounded border border-tan/40 bg-tan/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tan">
                        Pinned
                      </span>
                    )}
                    {currentThread.isLocked && (
                      <span className="rounded border border-danger/40 bg-danger/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                        Locked
                      </span>
                    )}
                    <span className="rounded-md border border-brown/40 bg-brown/20 px-2 py-0.5 text-[11px] font-semibold text-tan">
                      {currentThread.categoryId?.title || "Discussion"}
                    </span>
                  </div>

                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {currentThread.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-tan">
                    <span>
                      Started by{" "}
                      <span className="font-bold text-white">
                        {currentThread.creator?.username || "Anonymous"}
                      </span>
                    </span>
                    <span>•</span>
                    <span>{formatDate(currentThread.createdAt)}</span>
                    <span>•</span>
                    <span>{currentThread.viewsCount ?? 0} Views</span>
                    <span>•</span>
                    <span>{currentThread.replyCount ?? 0} Replies</span>
                  </div>
                </div>

                {!currentThread.isLocked && (
                  <button
                    type="button"
                    onClick={() =>
                      replyEditorRef.current?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-tan px-4 py-2.5 text-xs font-bold text-carafe shadow-sm transition-all hover:bg-white sm:self-start"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <span>Post Reply</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Posts Timeline / Tree */}
        {isLoading ? (
          <div className="mt-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-brown/20 bg-brown/10 p-6"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Opening Post (Hero Post) */}
            {openingPost && (
              <article
                onMouseUp={(e) => handleMouseUpCapture(e, openingPost)}
                className="overflow-hidden rounded-2xl border border-brown/40 bg-brown/15 shadow-lg backdrop-blur-sm"
              >
                {/* Author Bar */}
                <div className="flex items-center justify-between border-b border-brown/30 bg-brown/25 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-tan/30 bg-carafe font-bold text-tan">
                      {openingPost.author?.username?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {openingPost.author?.username || "Anonymous"}
                        </span>
                        <span className="rounded bg-tan/15 px-1.5 py-0.5 text-[10px] font-bold text-tan">
                          Original Poster
                        </span>
                      </div>
                      <span className="text-[11px] text-tan/70">
                        {formatDate(openingPost.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-tan/60">#1</span>
                </div>

                {/* Content */}
                <div className="space-y-4 p-6">
                  <div className="whitespace-pre-line text-sm leading-relaxed text-sand selection:bg-tan selection:text-carafe">
                    {openingPost.content}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-brown/20 bg-carafe/40 px-6 py-2.5">
                  <span className="text-[11px] italic text-tan/50">
                    Tip: Highlight text to quote directly in your reply.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenReplyTo(openingPost)}
                    className="flex items-center gap-1 text-xs font-semibold text-tan transition-colors hover:text-white"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 016 6v3"
                      />
                    </svg>
                    <span>Reply</span>
                  </button>
                </div>
              </article>
            )}

            {/* Replies Stream */}
            {replies.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-tan">
                  Responses ({replies.length})
                </h3>

                {replies.map((post, index) => {
                  const depth = Math.min(post.depth || 0, 4);

                  return (
                    <div
                      key={post._id}
                      style={{
                        marginLeft: depth > 0 ? `${depth * 1.5}rem` : "0rem",
                      }}
                      className="relative transition-all"
                    >
                      {depth > 0 && (
                        <div className="absolute -left-3 top-6 h-full w-px bg-brown/40" />
                      )}

                      <article
                        onMouseUp={(e) => handleMouseUpCapture(e, post)}
                        className={`overflow-hidden rounded-xl border border-brown/30 bg-carafe/80 backdrop-blur-sm transition-all hover:border-brown/60 ${
                          replyToParentId === post._id
                            ? "ring-1 ring-tan"
                            : ""
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-brown/20 bg-brown/10 px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-tan/20 bg-brown/40 text-xs font-bold text-tan">
                              {post.author?.username?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <span className="text-xs font-bold text-white">
                              {post.author?.username || "Anonymous"}
                            </span>
                            <span className="text-[10px] text-tan/60">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>

                          <span className="text-[11px] text-tan/40">
                            #{index + 2}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="space-y-3 p-5">
                          {/* Quote Callout Box */}
                          {post.quote?.selectedText && (
                            <div className="rounded-lg border-l-2 border-tan bg-brown/15 p-3 font-serif text-xs italic text-tan/90">
                              <span className="mb-1 block font-sans text-[10px] font-bold uppercase not-italic text-tan">
                                {post.quote.authorName} wrote:
                              </span>
                              &ldquo;{post.quote.selectedText}&rdquo;
                            </div>
                          )}

                          <div className="whitespace-pre-line text-xs leading-relaxed text-sand selection:bg-tan selection:text-carafe">
                            {post.content}
                          </div>
                        </div>

                        {/* Reply Action */}
                        <div className="flex items-center justify-end border-t border-brown/20 bg-brown/5 px-5 py-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReplyTo(post)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-tan hover:text-white"
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 016 6v3"
                              />
                            </svg>
                            <span>Reply</span>
                          </button>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reply Editor */}
        <div ref={replyEditorRef} className="mt-10">
          {!user ? (
            <div className="rounded-2xl border border-brown/30 bg-brown/10 p-8 text-center backdrop-blur-sm">
              <h3 className="text-base font-bold text-white">
                Join the Discussion
              </h3>
              <p className="mt-1 text-xs text-tan">
                You must be logged in to participate in this thread and quote members.
              </p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-4 rounded-lg bg-tan px-5 py-2 text-xs font-bold text-carafe transition-all hover:bg-white"
              >
                Sign In to Reply
              </button>
            </div>
          ) : currentThread?.isLocked ? (
            <div className="rounded-xl border border-brown/30 bg-brown/10 p-4 text-center text-xs text-tan">
              This discussion has been locked by moderators. New replies cannot be posted.
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReply}
              className="overflow-hidden rounded-2xl border border-brown/40 bg-brown/10 p-6 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center justify-between border-b border-brown/20 pb-3">
                <h3 className="text-sm font-bold text-white">
                  {replyToParentId ? "Replying to Comment" : "Write a Response"}
                </h3>
                {replyToParentId && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearReplyToParentId());
                      dispatch(clearActiveQuote());
                    }}
                    className="text-xs text-tan underline-offset-4 hover:text-white hover:underline"
                  >
                    Cancel direct reply
                  </button>
                )}
              </div>

              {/* Active Quote Preview in Editor */}
              {activeQuote && (
                <div className="relative mt-3 rounded-lg border-l-2 border-tan bg-brown/20 p-3 text-xs italic text-tan">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase not-italic text-tan">
                      Quoting {activeQuote.authorName}
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch(clearActiveQuote())}
                      className="font-sans text-xs text-tan hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  &ldquo;{activeQuote.selectedText}&rdquo;
                </div>
              )}

              {/* Textarea */}
              <div className="mt-4">
                <textarea
                  rows={4}
                  required
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts, advice, or rebuttal..."
                  className="w-full rounded-xl border border-brown/40 bg-carafe/90 p-4 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>

              {/* Submit Controls */}
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmitLoading || !replyContent.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-tan px-6 py-2.5 text-xs font-bold text-carafe shadow-md transition-all hover:bg-white disabled:opacity-50"
                >
                  {isSubmitLoading ? "Submitting..." : "Submit Reply"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}