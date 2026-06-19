# Demo-Safe Rules

Every commerce-like flow in Aurelis is **demo-safe**: it feels real in the UI but
performs **no real backend action**. This is an MVP/prototype meant to sell the
concept — not to transact.

## What never happens

- ❌ No real payment / card capture
- ❌ No real order submission or inventory reservation
- ❌ No real booking / calendar event / live availability
- ❌ No real CRM write
- ❌ No real email / SMS
- ❌ No real human paging
- ❌ No irreversible backend action of any kind

## What the user experiences

A complete, polished frontend journey for each flow:

1. Entry / selection summary
2. Details collection (real-feeling form + validation)
3. Review / summary screen
4. Simulated processing state (animated)
5. Demo-safe confirmation with a clear reference number
6. A clear "this was a demo" note + next step
7. Return to Aurelis

## Flows + references

| Flow            | Component                              | Reference prefix |
| --------------- | -------------------------------------- | ---------------- |
| Checkout        | `components/overlays/DemoCheckoutOverlay.tsx` | `DEMO-ORD-…`     |
| Booking         | `components/overlays/DemoBookingOverlay.tsx`  | `DEMO-APT-…`     |
| Lead capture    | `components/overlays/LeadCaptureOverlay.tsx`  | `DEMO-LEAD-…`    |
| Human handoff   | `components/overlays/HandoffOverlay.tsx`      | `DEMO-CONC-…`    |

Shared chrome (header, demo notice, processing, confirmation) lives in
`components/overlays/DemoFlowShell.tsx`.

## Where the (mock) logic lives

- `lib/demo/demoActions.ts` — `runCheckout`, `runBooking`, `submitLead`,
  `requestHandoff`. Each simulates latency and returns a local receipt.
- `lib/demo/demoReceipts.ts` — generates demo reference numbers.
- `lib/demo/demoValidation.ts` — frontend-only field validation.
- `config/demo-flows.ts` — copy, demo time slots, payment placeholders, channels.

## Language rules

✅ Use: "Demo confirmation", "Request received", "This is a demo checkout. No
payment has been processed.", "A team member would receive this in production."

🚫 Avoid (unless clearly marked demo): "Payment successful", "Your booking is
confirmed", "Your order has been placed", "We charged your card."

## Going to production later

Each action handler in `lib/demo/demoActions.ts` has a `TODO(production)` marker
showing exactly where to call a real payment processor, calendar, CRM, or
messaging provider. The demo and real providers are intentionally isolated so
the swap is a one-file change per flow. The typed payloads in `types/demo.ts`
describe the future backend contracts.
