"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../features/categories/categorySlice";

const PIE_COLORS = ["#D2B48C", "#A88358", "#6F4E37", "#4A3728", "#E6D5B8", "#C49A6C"];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-brown/50 bg-carafe/95 p-3 shadow-2xl backdrop-blur-md text-xs">
        <p className="font-bold text-white mb-1">{label || payload[0]?.name}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex items-center gap-2 font-mono" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminCategoriesPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);

  const {
    categories = [],
    isLoading,
    isMutationLoading,
    isCreateLoading,
  } = useSelector((state) => state.categories || {});

  const actionLoading = isMutationLoading || isCreateLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeCategory, setActiveCategory] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOrder, setFormOrder] = useState(0);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Sort categories by order asc, then fallback to creation
  const sortedCategories = useMemo(() => {
    const list = Array.isArray(categories) ? [...categories] : [];
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return sortedCategories;
    const query = searchQuery.toLowerCase().trim();
    return sortedCategories.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.slug?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [sortedCategories, searchQuery]);

  // Calculated Metrics
  const stats = useMemo(() => {
    const totalCategories = sortedCategories.length;
    const totalThreads = sortedCategories.reduce((acc, c) => acc + (c.threadCount || 0), 0);
    const totalPosts = sortedCategories.reduce((acc, c) => acc + (c.postCount || 0), 0);
    const emptyCategories = sortedCategories.filter((c) => !c.threadCount).length;
    return { totalCategories, totalThreads, totalPosts, emptyCategories };
  }, [sortedCategories]);

  // Chart 1: Threads vs Posts Comparison
  const barChartData = useMemo(() => {
    return sortedCategories.map((cat) => ({
      name: cat.title.length > 12 ? `${cat.title.slice(0, 10)}...` : cat.title,
      Threads: cat.threadCount || 0,
      Posts: cat.postCount || 0,
    }));
  }, [sortedCategories]);

  // Chart 2: Posts Distribution Share
  const pieChartData = useMemo(() => {
    const active = sortedCategories.filter((c) => (c.postCount || 0) > 0);
    if (!active.length) return [];
    return active.map((cat) => ({
      name: cat.title,
      value: cat.postCount || 0,
    }));
  }, [sortedCategories]);

  const openCreateModal = () => {
    setModalMode("create");
    setActiveCategory(null);
    setFormTitle("");
    setFormSlug("");
    setFormDescription("");
    setFormOrder(sortedCategories.length);
  };

  const openEditModal = (cat) => {
    setModalMode("edit");
    setActiveCategory(cat);
    setFormTitle(cat.title || "");
    setFormSlug(cat.slug || "");
    setFormDescription(cat.description || "");
    setFormOrder(cat.order ?? 0);
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveCategory(null);
  };

  const handleTitleChange = (val) => {
    setFormTitle(val);
    if (modalMode === "create") {
      setFormSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSlug.trim()) return;

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim(),
      description: formDescription.trim(),
      order: Number(formOrder) || 0,
    };

    if (modalMode === "create") {
      await dispatch(createCategory(payload));
    } else if (modalMode === "edit" && activeCategory?._id) {
      await dispatch(
        updateCategory({
          categoryId: activeCategory._id,
          categoryData: payload,
        })
      );
    }

    closeModal();
    dispatch(fetchCategories());
  };

  const handleDelete = async (categoryId) => {
    await dispatch(deleteCategory(categoryId));
    setConfirmDeleteId(null);
  };

  // Inline Quick Reorder (+1 or -1)
  const handleQuickReorder = async (cat, direction) => {
    const newOrder = Math.max(0, (cat.order ?? 0) + (direction === "up" ? -1 : 1));
    if (newOrder === cat.order) return;

    await dispatch(
      updateCategory({
        categoryId: cat._id,
        categoryData: { order: newOrder },
      })
    );
    dispatch(fetchCategories());
  };

  // Guard: Administrator access required
  if (!currentUser?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-carafe text-sand">
        <Header />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">Access Denied</h1>
          <p className="mt-1 text-sm text-tan">Administrative privileges are required to manage categories.</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-bold text-sand transition hover:bg-brown/80 hover:text-white"
          >
            Return Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tan">
                System Structure
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Category <span className="text-tan">Management</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                Monitor category activity, resequence displays, assign moderators, and edit taxonomy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-brown/40 bg-brown/20 px-4 py-2.5 text-xs font-semibold text-sand hover:bg-brown/30 hover:text-white transition"
              >
                &larr; Analytics
              </Link>
              <Link
                href="/admin/moderators"
                className="inline-flex items-center gap-1.5 rounded-xl border border-tan/40 bg-tan/10 px-4 py-2.5 text-xs font-semibold text-tan hover:bg-tan hover:text-carafe transition"
              >
                Manage Moderators
              </Link>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-tan px-4 py-2.5 text-xs font-bold text-carafe shadow-md hover:bg-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Category
              </button>
            </div>
          </div>
        </div>

        {/* 1. Category Metrics Overview Cards */}
        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-brown/30 bg-brown/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tan/70">Total Categories</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalCategories}</p>
          </div>
          <div className="rounded-xl border border-brown/30 bg-brown/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tan/70">Total Threads</p>
            <p className="mt-1 text-2xl font-black text-amber-400">{stats.totalThreads}</p>
          </div>
          <div className="rounded-xl border border-brown/30 bg-brown/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tan/70">Total Posts</p>
            <p className="mt-1 text-2xl font-black text-sky-400">{stats.totalPosts}</p>
          </div>
          <div className="rounded-xl border border-brown/30 bg-brown/10 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tan/70">Inactive Sections</p>
            <p className="mt-1 text-2xl font-black text-red-400">{stats.emptyCategories}</p>
          </div>
        </section>

        {/* 2. Statistical Charts Section */}
        {sortedCategories.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Chart A: Threads vs Posts Comparison */}
            <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm lg:col-span-2">
              <div className="border-b border-brown/20 pb-3">
                <h2 className="text-base font-bold text-white">Content Activity Comparison</h2>
                <p className="text-xs text-tan">Thread generation vs total post interactions per category</p>
              </div>

              <div className="mt-6 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A3728" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#D2B48C" opacity={0.8} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#D2B48C" opacity={0.8} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "11px", color: "#D2B48C" }} />
                    <Bar dataKey="Threads" fill="#8B5A2B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Posts" fill="#D2B48C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Category Engagement Share */}
            <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm flex flex-col justify-between">
              <div className="border-b border-brown/20 pb-3">
                <h2 className="text-base font-bold text-white">Post Engagement Share</h2>
                <p className="text-xs text-tan">Proportion of community replies per category</p>
              </div>

              <div className="my-2 h-52 w-full">
                {pieChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-tan/60">
                    No posts recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#2C241D" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-[11px]">
                {pieChartData.slice(0, 4).map((item, idx) => (
                  <span key={item.name} className="inline-flex items-center gap-1 font-semibold text-tan">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Search Filter Bar */}
        <div className="mt-8 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search category title, slug, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-brown/40 bg-carafe/80 py-2 pl-9 pr-3 text-xs text-sand placeholder-tan/40 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
            />
            <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-tan/60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <span className="hidden sm:inline font-mono text-xs text-tan/70">
            {filteredCategories.length} Categories Listed
          </span>
        </div>

        {/* 4. Categories Data Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 backdrop-blur-sm">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-brown/20" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-base font-medium text-sand">No categories found matching criteria.</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/80"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-sand">
                <thead className="border-b border-brown/30 bg-carafe/60 text-[11px] font-bold uppercase tracking-wider text-tan">
                  <tr>
                    <th scope="col" className="px-6 py-4">Sequence</th>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="hidden md:table-cell px-6 py-4">Slug</th>
                    <th scope="col" className="px-6 py-4">Content Stats</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/20">
                  {filteredCategories.map((cat) => {
                    const isConfirmingDelete = confirmDeleteId === cat._id;

                    return (
                      <tr key={cat._id} className="transition-colors hover:bg-brown/15">
                        {/* Sequence Order + Quick Nudge Buttons */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-brown/40 bg-brown/20 font-mono font-bold text-tan text-xs">
                              {cat.order ?? 0}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                title="Move up"
                                onClick={() => handleQuickReorder(cat, "up")}
                                className="rounded p-0.5 text-tan/70 hover:bg-brown/40 hover:text-white"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                title="Move down"
                                onClick={() => handleQuickReorder(cat, "down")}
                                className="rounded p-0.5 text-tan/70 hover:bg-brown/40 hover:text-white"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Title & Description */}
                        <td className="px-6 py-4 max-w-sm">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm">{cat.title}</p>
                            <Link
                              href={`/forums/${cat.slug}`}
                              target="_blank"
                              title="Preview public forum"
                              className="text-tan/60 hover:text-tan transition"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                            </Link>
                          </div>
                          {cat.description ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-tan/70">{cat.description}</p>
                          ) : (
                            <p className="mt-0.5 text-xs text-tan/40 italic">No description</p>
                          )}
                        </td>

                        {/* Slug */}
                        <td className="hidden md:table-cell whitespace-nowrap px-6 py-4 font-mono text-tan/80">
                          /{cat.slug}
                        </td>

                        {/* Content Counts */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="rounded bg-brown/30 px-2 py-0.5 text-sand">
                              {cat.threadCount || 0} threads
                            </span>
                            <span className="rounded bg-carafe/80 px-2 py-0.5 text-tan border border-brown/30">
                              {cat.postCount || 0} posts
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {/* Link to assign moderators for this category */}
                            <Link
                              href={`/admin/moderators?categoryId=${cat._id}`}
                              className="rounded-lg border border-tan/30 bg-tan/10 px-2.5 py-1 text-xs font-semibold text-tan hover:bg-tan hover:text-carafe transition"
                            >
                              Moderators
                            </Link>

                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="rounded-lg border border-brown/40 bg-brown/20 px-2.5 py-1 text-xs font-semibold text-sand hover:border-tan/40 hover:bg-brown hover:text-white transition"
                            >
                              Edit
                            </button>

                            {isConfirmingDelete ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(cat._id)}
                                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-lg border border-brown/40 bg-brown/20 px-2 py-1 text-xs text-sand hover:bg-brown/40"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(cat._id)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carafe/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-brown/40 bg-carafe p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brown/30 pb-4">
              <h2 className="text-lg font-bold text-white">
                {modalMode === "create" ? "Create New Category" : `Edit "${activeCategory?.title}"`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-tan hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-tan">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RPG Discussion"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/90 px-3 py-2 text-xs text-sand placeholder-tan/40 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-tan">Slug (URL Segment)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rpg-discussion"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                  className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/90 px-3 py-2 text-xs font-mono text-sand placeholder-tan/40 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-tan">Display Order</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/90 px-3 py-2 text-xs font-mono text-sand focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />
                <p className="mt-1 text-[11px] text-tan/60">Lower numbers appear first on the category roster.</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-tan">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of discussion topics intended for this category..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/90 px-3 py-2 text-xs text-sand placeholder-tan/40 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-brown/30 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-brown/40 bg-brown/20 px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/40 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formTitle.trim() || !formSlug.trim()}
                  className="rounded-lg bg-tan px-4 py-2 text-xs font-bold text-carafe shadow transition hover:bg-white disabled:opacity-50"
                >
                  {actionLoading
                    ? "Saving..."
                    : modalMode === "create"
                    ? "Create Category"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}