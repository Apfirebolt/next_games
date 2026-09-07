// src/__tests__/Register.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import RegisterPage from "../app/register/page";
import { register, reset } from "../features/auth/authSlice";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../features/auth/authSlice", () => ({
  register: vi.fn(),
  reset: vi.fn(),
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

function renderWithStore({ isLoading = false, isSuccess = false, user = null } = {}) {
  const store = configureStore({
    reducer: {
      auth: (state = { isLoading, isSuccess, user, isError: false, message: "" }, action) =>
        state,
    },
    preloadedState: {
      auth: { isLoading, isSuccess, user, isError: false, message: "" },
    },
  });

  const renderResult = render(
    <Provider store={store}>
      <RegisterPage />
    </Provider>
  );

  return { store, ...renderResult };
}

const fillForm = async (user, overrides = {}) => {
  const values = {
    firstName: "John",
    lastName: "Doe",
    username: "player_one",
    email: "john@example.com",
    password: "secret123",
    confirmPassword: "secret123",
    ...overrides,
  };

  await user.type(screen.getByLabelText(/first name/i), values.firstName);
  await user.type(screen.getByLabelText(/last name/i), values.lastName);
  await user.type(screen.getByLabelText(/username/i), values.username);
  await user.type(screen.getByLabelText(/email address/i), values.email);
  await user.type(screen.getByLabelText(/^password$/i), values.password);
  await user.type(screen.getByLabelText(/confirm password/i), values.confirmPassword);
};

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reset.mockReturnValue({ type: "auth/reset" });
  });

  it("renders page headers, links, and all form inputs", () => {
    renderWithStore();

    expect(
      screen.getByRole("heading", { level: 1, name: /create your account/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /60,000\+ games waiting for review\./i })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /← return to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /log in instead/i })).toHaveAttribute("href", "/login");

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complete registration/i })).toBeInTheDocument();
  });

  it("updates form field values on change", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await fillForm(user);

    expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
    expect(screen.getByLabelText(/username/i)).toHaveValue("player_one");
    expect(screen.getByLabelText(/email address/i)).toHaveValue("john@example.com");
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("secret123");
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue("secret123");
  });

  it("shows an error and does not dispatch register when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await fillForm(user, { password: "secret123", confirmPassword: "different" });
    await user.click(screen.getByRole("button", { name: /complete registration/i }));

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    expect(register).not.toHaveBeenCalled();
  });

  it("shows an error and does not dispatch register when password is too short", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await fillForm(user, { password: "abc", confirmPassword: "abc" });
    await user.click(screen.getByRole("button", { name: /complete registration/i }));

    expect(toast.error).toHaveBeenCalledWith("Password must be at least 6 characters long");
    expect(register).not.toHaveBeenCalled();
  });

  it("dispatches register with form data on valid submission", async () => {
    const user = userEvent.setup();
    register.mockReturnValue({ type: "auth/register" });
    renderWithStore();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /complete registration/i }));

    expect(register).toHaveBeenCalledWith({
      email: "john@example.com",
      username: "player_one",
      firstName: "John",
      lastName: "Doe",
      password: "secret123",
    });
  });

  it("redirects to '/' when registration already succeeded", async () => {
    renderWithStore({ isSuccess: true });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("redirects to '/' when a user is already present", async () => {
    renderWithStore({ user: { id: "u1" } });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("does not redirect when there is no success or user", () => {
    renderWithStore();

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("triggers Google sign-in and keeps the button disabled after success", async () => {
    const user = userEvent.setup();
    let resolveSignIn;
    signIn.mockReturnValue(new Promise((resolve) => { resolveSignIn = resolve; }));

    renderWithStore();

    const googleBtn = screen.getByRole("button", { name: /sign up with google/i });
    await user.click(googleBtn);

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });
    expect(googleBtn).toBeDisabled();
    expect(googleBtn.querySelector("svg.animate-spin")).toBeInTheDocument();

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

    const googleBtn = screen.getByRole("button", { name: /sign up with google/i });
    await user.click(googleBtn);

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });

    await waitFor(() => {
      expect(googleBtn).not.toBeDisabled();
      expect(screen.getByText("Sign up with Google")).toBeInTheDocument();
    });
  });

  it("shows the authenticating state and disables buttons while loading", () => {
    renderWithStore({ isLoading: true });

    const submitBtn = screen.getByRole("button", { name: /creating account\.\.\./i });
    const googleBtn = screen.getByRole("button", { name: /sign up with google/i });

    expect(submitBtn).toBeDisabled();
    expect(googleBtn).toBeDisabled();
    expect(screen.getByText("Creating Account...")).toBeInTheDocument();
  });
});
