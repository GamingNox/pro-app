import { describe, it, expect, vi } from "vitest";
import { withRetry, withSupabaseRetry } from "./retry";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on network error and succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValue("ok");
    const result = await withRetry(fn, { delays: [10, 10] });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    await expect(withRetry(fn, { maxAttempts: 2, delays: [10] })).rejects.toThrow("Failed to fetch");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-network errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("RLS violation"));
    await expect(withRetry(fn)).rejects.toThrow("RLS violation");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("withSupabaseRetry", () => {
  it("returns success immediately", async () => {
    const fn = vi.fn().mockResolvedValue({ error: null, data: [1] });
    const result = await withSupabaseRetry(fn);
    expect(result.error).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns business errors without retrying", async () => {
    const fn = vi.fn().mockResolvedValue({
      error: { message: "row-level security violation", code: "42501" },
    });
    const result = await withSupabaseRetry(fn);
    expect(result.error).toBeTruthy();
    expect(fn).toHaveBeenCalledTimes(1); // no retry
  });

  it("retries on network-like errors", async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce({ error: { message: "fetch failed", code: "" } })
      .mockResolvedValue({ error: null, data: "ok" });
    const result = await withSupabaseRetry(fn);
    expect(result.error).toBeNull();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
