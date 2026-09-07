// src/components/__tests__/NotFound.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "../app/not-found";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("NotFound Component", () => {
  it("renders the 404 status pill and headings correctly", () => {
    render(<NotFound />);

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /page not found/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Oops! The page you are looking for has either been moved, deleted, or never existed in the library\./i
      )
    ).toBeInTheDocument();
  });

  it("renders navigation action links pointing to correct routes", () => {
    render(<NotFound />);

    const homeLink = screen.getByRole("link", { name: /return home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");

    const gamesLink = screen.getByRole("link", { name: /browse games/i });
    expect(gamesLink).toBeInTheDocument();
    expect(gamesLink).toHaveAttribute("href", "/games");
  });

  it("renders background glow element and container styling", () => {
    const { container } = render(<NotFound />);

    const rootWrapper = container.firstChild;
    expect(rootWrapper).toHaveClass("bg-carafe", "text-sand");

    const glowElement = container.querySelector(".blur-3xl");
    expect(glowElement).toBeInTheDocument();
    expect(glowElement).toHaveClass("rounded-full", "bg-brown/20");
  });
});