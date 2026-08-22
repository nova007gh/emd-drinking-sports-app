# EMD Drinking Sports — Production Architecture

## Client
Next.js App Router + React + TypeScript. Desktop, tablet and mobile use the same responsive web application. Mobile is installable as a PWA.

## Data
Supabase Postgres is the production source of truth. Browser persistence becomes an offline cache only. All persisted monetary values use integer pesewas.

## Authentication
Supabase Auth + profiles table. Roles: owner, manager, cashier, waiter. Row Level Security limits privileged finance and inventory operations.

## POS
Paid orders become accounting records. Stock-changing checkout must be transactional. Full bottles and shots/tots are tracked separately using sealed bottle stock plus shots remaining in the currently open bottle.

## Payments
Cash can finalize immediately. Eganow electronic payments first create a pending payment. Orders become paid only after verified provider confirmation. Never store PAN or CVV.

## Gift cards / wallets / debt
Balances are ledgers, not editable display values. Redemptions and debt payments are atomic and auditable.

## AI
The AI assistant is read-only. Server code computes trusted aggregates first, then the model explains them. AI cannot directly mutate money, debt, inventory, gift-card or payment records.

## Offline
PWA caches the shell. Production offline POS must use client-generated operation IDs and idempotent synchronization. Server ledger wins conflicts.

## Quality
Vitest tests accounting and inventory rules. Playwright tests desktop and mobile flows.
