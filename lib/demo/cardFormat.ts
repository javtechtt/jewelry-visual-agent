// Pure display formatters for the payment-screen card fields. These run both on
// user typing and on agent fill so the value looks the same either way. The card
// data is never transmitted (see DemoCheckoutOverlay / store) — formatting is
// purely cosmetic.

export function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function formatCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}
