import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateEmailRequired,
  validatePhone,
  validateRequired,
  validateMinLength,
  validatePrice,
  validateDuration,
  validateAll,
} from "./validate";

describe("validateEmail", () => {
  it("returns null for empty (optional)", () => {
    expect(validateEmail("")).toBeNull();
    expect(validateEmail("  ")).toBeNull();
  });
  it("returns null for valid emails", () => {
    expect(validateEmail("a@b.com")).toBeNull();
    expect(validateEmail("user.name+tag@example.co.uk")).toBeNull();
  });
  it("returns error for invalid emails", () => {
    expect(validateEmail("abc")).toBeTruthy();
    expect(validateEmail("@domain")).toBeTruthy();
    expect(validateEmail("user@")).toBeTruthy();
  });
});

describe("validateEmailRequired", () => {
  it("returns error for empty", () => {
    expect(validateEmailRequired("")).toBe("Email requis.");
  });
  it("returns error for invalid", () => {
    expect(validateEmailRequired("abc")).toBe("Format email invalide.");
  });
  it("returns null for valid", () => {
    expect(validateEmailRequired("a@b.com")).toBeNull();
  });
});

describe("validatePhone", () => {
  it("returns null for empty (optional)", () => {
    expect(validatePhone("")).toBeNull();
  });
  it("returns null for valid French numbers", () => {
    expect(validatePhone("06 12 34 56 78")).toBeNull();
    expect(validatePhone("+33612345678")).toBeNull();
  });
  it("returns error for too short", () => {
    expect(validatePhone("123")).toBeTruthy();
  });
});

describe("validateRequired", () => {
  it("returns error for empty", () => {
    expect(validateRequired("", "Nom")).toBe("Nom est requis.");
  });
  it("returns null for non-empty", () => {
    expect(validateRequired("Jean")).toBeNull();
  });
});

describe("validateMinLength", () => {
  it("returns error when too short", () => {
    expect(validateMinLength("ab", 3, "Mot de passe")).toBeTruthy();
  });
  it("returns null when long enough", () => {
    expect(validateMinLength("abc", 3)).toBeNull();
  });
});

describe("validatePrice", () => {
  it("returns null for 0", () => {
    expect(validatePrice(0)).toBeNull();
  });
  it("returns null for positive", () => {
    expect(validatePrice("29.99")).toBeNull();
  });
  it("returns error for negative", () => {
    expect(validatePrice(-5)).toBeTruthy();
  });
  it("returns error for NaN", () => {
    expect(validatePrice("abc")).toBeTruthy();
  });
});

describe("validateDuration", () => {
  it("returns null for valid duration", () => {
    expect(validateDuration(30)).toBeNull();
    expect(validateDuration("60")).toBeNull();
  });
  it("returns error for 0", () => {
    expect(validateDuration(0)).toBeTruthy();
  });
  it("returns error for >480", () => {
    expect(validateDuration(500)).toBeTruthy();
  });
});

describe("validateAll", () => {
  it("returns only errors", () => {
    const result = validateAll({
      name: null,
      email: "Format invalide.",
      phone: null,
    });
    expect(Object.keys(result)).toEqual(["email"]);
    expect(result.email).toBe("Format invalide.");
  });
  it("returns empty for no errors", () => {
    expect(validateAll({ a: null, b: null })).toEqual({});
  });
});
