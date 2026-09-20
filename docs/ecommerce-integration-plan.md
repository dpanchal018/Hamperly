# E-Commerce Integration Plan: Payments, Shiprocket & Customer Notifications

**Status:** Planning — not yet started. Saved for reference.
**Date:** 2026-09-20

## Where things stand today

A quick audit of the codebase (`src/actions/checkout.actions.ts`) confirms:

- **No payment gateway.** "Checkout" creates a `purchases` row with `status: PENDING`, `payment_status: PENDING`, `amount_paid: 0`. No money is ever actually captured — it's effectively an unpaid order request.
- **No shipping/courier integration.** Pincode checks are a static/manual validation, not a real courier serviceability API. There's no AWB generation, label creation, or tracking.
- **No customer-facing notifications.** The only outbound alert on order placement is a Telegram message to the store owner (`sendTelegramMessage`) plus an in-app notification bell record. Customers get no SMS/WhatsApp/email at all.
- `purchases.status` enum today: `PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED` — no shipping-related states (`SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RTO`) exist yet.
- `products` already has `weight_grams` / `dimensions_cm` (needed for courier integration); `hampers` does not yet.

## The big picture: one pipeline, not three features

Payment → Order Fulfillment → Shipping → Customer Notifications are stages of a single order lifecycle. Recommended build order, because each stage's completion is what triggers the next:

**Phase 1: Payment Gateway (Razorpay)** → **Phase 2: Order status lifecycle + admin fulfillment screen** → **Phase 3: Shiprocket** → **Phase 4: SMS/WhatsApp notifications wired into Phases 1–3**

The notification *sender* utility itself could be built early in parallel with Phase 1 (it mirrors the existing Telegram pattern almost exactly), but the actual trigger points (payment confirmed, shipped, delivered) don't exist until Phases 1 and 3 land — so real end-to-end notifications naturally come last.

---

## Phase 1 — Payment Gateway

**Recommendation: Razorpay.** Standard choice for an Indian D2C store — UPI, cards, netbanking, wallets in one integration, and it pairs cleanly with Shiprocket's prepaid/COD distinction later. (Cashfree or PayU are reasonable alternatives.)

**Flow:**
1. Customer clicks "Place Order" → existing stock/price validation runs (unchanged) → server creates a Razorpay Order via their API instead of immediately writing a `PENDING` purchase.
2. Razorpay's checkout widget opens client-side for payment.
3. On success, Razorpay returns a payment ID + signature — **must be verified server-side** (HMAC signature check). Never trust a client-reported "success" alone.
4. A **Razorpay webhook** (`/api/webhooks/razorpay`) is the real source of truth — confirms payment even if the customer closes the tab immediately after paying.
5. Only after verified payment should inventory be deducted and the final `purchases` row created. Today inventory is deducted at order-creation time, before any payment confirmation — fine for COD, risky once real payments are involved (an abandoned/failed payment would leave stock wrongly decremented).
6. Keep **Cash on Delivery as a second checkout option** — Shiprocket has native COD remittance support, and many gifting-store customers expect it.

**Schema notes:** `purchases` already has `payment_status`, `payment_mode`, and a `payment_logs` table — mostly ready. Add columns to store the Razorpay order ID / payment ID for traceability and webhook idempotency (avoid double-processing the same event).

**Action needed from you:** sign up for a Razorpay business account and complete KYC. This can take a few days — start it early regardless of when coding begins.

---

## Phase 2 — Order status lifecycle (small but necessary)

Add `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, and a returned/RTO state to `purchases.status`. Small migration, but Shiprocket integration has nowhere meaningful to report status without it.

---

## Phase 3 — Shiprocket

1. **Auth**: Shiprocket issues an API token via email/password login; it expires periodically and needs refreshing (small scheduled job, same pattern as the existing QA/Telegram cron).
2. **Order creation**: once an order is paid (or COD-confirmed), call Shiprocket's "create order" API with customer address, items, weight, and dimensions. Requires adding weight/dimension fields to `hampers` (products already have them).
3. **AWB + pickup**: Shiprocket assigns a courier and airway bill number; schedule pickup either automatically or via a new "Ship Order" button in the admin order screen.
4. **Live tracking**: a Shiprocket webhook feeds status changes (picked up → in transit → out for delivery → delivered / RTO) back into `purchases.status` automatically.
5. **Bonus**: Shiprocket has a real pincode-serviceability API — worth swapping in for the current static pincode check, giving customers accurate delivery estimates instead of a guess.

**Action needed from you:** sign up for Shiprocket, verify pickup address, get API credentials.

---

## Phase 4 — Customer Notifications (SMS/WhatsApp)

**Provider: not yet decided** — leading candidates are **MSG91** or **Gupshup**, both Indian providers offering unified SMS + WhatsApp Business API with simpler onboarding than going directly through Meta. Revisit this choice before starting Phase 4; it doesn't block Phases 1–3.

**Constraint to plan around**: WhatsApp Business API can't send free-text messages to customers — message *templates* must be pre-written and approved (can take a couple of days). Draft these early once a provider is picked:
- Order confirmed / payment received
- Order shipped (+ tracking link)
- Out for delivery
- Delivered
- Order cancelled / refunded

These fire at moments Phases 1 and 3 already produce (payment webhook, Shiprocket status webhook) — hence building this last, once the triggers already exist.

**Action needed from you:** sign up with chosen provider, verify a WhatsApp Business number, get message templates approved.

---

## Summary: what's on you vs. what's on Claude

| Phase | Needs your action (accounts/KYC) | Can be built in-repo |
|---|---|---|
| 1. Payment | Razorpay signup + KYC | Checkout integration, webhook, signature verification |
| 3. Shipping | Shiprocket signup + pickup address | Order/AWB creation, tracking webhook, admin "Ship" button |
| 4. Notifications | MSG91/Gupshup signup + template approval | Sending logic, wiring into order/shipping events |

**Suggested next step when ready to start:** begin all relevant sign-ups in parallel, since KYC/template approval are the slowest parts and gate everything downstream — actual coding on Phase 1 can start as soon as Razorpay test keys are available, without waiting on the others.
