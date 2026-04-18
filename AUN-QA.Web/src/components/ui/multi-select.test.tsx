import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MultipleSelector from "./multi-select";

const OPTIONS = [
  { value: "user-1", label: "Assignee 1" },
  { value: "user-2", label: "Assignee 2" },
  { value: "user-3", label: "Assignee 3" },
];

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
}

function mockRect(element: HTMLElement, rect: Partial<DOMRect>) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: rect.left ?? 100,
    y: rect.top ?? 120,
    top: rect.top ?? 120,
    left: rect.left ?? 100,
    bottom: rect.bottom ?? 160,
    right: rect.right ?? 420,
    width: rect.width ?? 320,
    height: rect.height ?? 40,
    toJSON: () => ({}),
  } as DOMRect);
}

function renderSelector(props?: { portalContainer?: HTMLElement | null }) {
  const { container } = render(
    <MultipleSelector
      options={OPTIONS}
      placeholder="Add assignee..."
      portalContainer={props?.portalContainer ?? null}
    />,
  );

  const root = container.querySelector("[data-slot='command']") as HTMLDivElement;
  const input = screen.getByPlaceholderText("Add assignee...");

  return { root, input };
}

beforeEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  setViewport(1280, 720);
});

describe("MultipleSelector dropdown positioning", () => {
  it("renders dropdown into the provided portal container", async () => {
    const portalHost = document.createElement("div");
    portalHost.setAttribute("data-testid", "portal-host");
    document.body.appendChild(portalHost);

    const { root, input } = renderSelector({ portalContainer: portalHost });
    mockRect(root, {
      top: 120,
      left: 100,
      width: 320,
      height: 40,
      bottom: 160,
    });

    fireEvent.focus(input);

    await waitFor(() => {
      const dropdown = portalHost.querySelector("[data-ms-dropdown='true']");
      expect(dropdown).toBeInTheDocument();
    });
  });

  it("flips the dropdown upward when there is not enough room below", async () => {
    setViewport(1280, 460);

    const { root, input } = renderSelector();
    mockRect(root, {
      top: 380,
      left: 100,
      width: 320,
      height: 40,
      bottom: 420,
    });

    fireEvent.focus(input);

    await waitFor(() => {
      const dropdown = document.querySelector(
        "[data-ms-dropdown='true']",
      ) as HTMLDivElement | null;

      expect(dropdown).toBeInTheDocument();
      expect(dropdown?.dataset.placement).toBe("top");
      expect(Number.parseFloat(dropdown?.style.top ?? "0")).toBeLessThan(380);
    });
  });

  it("clamps the dropdown horizontally within the viewport", async () => {
    setViewport(360, 640);

    const { root, input } = renderSelector();
    mockRect(root, {
      top: 160,
      left: 280,
      width: 300,
      height: 40,
      bottom: 200,
    });

    fireEvent.focus(input);

    await waitFor(() => {
      const dropdown = document.querySelector(
        "[data-ms-dropdown='true']",
      ) as HTMLDivElement | null;

      expect(dropdown).toBeInTheDocument();
      expect(Number.parseFloat(dropdown?.style.left ?? "0")).toBeLessThanOrEqual(
        48,
      );
      expect(Number.parseFloat(dropdown?.style.width ?? "0")).toBeLessThanOrEqual(
        336,
      );
    });
  });

  it("stops wheel propagation from the dropdown scroll container", async () => {
    const bodyWheelSpy = vi.fn();
    document.body.addEventListener("wheel", bodyWheelSpy);

    const { root, input } = renderSelector();
    mockRect(root, {
      top: 120,
      left: 100,
      width: 320,
      height: 40,
      bottom: 160,
    });

    fireEvent.focus(input);

    const scrollContainer = await screen.findByTestId(
      "multi-select-scroll-container",
    );
    fireEvent.wheel(scrollContainer, { deltaY: 120 });

    expect(bodyWheelSpy).not.toHaveBeenCalled();

    document.body.removeEventListener("wheel", bodyWheelSpy);
  });
});
