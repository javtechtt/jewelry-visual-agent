import { describe, it, expect } from "vitest";
import { formatCardNumber, formatExpiry, formatCvc } from "@/lib/demo/cardFormat";

describe("card formatting (display-only, never transmitted)", () => {
  it("groups the card number in 4s, capped at 16 digits", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("4242-4242")).toBe("4242 4242");
    expect(formatCardNumber("4242424242424242999")).toBe("4242 4242 4242 4242");
  });

  it("formats expiry as MM / YY", () => {
    expect(formatExpiry("1228")).toBe("12 / 28");
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("1")).toBe("1");
  });

  it("keeps up to 4 CVC digits", () => {
    expect(formatCvc("12a34")).toBe("1234");
    expect(formatCvc("123456")).toBe("1234");
  });
});
