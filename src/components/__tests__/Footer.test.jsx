// src/components/__tests__/Footer.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  it("renders the brand name and current year in the copyright line", () => {
    render(<Footer />);

    expect(screen.getByText("Level Vault")).toBeInTheDocument();
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${year} Level Vault. All rights reserved.`))
    ).toBeInTheDocument();
  });

  it("renders the Explore and Support navigation sections with their links", () => {
    render(<Footer />);

    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All Games" })).toHaveAttribute(
      "href",
      "/games"
    );
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
      "href",
      "/support"
    );
  });

  it("renders the legal links in the bottom bar", () => {
    render(<Footer />);

    const legalNav = screen.getByRole("navigation", { name: "Legal links" });
    expect(legalNav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms"
    );
    expect(screen.getByRole("link", { name: "Cookies" })).toHaveAttribute(
      "href",
      "/cookies"
    );
  });
});
