"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { register, reset } from "../../features/auth/authSlice";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { email, username, firstName, lastName, password, confirmPassword } = formData;
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth || {}
  );

  useEffect(() => {
    if (isSuccess || user) {
      router.push("/");
    }
    dispatch(reset());
  }, [user, isSuccess, isError, message, router, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    dispatch(
      register({
        email,
        username,
        firstName,
        lastName,
        password,
      })
    );
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-carafe text-sand">
      {/* Left Column: Form Panel (50% on Desktop) */}
      <div className="flex w-full flex-col justify-between px-6 py-10 lg:w-1/2 lg:px-14 xl:px-20">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white lg:hidden">
            Level<span className="text-tan">Vault</span>
          </Link>
          <div className="hidden lg:block" />
          <Link
            href="/"
            className="text-xs font-medium text-tan transition-colors hover:text-sand"
          >
            ← Return to Home
          </Link>
        </div>

        {/* Register Form Box */}
        <div className="mx-auto w-full max-w-lg py-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brown/40 bg-brown/15 px-3 py-0.5 text-xs font-semibold tracking-wider text-tan uppercase">
              Get Started
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Create Your Account
            </h1>
            <p className="mt-2 text-sm text-tan">
              Join LevelVault to curate your personal library and share game ratings.
            </p>
          </div>

          {/* Social Auth Option */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-brown/40 bg-brown/10 px-4 py-3 text-sm font-semibold text-sand transition-all hover:border-tan hover:bg-brown/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tan disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <svg
                  className="h-5 w-5 animate-spin text-sand"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.3 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.2.1-2 .4-2.8L1.6 6.4C.6 8.3 0 10.5 0 12.8s.6 4.5 1.6 6.4l3.7-4.4z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.2L1.6 16.4C3.5 20.2 7.4 23.5 12 23.5z"
                  />
                </svg>
              )}
              Sign up with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brown/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-carafe px-3 font-semibold tracking-wider text-tan">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* First & Last Name (2-Column Grid) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold uppercase tracking-wider text-tan"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={onChange}
                  placeholder="John"
                  className="mt-1.5 block w-full rounded-lg border border-brown/40 bg-brown/10 px-3.5 py-2.5 text-sm text-sand placeholder-tan/35 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold uppercase tracking-wider text-tan"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={onChange}
                  placeholder="Doe"
                  className="mt-1.5 block w-full rounded-lg border border-brown/40 bg-brown/10 px-3.5 py-2.5 text-sm text-sand placeholder-tan/35 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-tan"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={onChange}
                placeholder="player_one"
                className="mt-1.5 block w-full rounded-lg border border-brown/40 bg-brown/10 px-3.5 py-2.5 text-sm text-sand placeholder-tan/35 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-tan"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={onChange}
                placeholder="name@example.com"
                className="mt-1.5 block w-full rounded-lg border border-brown/40 bg-brown/10 px-3.5 py-2.5 text-sm text-sand placeholder-tan/35 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
              />
            </div>

            {/* Password & Confirm Password (2-Column Grid) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-tan"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full rounded-lg border border-brown/40 bg-brown/10 px-3.5 py-2.5 text-sm text-sand placeholder-tan/35 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-tan"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="mt-1.5 block w-full rounded-lg border border-brown/40 bg-brown/10 px-3.5 py-2.5 text-sm text-sand placeholder-tan/35 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
                />
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-brown px-4 py-3 text-sm font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tan disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-sand"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-tan">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-sand underline decoration-brown underline-offset-4 transition-colors hover:text-white"
            >
              Log in instead
            </Link>
          </p>
        </div>

        {/* Footer Meta */}
        <div className="text-center text-xs text-tan/60">
          Protected with JWT Session Auth • LevelVault Gaming Network
        </div>
      </div>

      {/* Right Column: Visual Brand Image (50% on Desktop) */}
      <div className="relative hidden w-1/2 overflow-hidden border-l border-brown/30 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
          alt="Retro Arcade & Gaming Room"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carafe via-carafe/60 to-transparent" />
        <div className="absolute inset-0 bg-brown/20 mix-blend-multiply" />

        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" className="text-right text-xl font-bold tracking-tight text-white">
            Level<span className="text-tan"> Vault</span>
          </Link>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-carafe/80 px-3 py-1 text-xs font-semibold tracking-wider text-tan uppercase backdrop-blur-sm">
              Community Access
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white">
              60,000+ Games waiting for review.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tan">
              Build custom playlists, track achievements, and discover hidden gems through community recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}