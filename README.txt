EMD DRINKING SPORTS WEB APP

STACK
- Next.js 16.3 App Router
- React 19.2
- TypeScript
- Zustand local-first state
- Recharts analytics
- Server-side Eganow adapter routes
- Server-side OpenAI Responses API route

START
1. Install Node.js 20.9+.
2. Copy .env.example to .env.local.
3. npm install
4. npm run dev
5. Open http://localhost:3000

CURRENT FUNCTIONAL FEATURES
- Responsive desktop, tablet and mobile UI
- Dashboard
- Bottle sales
- Shot / tot sales
- Stock decrementing logic
- Tables
- Customers
- Debts
- Payments dashboard
- Gift cards
- Loyalty view
- Reports
- Local AI business analytics
- Optional OpenAI AI assistant
- Football events
- Expenses
- Staff
- Settings
- Local persistence using browser storage
- Configurable Eganow server adapter

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
The UI and business logic work locally.
For multi-device production sync, replace/persist Zustand mutations through Supabase Postgres and Supabase Auth.
