// src/__tests__/Profile.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProfilePage from "../app/profile/page";
import { updateUserProfile, changePassword, reset } from "../features/auth/authSlice";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("../features/auth/authSlice", () => ({
  updateUserProfile: vi.fn(),
  changePassword: vi.fn(),
  reset: vi.fn(),
}));

const baseUser = {
  email: "jane@example.com",
  username: "jane_doe",
  firstName: "Jane",
  lastName: "Doe",
};

function renderWithStore(authOverrides = {}) {
  const authState = {
    user: baseUser,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: "",
    passwordLoading: false,
    passwordSuccess: false,
    passwordError: false,
    passwordMessage: "",
    ...authOverrides,
  };

  const store = configureStore({
    reducer: { auth: (state = authState, action) => state },
    preloadedState: { auth: authState },
  });

  const renderResult = render(
    <Provider store={store}>
      <ProfilePage />
    </Provider>
  );

  return { store, ...renderResult };
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reset.mockReturnValue({ type: "auth/reset" });
  });

  it("redirects to /login and renders nothing when there is no user", async () => {
    const { container } = renderWithStore({ user: null });

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("renders Header, Footer, and pre-fills the profile form from the current user", () => {
    renderWithStore();

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /account settings/i })
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue("jane@example.com")).toBeDisabled();
    expect(screen.getByLabelText(/username/i)).toHaveValue("jane_doe");
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Jane");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
  });

  it("updates profile fields on change and dispatches updateUserProfile on submit", async () => {
    const user = userEvent.setup();
    updateUserProfile.mockReturnValue({ type: "auth/updateProfile" });
    renderWithStore();

    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, "jane_new");

    await user.click(screen.getByRole("button", { name: /save profile details/i }));

    expect(updateUserProfile).toHaveBeenCalledWith({
      firstName: "Jane",
      lastName: "Doe",
      username: "jane_new",
    });
  });

  it("shows a profile error message when isError is true", () => {
    renderWithStore({ isError: true, message: "Username already taken" });

    expect(screen.getByText("Username already taken")).toBeInTheDocument();
  });

  it("shows a profile success message and disables the button while saving", () => {
    renderWithStore({ isSuccess: true, isLoading: true });

    expect(screen.getByText("Profile updated successfully.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /saving changes\.\.\./i })).toBeDisabled();
  });

  it("shows a client-side error when new password and confirmation do not match", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await user.type(screen.getByLabelText(/current password/i), "oldpass1");
    await user.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm new password/i), "different");
    await user.click(screen.getByRole("button", { name: /^update password$/i }));

    expect(
      screen.getByText("New password and confirmation do not match.")
    ).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("shows a client-side error when the new password is too short", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await user.type(screen.getByLabelText(/current password/i), "oldpass1");
    await user.type(screen.getByLabelText(/^new password$/i), "abc");
    await user.type(screen.getByLabelText(/confirm new password/i), "abc");
    await user.click(screen.getByRole("button", { name: /^update password$/i }));

    expect(
      screen.getByText("New password must be at least 6 characters.")
    ).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("shows a client-side error when the new password matches the current password", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await user.type(screen.getByLabelText(/current password/i), "samepass");
    await user.type(screen.getByLabelText(/^new password$/i), "samepass");
    await user.type(screen.getByLabelText(/confirm new password/i), "samepass");
    await user.click(screen.getByRole("button", { name: /^update password$/i }));

    expect(
      screen.getByText("New password cannot be the same as your current password.")
    ).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("dispatches changePassword with valid, differing credentials", async () => {
    const user = userEvent.setup();
    changePassword.mockReturnValue({ type: "auth/changePassword" });
    renderWithStore();

    await user.type(screen.getByLabelText(/current password/i), "oldpass1");
    await user.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpass1");
    await user.click(screen.getByRole("button", { name: /^update password$/i }));

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "oldpass1",
      newPassword: "newpass1",
    });
  });

  it("clears a previous client-side password error once the user edits a field again", async () => {
    const user = userEvent.setup();
    renderWithStore();

    await user.type(screen.getByLabelText(/current password/i), "oldpass1");
    await user.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm new password/i), "different");
    await user.click(screen.getByRole("button", { name: /^update password$/i }));
    expect(
      screen.getByText("New password and confirmation do not match.")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/confirm new password/i), "1");

    expect(
      screen.queryByText("New password and confirmation do not match.")
    ).not.toBeInTheDocument();
  });

  it("shows a server-side password error message when passwordError is true", () => {
    renderWithStore({ passwordError: true, passwordMessage: "Current password is incorrect" });

    expect(screen.getByText("Current password is incorrect")).toBeInTheDocument();
  });

  it("shows a password success message and disables the button while updating", () => {
    renderWithStore({ passwordSuccess: true, passwordLoading: true, passwordMessage: "" });

    expect(screen.getByText("Password updated successfully.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /updating password\.\.\./i })).toBeDisabled();
  });

  it("clears the password form fields once passwordSuccess becomes true", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithStore();

    await user.type(screen.getByLabelText(/current password/i), "oldpass1");
    await user.type(screen.getByLabelText(/^new password$/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpass1");
    expect(screen.getByLabelText(/^new password$/i)).toHaveValue("newpass1");

    // Re-render with a store whose passwordSuccess flips to true, triggering the reset effect
    const successStore = configureStore({
      reducer: {
        auth: (
          state = {
            user: baseUser,
            isLoading: false,
            isSuccess: false,
            isError: false,
            message: "",
            passwordLoading: false,
            passwordSuccess: true,
            passwordError: false,
            passwordMessage: "",
          },
          action
        ) => state,
      },
    });

    rerender(
      <Provider store={successStore}>
        <ProfilePage />
      </Provider>
    );

    expect(screen.getByLabelText(/^new password$/i)).toHaveValue("");
    expect(screen.getByLabelText(/current password/i)).toHaveValue("");
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue("");
  });

  it("dispatches reset on unmount", () => {
    const { unmount } = renderWithStore();

    unmount();

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
