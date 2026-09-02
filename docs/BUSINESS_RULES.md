# Business Rules & Constraints (Trường Thành Bookstore)

## 1. Authentication & Security
- **Hybrid Auth**: The system uses both `HttpOnly` cookies (for web clients) and `Bearer` tokens (for mobile/third-party).
- **Token Rotation**: Refresh tokens are stored in `HttpOnly` cookies to prevent XSS attacks. `localStorage` is only used for temporary data like access tokens if absolutely necessary, but cookies are the primary driver.
- **CSRF Protection**: CORS strictly limits origins to configured frontend domains (e.g. localhost, Vercel, Render) and blocks unknown cross-origin requests.

## 2. Orders & Checkout
- **Atomic Stock Deduction**: Stock deduction must be atomic using `$inc` combined with `$gte` to prevent race conditions during concurrent checkouts.
- **State Machine Transitions**:
  - `PENDING` -> `CONFIRMED` or `CANCELLED`
  - `CONFIRMED` -> `PROCESSING` or `CANCELLED`
  - `PROCESSING` -> `SHIPPING` or `CANCELLED`
  - `SHIPPING` -> `DELIVERED`
  - `DELIVERED` -> `COMPLETED` or `RETURNED`
  - `COMPLETED` -> `RETURNED`
- **Cancellation**: Only `PENDING` orders can be cancelled by customers. Staff/Admins can override.
- **Stock Restoration**: Cancelling or Returning an order will automatically restore the product stock and deduct the sold count.

## 3. Product & Inventory
- **Status Thresholds**:
  - `> 10`: IN_STOCK
  - `1 - 10`: LOW_STOCK
  - `<= 0`: OUT_OF_STOCK
- **Search & Filtering**: String queries are stripped of diacritics using normalized regex patterns to support Vietnamese language searches. Search limit is capped at 100 characters to prevent ReDoS.

## 4. Notifications & Loyalty
- **Loyalty Points**: 1 point earned per 1,000 VND spent.
- **Point Deduction**: Points earned from an order are automatically deducted if the order is cancelled.
- **Tier Upgrades**: System checks for tier upgrades whenever points are added.

## 5. Performance
- **N+1 Prevention**: System explicitly uses `findByIds` array querying instead of iterating single `findById` calls when retrieving items for an order checkout.
