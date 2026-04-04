import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useSar } from "../useSar";
import { sarService } from "@/features/business/api/sar.api";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/features/business/api/sar.api", async () => {
  const actual = await vi.importActual<typeof import("@/features/business/api/sar.api")>(
    "@/features/business/api/sar.api",
  );

  return {
    ...actual,
    sarService: {
      ...actual.sarService,
      getList: vi.fn(),
      getByCycle: vi.fn(),
    },
  };
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
  );

  return { wrapper, queryClient };
}

describe("useSar draft loading", () => {
  beforeEach(() => {
    vi.mocked(sarService.getList).mockResolvedValue({
      Success: true,
      Data: {
        Data: [],
        TotalRow: 0,
        PageIndex: 1,
        PageSize: 10,
      },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the draft loading flag false during background refetches after the first load", async () => {
    const firstDraft = createDeferred<{
      Success: boolean;
      Data: { SarReportId: string };
    }>();
    const secondDraft = createDeferred<{
      Success: boolean;
      Data: { SarReportId: string };
    }>();

    vi.mocked(sarService.getByCycle)
      .mockReturnValueOnce(firstDraft.promise)
      .mockReturnValueOnce(secondDraft.promise);

    const { wrapper, queryClient } = createWrapper();

    const { result, unmount } = renderHook(() => useSar(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(sarService.getList).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.showPopupDetail({ CycleId: "cycle-123" } as never);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(sarService.getByCycle).toHaveBeenCalledTimes(1);
    expect(result.current.isDraftFetching).toBe(true);

    await act(async () => {
      firstDraft.resolve({
        Success: true,
        Data: { SarReportId: "draft-1" },
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isDraftFetching).toBe(false);
      expect(result.current.draft).toEqual({ SarReportId: "draft-1" });
    });

    act(() => {
      void result.current.refetchDraft();
    });

    await waitFor(() => {
      expect(vi.mocked(sarService.getByCycle).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    expect(result.current.isDraftFetching).toBe(false);
    expect(result.current.draft).toEqual({ SarReportId: "draft-1" });

    await act(async () => {
      secondDraft.resolve({
        Success: true,
        Data: { SarReportId: "draft-2" },
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.draft).toEqual({ SarReportId: "draft-2" });
    });

    unmount();
    queryClient.clear();
  });
});
