import { describe, it, expect } from "vitest";
import { isEmail, isPhone, validateCheckout, hasErrors } from "@/lib/demo/demoValidation";

describe("demo validation", () => {
  it("isEmail accepts well-formed addresses only", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("aria@example.com")).toBe(true);
    expect(isEmail("nope")).toBe(false);
    expect(isEmail("a@b")).toBe(false);
  });

  it("isPhone accepts plausible phone strings", () => {
    expect(isPhone("+1 415 555 0142")).toBe(true);
    expect(isPhone("(415) 555-0142")).toBe(true);
    expect(isPhone("12")).toBe(false);
  });

  it("validateCheckout flags missing required fields", () => {
    const errs = validateCheckout({});
    expect(hasErrors(errs)).toBe(true);
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
  });

  it("validateCheckout passes with full, valid details", () => {
    const errs = validateCheckout({
      name: "Aria",
      email: "aria@example.com",
      phone: "+1 415 555 0142",
      paymentMethod: "card",
      consent: true,
    });
    expect(hasErrors(errs)).toBe(false);
  });
});
