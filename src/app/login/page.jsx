"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { login, reset } from "../../features/auth/authSlice";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

//   useEffect(() => {
//     if (isSuccess || user) {
//       router.push("/");
//     }
//     dispatch(reset());
//   }, [user, isSuccess, isError, message, router, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
        await dispatch(login({ email, password })).unwrap();

        router.push("/");
    } catch (error) {
      // Error handling is already managed by authService/toasts
    }
  };


  return (
    <div className="flex min-h-screen bg-carafe text-sand">
      {/* Visual Brand Panel - 50% on desktop */}
      <div className="relative hidden w-1/2 overflow-hidden border-r border-brown/30 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"
          alt="Gaming Setup"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Color overlay to blend with the palette */}
        <div className="absolute inset-0 bg-gradient-to-t from-carafe via-carafe/60 to-transparent" />
        <div className="absolute inset-0 bg-brown/20 mix-blend-multiply" />

        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Level<span className="text-tan">Vault</span>
          </Link>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-carafe/80 px-3 py-1 text-xs font-semibold tracking-wider text-tan uppercase backdrop-blur-sm">
              Welcome Back
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white">
              Step back into your collection.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tan">
              Sync game ratings, manage your personal backlog, and track ongoing leaderboards.
            </p>
          </div>
        </div>
      </div>

      {/* Form Panel - 50% on desktop */}
      <div className="flex w-full flex-col justify-between px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Mobile Header Brand */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white lg:hidden">
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

        {/* Login Form Container */}
        <div className="mx-auto w-full max-w-md py-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Sign In</h1>
            <p className="mt-2 text-sm text-tan">
              Enter your credentials to access your profile.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
                className="mt-2 block w-full rounded-lg border border-brown/40 bg-brown/10 px-4 py-3 text-sm text-sand placeholder-tan/40 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-tan"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-tan transition-colors hover:text-white"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={onChange}
                placeholder="••••••••"
                className="mt-2 block w-full rounded-lg border border-brown/40 bg-brown/10 px-4 py-3 text-sm text-sand placeholder-tan/40 transition-colors focus:border-tan focus:bg-brown/20 focus:outline-none focus:ring-1 focus:ring-tan"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
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
                  Authenticating...
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-tan">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-sand underline decoration-brown underline-offset-4 transition-colors hover:text-white"
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer Meta */}
        <div className="text-center text-xs text-tan/70">
          Protected with JWT Session Auth • Softgenie API
        </div>
      </div>
    </div>
  );
}