"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  fetchCategories,
  createCategory,
  resetCategoryStatus,
} from "../../features/categories/categorySlice";
import {
  fetchThreads,
  setViewMode,
} from "../../features/threads/threadSlice";

const EMPTY_ARRAY = [];

export default function ForumsPage() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.user);
  const categories = useSelector(
    (state) => state.categories?.categories ?? EMPTY_ARRAY
  );
  const isCategoriesLoading = useSelector(
    (state) => state.categories?.isLoading ?? false
  );
  const isCreateLoading = useSelector(
    (state) => state.categories?.isCreateLoading ?? false
  );

  const threads = useSelector((state) => state.threads?.threads ?? EMPTY_ARRAY);
  const isThreadsLoading = useSelector(
    (state) => state.threads?.isLoading ?? false
  );
  const viewMode = useSelector((state) => state.threads?.viewMode ?? "table");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("ALL");
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);

  // New Category Form State
  const [newCategoryData, setNewCategoryData] = useState({
    title: "",
    description: "",
    order: 0,
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchThreads({ limit: 100 }));
  }, [dispatch]);

  // Group threads by their categoryId
  const threadsByCategory = useMemo(() => {
    const map = {};
    for (const thread of threads) {
      const catId =
        typeof thread.categoryId === "object"
          ? thread.categoryId?._id
          : thread.categoryId;
      if (!catId) continue;
      if (!map[catId]) map[catId] = [];
      map[catId].push(thread);
    }
    return map;
  }, [threads]);

  // Filter categories based on search input and selected category pill
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesTab =
        selectedCategoryTab === "ALL" ||
        category._id === selectedCategoryTab ||
        category.slug === selectedCategoryTab;

      const categoryMatchesSearch =
        category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description &&
          category.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const categoryThreads = threadsByCategory[category._id] || [];
      const hasMatchingThread = categoryThreads.some((thread) =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return matchesTab && (categoryMatchesSearch || hasMatchingThread);
    });
  }, [categories, selectedCategoryTab, searchQuery, threadsByCategory]);

  const handleOpenCategoryModal = () => {
    setNewCategoryData({ title: "", description: "", order: categories.length });
    setIsNewCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsNewCategoryModalOpen(false);
    dispatch(resetCategoryStatus());
  };

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryData.title.trim()) return;

    const result = await dispatch(createCategory(newCategoryData));
    if (!result.error) {
      handleCloseCategoryModal();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No activity";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isLoading = isCategoriesLoading || isThreadsLoading;

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tan">
                <svg
                  className="h-3.5 w-3.5 fill-tan text-tan"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
                Community Hub
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Discussion <span className="text-tan">Forums</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                {categories.length} {categories.length === 1 ? "category" : "categories"} with{" "}
                {threads.length} active {threads.length === 1 ? "thread" : "threads"}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:self-start">
              {/* Add Category Button */}
              {user && (
                <button
                  type="button"
                  onClick={handleOpenCategoryModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-tan px-4 py-2.5 text-xs font-bold text-carafe shadow-sm transition-all hover:bg-white sm:self-start"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>New Category</span>
                </button>
              )}

              <Link
                href="/forums/new-thread"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brown px-4 py-2.5 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white"
              >
                <span>Start a Thread</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="mt-6 flex flex-col gap-3 border-t border-brown/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search topics or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-brown/40 bg-carafe/80 py-2 pl-9 pr-3 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
              />
              <svg
                className="absolute left-3 top-2.5 h-3.5 w-3.5 text-tan/60"
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

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills */}
              {categories.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryTab("ALL")}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      selectedCategoryTab === "ALL"
                        ? "bg-tan font-bold text-carafe shadow-sm"
                        : "border border-brown/40 bg-brown/15 text-tan hover:border-tan/50 hover:text-white"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setSelectedCategoryTab(cat._id)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        selectedCategoryTab === cat._id
                          ? "bg-tan font-bold text-carafe shadow-sm"
                          : "border border-brown/40 bg-brown/15 text-tan hover:border-tan/50 hover:text-white"
                      }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
              )}

              {/* View Switcher: Table vs List/Cards */}
              <div className="flex items-center rounded-lg border border-brown/40 bg-carafe/90 p-0.5">
                <button
                  type="button"
                  onClick={() => dispatch(setViewMode("table"))}
                  title="Table View"
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-tan text-carafe shadow"
                      : "text-tan hover:text-white"
                  }`}
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
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setViewMode("card"))}
                  title="Card View"
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                    viewMode === "card"
                      ? "bg-tan text-carafe shadow"
                      : "text-tan hover:text-white"
                  }`}
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
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="mt-8 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-brown/20 bg-brown/10 p-6"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          /* Empty Categories State */
          <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brown/40 bg-brown/20 text-tan">
              <svg
                className="h-7 w-7 fill-none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">No Categories Available</h2>
            <p className="mt-1 max-w-sm text-xs text-tan">
              The community has not established any topic groups yet. Create the initial category to get conversations moving.
            </p>
            {user ? (
              <button
                type="button"
                onClick={handleOpenCategoryModal}
                className="mt-6 rounded-lg bg-tan px-5 py-2.5 text-xs font-bold text-carafe transition-all hover:bg-white"
              >
                Create First Category
              </button>
            ) : (
              <Link
                href="/login"
                className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-semibold text-sand hover:text-white"
              >
                Sign In to Contribute
              </Link>
            )}
          </div>
        ) : filteredCategories.length === 0 ? (
          /* Search Empty State */
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-sand">
              No categories or threads match &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryTab("ALL");
              }}
              className="mt-3 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/80"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Category Groups */
          <div className="mt-8 space-y-8">
            {filteredCategories.map((category) => {
              const categoryThreads = (threadsByCategory[category._id] || []).filter(
                (thread) =>
                  !searchQuery ||
                  thread.title.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <section
                  key={category._id}
                  className="overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 backdrop-blur-sm"
                >
                  {/* Category Section Header */}
                  <div className="flex flex-col gap-3 border-b border-brown/30 bg-brown/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-tan" />
                        <h2 className="text-lg font-bold text-white">
                          {category.title}
                        </h2>
                      </div>
                      {category.description && (
                        <p className="mt-0.5 text-xs text-tan/80">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-tan">
                      <span className="font-semibold">
                        {categoryThreads.length}{" "}
                        {categoryThreads.length === 1 ? "thread" : "threads"}
                      </span>
                      <span className="text-brown/60">•</span>
                      <span>
                        {category.postCount ?? categoryThreads.length}{" "}
                        {(category.postCount ?? categoryThreads.length) === 1
                          ? "post"
                          : "posts"}
                      </span>
                    </div>
                  </div>

                  {/* Empty Threads in Category */}
                  {categoryThreads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <p className="text-xs text-tan">
                        No threads have been started in {category.title} yet.
                      </p>
                      <Link
                        href={`/forums/new-thread?categoryId=${category._id}`}
                        className="mt-2 text-xs font-semibold text-tan underline-offset-4 hover:underline"
                      >
                        Start the first conversation →
                      </Link>
                    </div>
                  ) : viewMode === "table" ? (
                    /* Table View */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-brown/20 bg-carafe/40 font-semibold uppercase tracking-wider text-tan/70">
                          <tr>
                            <th className="px-6 py-3">Topic</th>
                            <th className="px-4 py-3 text-center">Replies</th>
                            <th className="px-4 py-3 text-center">Views</th>
                            <th className="px-6 py-3 text-right">Latest Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brown/20">
                          {categoryThreads.map((thread) => (
                            <tr
                              key={thread._id}
                              className="transition-colors hover:bg-brown/20"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                  {thread.isPinned && (
                                    <span className="mt-0.5 rounded border border-tan/40 bg-tan/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tan">
                                      Pinned
                                    </span>
                                  )}
                                  <div>
                                    <Link
                                      href={`/forums/${thread._id}`}
                                      className="font-bold text-white transition-colors hover:text-tan"
                                    >
                                      {thread.title}
                                    </Link>
                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-tan/70">
                                      <span>Started by</span>
                                      <span className="font-semibold text-tan">
                                        {thread.creator?.username || "Anonymous"}
                                      </span>
                                      <span>•</span>
                                      <span>{formatDate(thread.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-center font-semibold text-sand">
                                {thread.replyCount ?? 0}
                              </td>

                              <td className="px-4 py-4 text-center text-tan/80">
                                {thread.viewsCount ?? 0}
                              </td>

                              <td className="px-6 py-4 text-right">
                                {thread.latestPost ? (
                                  <div className="text-[11px]">
                                    <p className="font-semibold text-white">
                                      {thread.latestPost.username || "Member"}
                                    </p>
                                    <p className="text-tan/60">
                                      {formatDate(thread.latestPost.createdAt)}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-tan/40">
                                    No replies
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Card View */
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryThreads.map((thread) => (
                        <div
                          key={thread._id}
                          className="group flex flex-col justify-between rounded-xl border border-brown/30 bg-carafe/60 p-4 transition-all hover:-translate-y-0.5 hover:border-tan/40 hover:bg-brown/20"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase text-tan">
                                {category.title}
                              </span>
                              {thread.isPinned && (
                                <span className="rounded bg-tan/20 px-1.5 py-0.5 text-[10px] font-bold text-tan">
                                  Pinned
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/forums/${thread._id}`}
                              className="mt-2 block font-bold text-white transition-colors group-hover:text-tan line-clamp-2"
                            >
                              {thread.title}
                            </Link>

                            <p className="mt-2 text-xs text-tan/70">
                              By{" "}
                              <span className="font-medium text-white">
                                {thread.creator?.username || "Anonymous"}
                              </span>{" "}
                              on {formatDate(thread.createdAt)}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-brown/20 pt-3 text-xs text-tan/80">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
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
                                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                  />
                                </svg>
                                {thread.replyCount ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
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
                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {thread.viewsCount ?? 0}
                              </span>
                            </div>

                            <Link
                              href={`/forums/${thread._id}`}
                              className="font-semibold text-tan underline-offset-4 hover:underline"
                            >
                              Read →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* Create New Category Modal */}
        {isNewCategoryModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={handleCloseCategoryModal}
          >
            <div
              className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-brown/40 bg-carafe shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-brown/30 bg-brown/15 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-tan/30 bg-tan/10 text-tan">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Create Forum Category
                    </h3>
                    <p className="text-xs text-tan">
                      Add a new topic section for discussions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="rounded-lg border border-brown/40 p-1.5 text-tan transition-colors hover:bg-brown/30 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleCreateCategorySubmit} className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tan">
                    Category Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryData.title}
                    onChange={(e) =>
                      setNewCategoryData({
                        ...newCategoryData,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Hardware & Racquets, Tour Matches, Off-Topic"
                    className="w-full rounded-lg border border-brown/40 bg-carafe/90 px-3.5 py-2 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tan">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newCategoryData.description}
                    onChange={(e) =>
                      setNewCategoryData({
                        ...newCategoryData,
                        description: e.target.value,
                      })
                    }
                    placeholder="A brief overview of what should be discussed in this section..."
                    className="w-full rounded-lg border border-brown/40 bg-carafe/90 px-3.5 py-2 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tan">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={newCategoryData.order}
                    onChange={(e) =>
                      setNewCategoryData({
                        ...newCategoryData,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-brown/40 bg-carafe/90 px-3.5 py-2 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 border-t border-brown/20 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseCategoryModal}
                    className="rounded-lg border border-brown/40 px-4 py-2 text-xs font-semibold text-sand transition-all hover:bg-brown/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreateLoading || !newCategoryData.title.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-tan px-5 py-2 text-xs font-bold text-carafe shadow-md transition-all hover:bg-white disabled:opacity-50"
                  >
                    {isCreateLoading ? "Creating..." : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}