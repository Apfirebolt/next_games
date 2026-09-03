"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  updateUserProfile,
  changePassword,
  reset,
} from "../../features/auth/authSlice";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const {
    user,
    isLoading: isProfileLoading,
    isSuccess: isProfileSuccess,
    isError: isProfileError,
    message: profileMessage,
    passwordLoading,
    passwordSuccess,
    passwordError,
    passwordMessage,
  } = useSelector((state) => state.auth || {});

  // Profile details state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [clientPasswordError, setClientPasswordError] = useState("");

  // Sync current user info to profile form
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
    });
  }, [user, router]);

  // Reset password form on successful update
  useEffect(() => {
    if (passwordSuccess) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [passwordSuccess]);

  // Clean up messages on unmount
  useEffect(() => {
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setClientPasswordError("");
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(
      updateUserProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        username: profileForm.username,
      })
    );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setClientPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setClientPasswordError("New password and confirmation do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setClientPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setClientPasswordError("New password cannot be the same as your current password.");
      return;
    }

    dispatch(
      changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
    );
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
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
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            Account Center
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Account <span className="text-tan">Settings</span>
          </h1>
          <p className="mt-1 text-sm text-tan/80">
            Manage your personal credentials, identity tags, and security preferences.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Section 1: Profile Information */}
          <div className="flex flex-col justify-between rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
            <div>
              <div className="flex items-center gap-3 border-b border-brown/20 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brown/40 bg-brown/20 text-tan">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Profile Details</h2>
                  <p className="text-xs text-tan/70">Update your public identity and name</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-tan">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-brown/30 bg-carafe/50 px-3.5 py-2.5 text-xs text-sand/50"
                  />
                  <p className="mt-1 text-[10px] text-tan/50">Email cannot be modified.</p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-tan">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/80 px-3.5 py-2.5 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-semibold uppercase tracking-wider text-tan">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/80 px-3.5 py-2.5 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold uppercase tracking-wider text-tan">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/80 px-3.5 py-2.5 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                    />
                  </div>
                </div>

                {isProfileError && (
                  <p className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
                    {profileMessage}
                  </p>
                )}

                {isProfileSuccess && (
                  <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                    Profile updated successfully.
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProfileLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brown py-2.5 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white disabled:opacity-50"
                  >
                    {isProfileLoading ? "Saving Changes..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section 2: Change Password */}
          <div className="flex flex-col justify-between rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
            <div>
              <div className="flex items-center gap-3 border-b border-brown/20 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brown/40 bg-brown/20 text-tan">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Security & Password</h2>
                  <p className="text-xs text-tan/70">Ensure account safety with a strong passkey</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-xs font-semibold uppercase tracking-wider text-tan">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/80 px-3.5 py-2.5 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider text-tan">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Min. 6 characters"
                    className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/80 px-3.5 py-2.5 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-tan">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Repeat new password"
                    className="mt-1.5 w-full rounded-lg border border-brown/40 bg-carafe/80 px-3.5 py-2.5 text-xs text-sand placeholder-tan/40 transition-colors focus:border-tan focus:outline-none focus:ring-1 focus:ring-tan"
                  />
                </div>

                {(clientPasswordError || passwordError) && (
                  <p className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
                    {clientPasswordError || passwordMessage}
                  </p>
                )}

                {passwordSuccess && (
                  <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                    {passwordMessage || "Password updated successfully."}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brown py-2.5 text-xs font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white disabled:opacity-50"
                  >
                    {passwordLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}