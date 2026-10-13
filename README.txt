EMD DRINKING SPORTS WEB APP

STACK
- Next.js 16.3 App Router
- React 19.2
- TypeScript (strict)
- Supabase Postgres + Auth (production) / Zustand local-first (demo)
- Recharts analytics
- Server-side Eganow adapter routes
- Server-side OpenAI Responses API route
- PWA: service worker + IndexedDB offline queue

START
1. Install Node.js 20.9+.
2. Copy .env.example to .env.local.
3. npm install
4. npm run dev
5. Open http://localhost:3000

DEMO MODE
The app runs in demo mode whenever the Supabase variables are absent. All
screens work and use seed data stored in browser storage, so each browser
keeps its own data.

Sign in with any of these (the login screen also has one-tap buttons):

  admin@emd.com        / admin123        full access
  owner@emd.com        / owner123        full access
  manager@emd.com      / manager123      no Settings
  coordinator@emd.com  / coordinator123  events and bookings
  cashier@emd.com      / cashier123      POS and payments
  waiter@emd.com       / waiter123       tables and orders

Set NEXT_PUBLIC_FORCE_DEMO=true to keep a device in demo mode even when
Supabase is configured — useful for a training or display tablet.

CURRENT FUNCTIONAL FEATURES
- Responsive desktop, tablet and mobile UI
- Dashboard with today's sales and low-stock alerts
- POS / Sales with bottle and shot (tot) pricing
- Stock decrementing logic, reorder levels, stock movement history
- Tables, open tabs, seat tabs, bill transfer and split bill
- Customers, debts and aging, payment reconciliation
- Gift cards and customer loyalty / wallets
- Reports and business analytics
- Local deterministic AI analytics, plus optional OpenAI assistant
- Football events, table reservations, attendee tracking
- Expenses, staff, settings
- Role-based access control (6 roles)
- Customer portal with QR codes
- Offline-first queue for poor-connectivity floors
- Receipt printing
- Configurable Eganow server adapter

API ROUTE SECURITY
All API routes require an authenticated session when Supabase is configured.
In demo mode there are no accounts, so routes are open by design.

- /api/ai caps the question and snapshot size so a caller cannot use the route
  to run up OpenAI spend, and never returns the upstream error body.
- /api/payments/eganow/* only forward an allowlist of fields to the merchant
  API, so a caller cannot inject unsupported fields or manipulate amounts.

EGANOW
Eganow's public website confirms API-based payment solutions, MTN/Telecel/AirtelTigo mobile money and international cards.
Their public website does not publish the merchant endpoint schema used by this project.
Obtain merchant API credentials/documentation from Eganow, then configure:
EGANOW_API_BASE_URL
EGANOW_API_KEY
EGANOW_INITIATE_PATH
EGANOW_VERIFY_PATH

Do not expose EGANOW_API_KEY in NEXT_PUBLIC variables.

OPENAI
Configure OPENAI_API_KEY and OPENAI_MODEL server-side.
If not configured, the AI screen still provides local deterministic business insights for common bar questions.

PRODUCTION DATABASE
Supabase support is already built in — there is nothing to replace.

Adding these two variables switches the app out of demo mode and onto the
repository layer:

  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Then apply the SQL migrations in supabase/migrations/ (in filename order) to
your project. They create the schema, row-level security policies, the storage
buckets for avatars and product images, and the demo users.

Money is stored as integer pesewas in the database; the repository mappers
convert to and from Ghanaian cedis. Accounting rules that must never be
violated are enforced inside SQL functions rather than the client:

  checkout_order()     atomic sale, stock decrement, payment
  apply_debt_payment() debt payment that cannot overpay
  redeem_gift_card()   gift card redemption with expiry and balance checks
  transfer_table()     move an order between tables
  split_bill()         split line items into a new order

Also set SUPABASE_SERVICE_ROLE_KEY for avatar uploads, which uses the service
role to bypass RLS. Keep it server-side only — never expose it as a
NEXT_PUBLIC variable.

VERIFY
npm run verify runs typecheck, lint, unit tests and a production build.
Use npx playwright test for the end-to-end suite (run
npx playwright install once first).
