# EMD Drinking Sports App — Project Rules

## Overview
Ghana sports-bar operating system: POS, inventory, debts, payments, gift cards, wallets, AI business insights, PWA offline-first.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **State**: Zustand (demo mode) + Supabase (production)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (demo mode fallback when env vars not set)
- **Styling**: Custom CSS (black/gold luxury theme)
- **Charts**: Recharts
- **Testing**: Vitest (unit), Playwright (e2e)
- **PWA**: Service worker, IndexedDB offline queue

## Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run lint         # ESLint
npm run test         # Vitest unit tests
npx playwright test  # E2e tests
```

## Architecture

### Demo Mode vs Production Mode
- When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are NOT set, the app runs in **demo mode** using Zustand + seed data
- When Supabase env vars ARE set, the app uses real Supabase auth and repository-backed operations
- The `isSupabaseConfigured()` function in `lib/repositories/base.ts` determines the mode

### Repository Layer (`lib/repositories/`)
- All Supabase data access goes through repository classes
- `RepositoryFactory` provides access to all repositories
- Typed data mappers in `mappers.ts` convert between DB rows (pesewas) and domain types (GHS)
- **Money is stored as integer pesewas in the database** — never use floating point for money in DB
- Use `ghanaCedisToPesewas()` and `pesewasToGhanaCedis()` from `lib/domain/money.ts`

### SQL Transaction Functions
- `checkout_order()` — atomic checkout with stock management (bottle/shot)
- `apply_debt_payment()` — atomic debt payment (prevents overpayment)
- `redeem_gift_card()` — atomic gift card redemption (checks expiry, balance)
- `transfer_table()` — atomically move an order from one table to another
- `split_bill()` — atomically split line items into a new order
- These are called through the repository layer, never directly from the client

### Auth & Roles
- 4 roles: owner, manager, cashier, waiter
- Permission matrix in `lib/auth/roles.ts`
- `useAuth()` hook provides `can(permission)` for UI gating, `avatarUrl`, `uploadAvatar()`
- Middleware (`middleware.ts`) protects routes when Supabase is configured
- Demo credentials: `{role}@emd.com` / `{role}123`
- Auth screens: `/login`, `/forgot-password`, `/reset-password`, `/unauthorized`
- Profile pictures: demo mode stores as data URL in localStorage; production uses Supabase Storage `avatars` bucket

### POS Cashier Bar
- Shows current user's profile picture (clickable to upload), name, role, email
- Live "My Sales" stats: today's sales count, items sold, total, all-time sales, all-time total
- Stats computed from sales filtered by `currentCashierId` in the store
- `setCashierId()` is called from App.tsx via `useEffect` when auth user changes

### Split Bill
- Available on occupied tables in the Tables page
- Modal shows line items with checkboxes
- Demo mode: `store.splitBill()` creates a new sale with selected lines
- Production mode: `OrdersRepository.splitBill()` calls `split_bill()` SQL function

### Offline-First
- IndexedDB is the primary offline queue (`lib/offline/idb.ts`)
- Sync worker (`lib/offline/sync.ts`) processes queue with exponential backoff
- Max 5 retry attempts, 2s base backoff, 60s max
- Electronic payments (MoMo/Card) are blocked when offline
- `useSyncIntegration()` hook wires sync state into UI
- `useOnlineStatus()` hook tracks connectivity

### Keyboard Shortcuts (POS)
- `/` or `?` — Focus search
- `F7` — Clear cart
- `F8` — Hold order
- `F9` — Checkout

## Coding Conventions
- Use `"use client"` directive for client components
- Follow existing CSS class naming (kebab-case, no CSS modules)
- Money display: `GHS X.XX` format using `money()` helper
- All new database tables need RLS policies
- All new API routes need auth checks
- Never commit secrets or env files

## Testing
- Unit tests in `tests/*.test.ts` (Vitest)
- E2e tests in `e2e/*.spec.ts` (Playwright)
- E2e tests authenticate via `signInAs()` helper in `beforeEach`
- E2e navigation uses `navigateTo(page, name)` helper which opens mobile sidebar first if needed
- 95 e2e tests (chromium + mobile projects), 134 unit tests
- All critical accounting rules must have tests (no negative debts, no wallet overdraft, etc.)
- Run `npm run typecheck && npm run lint && npm run test && npm run build` before considering work complete
- E2e tests require `npx playwright install` first (chromium + webkit browsers)
- `next.config.ts` has `allowedDevOrigins: ["127.0.0.1", "localhost"]` for Playwright compatibility

## File Structure
```
app/                    Next.js App Router pages
  login/                Sign-in page
  unauthorized/         Access denied page
  api/                  API routes (payments, sync, AI)
components/
  App.tsx               Main app shell + all page components
  ServiceWorkerRegistration.tsx
lib/
  auth/                 Auth context, roles
  domain/               Business logic (inventory, money)
  hooks/                React hooks (online status, sync, install prompt)
  offline/              IndexedDB, queue, sync worker
  payments/             State machine, idempotency, sandbox
  repositories/         Supabase data access layer
  supabase/             Client/server Supabase clients
  analytics.ts          Business intelligence calculations
  receipt.ts            Receipt printing
  seed.ts               Demo data
  store.ts              Zustand store (demo mode)
  types.ts              TypeScript domain types
supabase/migrations/    SQL schema and transaction functions
tests/                  Vitest unit tests
e2e/                    Playwright e2e tests
```
