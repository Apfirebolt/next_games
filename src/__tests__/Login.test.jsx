// src/app/login/page.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import LoginPage from "../app/login/page";
import { login } from "../features/auth/authSlice";
import { signIn } from "next-auth/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("../features/auth/authSlice", () => ({
  login: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, priority, sizes, ...props }) => (
    <img src={src} alt={alt || ""} {...props} />
  ),
}));

function renderWithStore({ isLoading = false } = {}) {
  const store = configureStore({
    reducer: {
      auth: (state = { isLoading }, action) => state,
    },
    preloadedState: {
      auth: { isLoading },
    },
  });

  const renderResult = render(
    <Provider store={store}>
      <LoginPage />
    </Provider>
  );

  return { store, ...renderResult };
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page brand headers, links, and input elements properly", () => {
    renderWithStore();

    expect(
      screen.getByRole("heading", { level: 1, name: /sign in/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /step back into your collection/i })
    ).toBeInTheDocument();

    const homeLinks = screen.getAllByRole("link", { name: /level\s*vault/i });
    expect(homeLinks.length).toBeGreaterThan(0);
    homeLinks.forEach((link) => expect(link).toHaveAttribute("href", "/"));

    expect(screen.getByRole("link", { name: /← return to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /forgot password\?/i })).toHaveAttribute("href", "#");

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument();
  });

  it("updates form field inputs on change", async () => {
    const user = userEvent.setup();
    renderWithStore();

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "secret123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("secret123");
  });

  it("dispatches login action and navigates to '/' on successful form submission", async () => {
    const user = userEvent.setup();
    const mockUnwrap = vi.fn().mockResolvedValue({});
    login.mockReturnValue({ type: "auth/login", unwrap: mockUnwrap });

    renderWithStore();

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "pass1234");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "pass1234",
    });
    expect(mockUnwrap).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("catches errors without navigating when login dispatch rejects", async () => {
    const user = userEvent.setup();
    const mockUnwrap = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    login.mockReturnValue({ type: "auth/login", unwrap: mockUnwrap });

    renderWithStore();

    await user.type(screen.getByLabelText(/email address/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(login).toHaveBeenCalledWith({
      email: "wrong@example.com",
      password: "wrongpass",
    });
    expect(mockUnwrap).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("triggers Google sign-in and shows spinner during pending state", async () => {
    const user = userEvent.setup();
    let resolveSignIn;
    signIn.mockReturnValue(new Promise((resolve) => { resolveSignIn = resolve; }));

    renderWithStore();

    const googleBtn = screen.getByRole("button", { name: /continue with google/i });
    await user.click(googleBtn);

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });
    expect(googleBtn).toBeDisabled();

    // Verify loading spinner is visible inside button
    const spinner = googleBtn.querySelector("svg.animate-spin");
    expect(spinner).toBeInTheDocument();

    // On success the page expects a redirect, so the loading state is intentionally left as-is
    resolveSignIn({});
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledTimes(1);
    });
    expect(googleBtn).toBeDisabled();
  });

  it("resets Google loading state if signIn throws an exception", async () => {
    const user = userEvent.setup();
    signIn.mockRejectedValueOnce(new Error("OAuth Network Error"));

    renderWithStore();

    const googleBtn = screen.getByRole("button", { name: /continue with google/i });
    await user.click(googleBtn);

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });

    await waitFor(() => {
      expect(googleBtn).not.toBeDisabled();
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });
  });

  it("renders authenticating state and disables buttons when Redux auth state is loading", () => {
    renderWithStore({ isLoading: true });

    const submitBtn = screen.getByRole("button", { name: /authenticating\.\.\./i });
    const googleBtn = screen.getByRole("button", { name: /continue with google/i });

    expect(submitBtn).toBeDisabled();
    expect(googleBtn).toBeDisabled();
    expect(screen.getByText("Authenticating...")).toBeInTheDocument();
  });
});