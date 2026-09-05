"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { fetchCategories } from "../../../features/categories/categorySlice";
import { fetchAllUsers } from "../../../features/user/userSlice";
import {
  fetchCategoryModerators,
  assignModerator,
  updatePermissions,
  revokeModerator,
} from "../../../features/moderators/moderatorSlice";

const DEFAULT_PERMISSIONS = {
  canPinThreads: true,
  canLockThreads: true,
  canDeleteThreads: true,
  canMoveThreads: false,
  canEditPosts: false,
  canDeletePosts: true,
};

export default function AdminModeratorsPage() {
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth?.user);
  const { categories = [], isLoading: isLoadingCategories } = useSelector(
    (state) => state.categories || {}
  );
  const { users = [], isLoading: isLoadingUsers } = useSelector(
    (state) => state.user || {}
  );
  const {
    moderators = [],
    isLoading: isLoadingModerators,
    isActionLoading,
  } = useSelector((state) => state.moderators || {});

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPermissions, setNewPermissions] = useState(DEFAULT_PERMISSIONS);
  const [confirmRevokeId, setConfirmRevokeId] = useState(null);

  // 1. Fetch initial categories and users
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchAllUsers());
  }, [dispatch]);

  // 2. Default selected category when categories load
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0]._id);
    }
  }, [categories, selectedCategoryId]);

  // 3. Fetch moderators whenever the selected category changes
  useEffect(() => {
    if (selectedCategoryId) {
      dispatch(fetchCategoryModerators(selectedCategoryId));
    }
  }, [selectedCategoryId, dispatch]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c._id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Filter candidate users who are not already moderators of this category
  const availableUsers = useMemo(() => {
    const activeModIds = new Set(
      moderators.map((m) => {
        const u = m.userId;
        return (u?._id || u?.id || u)?.toString();
      })
    );

    const query = userSearchQuery.toLowerCase().trim();
    return (Array.isArray(users) ? users : [])
      .filter((u) => {
        const uid = (u._id || u.id)?.toString();
        return !activeModIds.has(uid);
      })
      .filter((u) => {
        if (!query) return true;
        const username = u.username?.toLowerCase() || "";
        const email = u.email?.toLowerCase() || "";
        const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        return username.includes(query) || email.includes(query) || name.includes(query);
      });
  }, [users, moderators, userSearchQuery]);

  // Permission toggles for the assignment modal
  const handleToggleNewPerm = (key) => {
    setNewPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Submit new moderator assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId || !selectedUserId) return;

    await dispatch(
      assignModerator({
        categoryId: selectedCategoryId,
        userId: selectedUserId,
        permissions: newPermissions,
      })
    );

    setIsAssignModalOpen(false);
    setSelectedUserId("");
    setUserSearchQuery("");
    setNewPermissions(DEFAULT_PERMISSIONS);
  };

  // Live update of existing moderator permissions
  const handlePermissionChange = async (modRecord, permKey, currentValue) => {
    const userId = modRecord.userId?._id || modRecord.userId?.id || modRecord.userId;
    const updatedPerms = {
      ...modRecord.permissions,
      [permKey]: !currentValue,
    };

    await dispatch(
      updatePermissions({
        categoryId: selectedCategoryId,
        userId,
        permissions: updatedPerms,
      })
    );
  };

  // Revoke moderator assignment
  const handleRevoke = async (userId) => {
    await dispatch(
      revokeModerator({
        categoryId: selectedCategoryId,
        userId,
      })
    );
    setConfirmRevokeId(null);
  };

  // Access Control: Admin only
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
          <h1 className="mt-4 text-2xl font-black text-white">Access Restricted</h1>
          <p className="mt-1 text-sm text-tan">
            You must have site administrator privileges to manage category moderators.
          </p>
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
        {/* Banner */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tan">
                <svg className="h-3.5 w-3.5 fill-tan text-tan" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Administration Panel
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Category <span className="text-tan">Moderators</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                Assign members to moderate specific categories and control permissions.
              </p>
            </div>

            <button
              type="button"
              disabled={!selectedCategoryId}
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-tan px-4 py-2.5 text-xs font-bold text-carafe shadow-md transition hover:bg-white disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Assign New Moderator
            </button>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="mt-8 border-b border-brown/30 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-tan">
              Select Category
            </h2>
            <span className="text-xs text-tan/70 font-mono">
              {categories.length} Categories Total
            </span>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {isLoadingCategories ? (
              <div className="h-9 w-64 animate-pulse rounded-lg bg-brown/20" />
            ) : (
              categories.map((cat) => {
                const isActive = cat._id === selectedCategoryId;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
                      isActive
                        ? "bg-tan text-carafe shadow-md"
                        : "border border-brown/40 bg-brown/10 text-sand hover:bg-brown/30 hover:text-white"
                    }`}
                  >
                    {cat.title}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Moderator Cards & Permissions Table */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Moderators for &ldquo;{selectedCategory?.title || "Category"}&rdquo;
              </h3>
              <p className="text-xs text-tan">
                Active moderators who have authority over threads and posts in this section.
              </p>
            </div>
            <span className="rounded-md border border-brown/30 bg-carafe/80 px-2.5 py-1 text-xs font-mono text-tan">
              {moderators.length} Assigned
            </span>
          </div>

          {isLoadingModerators ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-brown/20" />
              ))}
            </div>
          ) : moderators.length === 0 ? (
            <div className="my-8 flex flex-col items-center justify-center rounded-2xl border border-brown/20 bg-brown/5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brown/30 bg-brown/20 text-tan">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-sand">No moderators assigned yet</p>
              <p className="mt-1 text-xs text-tan">
                Assign trusted community members to help manage &ldquo;{selectedCategory?.title}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-4 rounded-lg bg-brown px-4 py-2 text-xs font-semibold text-sand transition hover:bg-brown/80 hover:text-white"
              >
                Assign First Moderator
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {moderators.map((mod) => {
                const u = mod.userId;
                const userId = u?._id || u?.id;
                const perms = mod.permissions || {};
                const isConfirmingRevoke = confirmRevokeId === userId;

                return (
                  <div
                    key={mod._id}
                    className="overflow-hidden rounded-2xl border border-brown/30 bg-brown/10 p-5 backdrop-blur-sm transition hover:border-brown/50"
                  >
                    {/* Moderator Info Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-brown/20 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-tan/30 bg-carafe font-bold uppercase text-tan text-sm">
                          {u?.image ? (
                            <Image src={u.image} alt={u.username} fill className="object-cover" />
                          ) : (
                            u?.username?.charAt(0) || "M"
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/users/${userId}`}
                              className="font-bold text-white transition hover:text-tan text-sm"
                            >
                              @{u?.username}
                            </Link>
                            <span className="rounded bg-tan/20 border border-tan/40 px-1.5 py-0.2 text-[10px] font-bold text-tan">
                              Moderator
                            </span>
                          </div>
                          <p className="text-[11px] text-tan/70">
                            {`${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.email || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Revoke Action */}
                      <div>
                        {isConfirmingRevoke ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleRevoke(userId)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-red-500 disabled:opacity-50"
                            >
                              Confirm Revoke
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRevokeId(null)}
                              className="rounded-lg border border-brown/40 bg-brown/20 px-2.5 py-1.5 text-xs font-semibold text-sand hover:bg-brown/40"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeId(userId)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Revoke Moderator
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Permission Flags Checklist */}
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-tan mb-2.5">
                        Privileges & Permissions
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {[
                          { key: "canPinThreads", label: "Pin Threads" },
                          { key: "canLockThreads", label: "Lock Threads" },
                          { key: "canDeleteThreads", label: "Delete Threads" },
                          { key: "canMoveThreads", label: "Move Threads" },
                          { key: "canEditPosts", label: "Edit Posts" },
                          { key: "canDeletePosts", label: "Delete Posts" },
                        ].map(({ key, label }) => {
                          const isChecked = Boolean(perms[key]);
                          return (
                            <label
                              key={key}
                              className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border p-2 text-xs transition ${
                                isChecked
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                  : "border-brown/30 bg-carafe/40 text-sand/60 hover:bg-brown/20"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handlePermissionChange(mod, key, isChecked)}
                                disabled={isActionLoading}
                                className="h-3.5 w-3.5 rounded border-brown/40 text-tan focus:ring-tan"
                              />
                              <span className="font-semibold">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 4. ASSIGN MODERATOR MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carafe/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-brown/40 bg-carafe p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brown/30 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Assign Moderator</h3>
                <p className="text-xs text-tan">
                  Assigning to &ldquo;{selectedCategory?.title}&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg p-1 text-tan hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAssignSubmit} className="mt-4 flex flex-1 flex-col space-y-4 overflow-y-auto pr-1">
              {/* Member Search */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-tan">
                  Select User
                </label>
                <input
                  type="text"
                  placeholder="Filter users by name or username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/90 px-3 py-2 text-xs text-sand placeholder-tan/40 focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                />

                <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-brown/30 bg-brown/10 p-1 divide-y divide-brown/20">
                  {isLoadingUsers ? (
                    <div className="p-3 text-center text-xs text-tan">Loading members...</div>
                  ) : availableUsers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-tan/60">
                      No eligible users found.
                    </div>
                  ) : (
                    availableUsers.slice(0, 15).map((u) => {
                      const uid = u._id || u.id;
                      const isSelected = selectedUserId === uid;
                      return (
                        <button
                          key={uid}
                          type="button"
                          onClick={() => setSelectedUserId(uid)}
                          className={`flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition ${
                            isSelected
                              ? "bg-tan font-bold text-carafe"
                              : "text-sand hover:bg-brown/20"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">@{u.username}</p>
                            <p className="text-[10px] opacity-75">
                              {`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                            </p>
                          </div>
                          {isSelected && <span>✓ Selected</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Initial Permissions Selection */}
              <div className="border-t border-brown/30 pt-3">
                <label className="text-xs font-bold uppercase tracking-wider text-tan">
                  Initial Permissions
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: "canPinThreads", label: "Pin Threads" },
                    { key: "canLockThreads", label: "Lock Threads" },
                    { key: "canDeleteThreads", label: "Delete Threads" },
                    { key: "canMoveThreads", label: "Move Threads" },
                    { key: "canEditPosts", label: "Edit Posts" },
                    { key: "canDeletePosts", label: "Delete Posts" },
                  ].map(({ key, label }) => {
                    const checked = newPermissions[key];
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition ${
                          checked
                            ? "border-tan/40 bg-tan/10 text-white"
                            : "border-brown/30 bg-carafe/40 text-sand/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleNewPerm(key)}
                          className="h-3.5 w-3.5 rounded border-brown/40 text-tan focus:ring-tan"
                        />
                        <span className="font-medium">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-brown/30 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-lg border border-brown/40 bg-brown/20 px-4 py-2 text-xs font-semibold text-sand hover:bg-brown/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserId || isActionLoading}
                  className="rounded-lg bg-tan px-4 py-2 text-xs font-bold text-carafe shadow transition hover:bg-white disabled:opacity-50"
                >
                  {isActionLoading ? "Assigning..." : "Assign Moderator"}
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