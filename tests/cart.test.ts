import { describe, it, expect } from "vitest";
import { parsePrice, cartCount, cartTotal, cartTotalLabel } from "@/lib/cart";
import type { CartItem } from "@/types/demo";

const item = (over: Partial<CartItem>): CartItem => ({
  id: "x",
  categoryId: "watches",
  name: "X",
  priceLabel: "$0",
  qty: 1,
  ...over,
});

describe("cart math", () => {
  it("parsePrice extracts the leading number, else 0", () => {
    expect(parsePrice("$12,400")).toBe(12400);
    expect(parsePrice("From $180")).toBe(180);
    expect(parsePrice("Complimentary")).toBe(0);
  });

  it("cartCount sums quantities", () => {
    expect(cartCount([item({ qty: 2 }), item({ id: "y", qty: 3 })])).toBe(5);
  });

  it("cartTotal multiplies price by qty", () => {
    expect(cartTotal([item({ priceLabel: "$100", qty: 2 }), item({ id: "y", priceLabel: "$50", qty: 1 })])).toBe(250);
  });

  it("cartTotalLabel formats USD, else 'By request'", () => {
    expect(cartTotalLabel([item({ priceLabel: "$1,000", qty: 1 })])).toContain("1,000");
    expect(cartTotalLabel([item({ priceLabel: "By request", qty: 1 })])).toBe("By request");
  });
});
