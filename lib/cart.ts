// Cart math. Price labels are display strings (e.g. "$12,400", "From $180",
// "Complimentary"); we parse the leading number where there is one and treat the
// rest as 0, so the total stays a best-effort figure for the demo checkout.

import type { CartItem } from "@/types/demo";

export function parsePrice(label: string): number {
  const n = Number(label.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((n, item) => n + item.qty, 0);
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + parsePrice(item.priceLabel) * item.qty, 0);
}

export function cartTotalLabel(cart: CartItem[]): string {
  const total = cartTotal(cart);
  return total > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(total)
    : "By request";
}
