import { describe, it, expect, vi } from "vitest";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import About from "../app/about/page";

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

describe("About Page", () => {
  it("renders the static layout including Header, Footer, and main heading", () => {
    render(<About />);

    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
    expect(screen.getByText("About Next Games")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /built with modern web tech/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /A performant gaming portal crafted with the latest front-end standards, optimized for speed and fluidity\./i
      )
    ).toBeInTheDocument();
  });

  it("does not display the modal dialog on initial render", () => {
    render(<About />);

    expect(screen.queryByText("Under the Hood")).not.toBeInTheDocument();
    expect(screen.queryByText("Next.js")).not.toBeInTheDocument();
  });

  it("opens the modal and displays all tech stack items when the trigger button is clicked", async () => {
    const user = userEvent.setup();
    render(<About />);

    const openButton = screen.getByRole("button", { name: /view technology stack/i });
    await user.click(openButton);

    expect(
      screen.getByRole("heading", { level: 3, name: "Under the Hood" })
    ).toBeInTheDocument();

    const expectedTech = [
      { name: "Next.js", role: "Framework" },
      { name: "Tailwind CSS v4", role: "Styling" },
      { name: "Redux Toolkit", role: "State Management" },
      { name: "Headless UI", role: "Accessible Components" },
      { name: "Heroicons", role: "Iconography" },
    ];

    expectedTech.forEach(({ name, role }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(role)).toBeInTheDocument();
    });
  });

  it("closes the modal when clicking the top-right close icon button", async () => {
    const user = userEvent.setup();
    render(<About />);

    await user.click(screen.getByRole("button", { name: /view technology stack/i }));
    expect(screen.getByText("Under the Hood")).toBeInTheDocument();

    const modalTitle = screen.getByText("Under the Hood");
    const headerContainer = modalTitle.parentElement;
    const closeIconButton = headerContainer.querySelector("button");

    await user.click(closeIconButton);

    await waitForElementToBeRemoved(() => screen.queryByText("Under the Hood"));
  });

  it("closes the modal when clicking the 'Got it' button", async () => {
    const user = userEvent.setup();
    render(<About />);

    await user.click(screen.getByRole("button", { name: /view technology stack/i }));
    expect(screen.getByText("Under the Hood")).toBeInTheDocument();

    const gotItButton = screen.getByRole("button", { name: /got it/i });
    await user.click(gotItButton);

    await waitForElementToBeRemoved(() => screen.queryByText("Under the Hood"));
  });

  it("closes the modal when pressing the Escape key", async () => {
    const user = userEvent.setup();
    render(<About />);

    await user.click(screen.getByRole("button", { name: /view technology stack/i }));
    expect(screen.getByText("Under the Hood")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitForElementToBeRemoved(() => screen.queryByText("Under the Hood"));
  });
});