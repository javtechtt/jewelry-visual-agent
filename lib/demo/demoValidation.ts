// Lightweight, frontend-only validation for the checkout flow. Enough to make
// the form feel real; no data leaves the browser.

import type {
  CheckoutPayload,
  ContactDetails,
  ValidationErrors,
} from "@/types/demo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s\d]{6,}$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

function validateContact(details: Partial<ContactDetails>): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!details.name?.trim()) errors.name = "Please enter your name.";
  if (!details.email?.trim()) errors.email = "Please enter an email.";
  else if (!isEmail(details.email)) errors.email = "That email looks off.";
  if (!details.phone?.trim()) errors.phone = "Please enter a phone number.";
  else if (!isPhone(details.phone)) errors.phone = "That phone looks off.";
  return errors;
}

export function validateCheckout(payload: Partial<CheckoutPayload>): ValidationErrors {
  const errors = validateContact(payload);
  if (!payload.paymentMethod) errors.paymentMethod = "Choose a method.";
  if (!payload.consent) errors.consent = "Please accept the Terms of Sale.";
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
