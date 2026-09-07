// src/components/__tests__/Header.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Header from "../Header";
import authReducer from "../../features/auth/authSlice";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: (props) => <img {...props} alt={props.alt || ""} />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUseSession = vi.fn(() => ({ data: null }));
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}));

function renderWithStore({ user = null } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user, profile: null, isError: false, isSuccess: false, isLoading: false, message: "" },
    },
  });
  return render(
    <Provider store={store}>
      <Header />
    </Provider>
  );
}

describe("Header", () => {
  it("renders the brand logo and main nav links when logged out", () => {
    renderWithStore();

    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Games" })[0]).toHaveAttribute(
      "href",
      "/games"
    );
    expect(screen.getAllByRole("link", { name: "Sign In" })[0]).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("shows the user's display name once authenticated", async () => {
    renderWithStore({ user: { id: "u1", username: "PlayerOne", email: "p1@test.com" } });

    expect(await screen.findAllByText("PlayerOne")).not.toHaveLength(0);
  });

  it("toggles the mobile menu button state on click", () => {
    renderWithStore();

    const toggleButton = screen.getByLabelText("Toggle navigation menu");
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });
});
