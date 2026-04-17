import { describe, it, expect, vi, beforeEach } from "vitest";
import { safeGet, safeSet, safeRemove, safeGetJSON, safeSetJSON } from "./safe-storage";

// Mock localStorage
const store: Record<string, string> = {};
const mockStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
};

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: mockStorage });
  vi.stubGlobal("localStorage", mockStorage);
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
});

describe("safeGet", () => {
  it("returns value if present", () => {
    store["key1"] = "hello";
    expect(safeGet("key1")).toBe("hello");
  });
  it("returns null if missing", () => {
    expect(safeGet("missing")).toBeNull();
  });
  it("returns null if localStorage throws", () => {
    mockStorage.getItem.mockImplementationOnce(() => { throw new Error("QuotaExceeded"); });
    expect(safeGet("key1")).toBeNull();
  });
});

describe("safeSet", () => {
  it("sets value", () => {
    safeSet("key2", "world");
    expect(store["key2"]).toBe("world");
  });
  it("does not throw if storage fails", () => {
    mockStorage.setItem.mockImplementationOnce(() => { throw new Error("QuotaExceeded"); });
    expect(() => safeSet("key2", "x")).not.toThrow();
  });
});

describe("safeRemove", () => {
  it("removes key", () => {
    store["key3"] = "val";
    safeRemove("key3");
    expect(store["key3"]).toBeUndefined();
  });
});

describe("safeGetJSON", () => {
  it("parses JSON", () => {
    store["json1"] = JSON.stringify({ a: 1 });
    expect(safeGetJSON("json1", {})).toEqual({ a: 1 });
  });
  it("returns fallback on invalid JSON", () => {
    store["json2"] = "not-json";
    expect(safeGetJSON("json2", { x: 0 })).toEqual({ x: 0 });
  });
  it("returns fallback if missing", () => {
    expect(safeGetJSON("missing", [])).toEqual([]);
  });
});

describe("safeSetJSON", () => {
  it("stringifies and stores", () => {
    safeSetJSON("json3", { b: 2 });
    expect(JSON.parse(store["json3"])).toEqual({ b: 2 });
  });
});
