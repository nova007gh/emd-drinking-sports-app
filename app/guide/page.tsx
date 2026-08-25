import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EMD User Guide",
  description: "Complete user guide for EMD Drinking Sports Bar & Lounge Management System",
};

export default function GuidePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <style>{GUIDE_CSS}</style>
      </head>
      <body>
        <div className="guide-page">
          <div className="guide-cover">
            <div className="guide-cover-logo">EMD</div>
            <h1>EMD Drinking Sports</h1>
            <h2>Bar &amp; Lounge Management System</h2>
            <p className="guide-cover-subtitle">Complete User Guide</p>
            <p className="guide-cover-version">Version 1.0 — {new Date().toLocaleDateString()}</p>
            <div className="guide-cover-roles">
              <span>Owner</span>
              <span>Manager</span>
              <span>Cashier</span>
              <span>Waiter</span>
              <span>Customer</span>
            </div>
          </div>

          <div className="guide-toc">
            <h2>Table of Contents</h2>
            <ol>
              <li>Getting Started &amp; Login</li>
              <li>Dashboard</li>
              <li>POS / Sales</li>
              <li>Tables Management</li>
              <li>Inventory Management</li>
              <li>Customers</li>
              <li>Debts Management</li>
              <li>Payments</li>
              <li>Gift Cards</li>
              <li>Wallets &amp; Loyalty</li>
              <li>Reports</li>
              <li>AI Assistant</li>
              <li>Event Management</li>
              <li>Expenses</li>
              <li>Staff Management</li>
              <li>Settings</li>
              <li>Customer Portal</li>
              <li>Role Permissions Reference</li>
              <li>Keyboard Shortcuts</li>
              <li>Troubleshooting</li>
            </ol>
          </div>

          <section className="guide-section">
            <h1>1. Getting Started &amp; Login</h1>
            <h3>Demo Mode</h3>
            <p>If Supabase is not configured, the app runs in demo mode. Use these credentials:</p>
            <table className="guide-table">
              <thead><tr><th>Role</th><th>Email</th><th>Password</th></tr></thead>
              <tbody>
                <tr><td>Owner</td><td>owner@emd.com</td><td>owner123</td></tr>
                <tr><td>Manager</td><td>manager@emd.com</td><td>manager123</td></tr>
                <tr><td>Cashier</td><td>cashier@emd.com</td><td>cashier123</td></tr>
                <tr><td>Waiter</td><td>waiter@emd.com</td><td>waiter123</td></tr>
              </tbody>
            </table>
            <h3>Production Mode (Supabase)</h3>
            <p>When Supabase environment variables are set, real authentication is used. Users are created in Supabase Auth and assigned a role (owner, manager, cashier, waiter) in their profile.</p>
            <h3>Logging In</h3>
            <ol>
              <li>Navigate to the app URL in your browser</li>
              <li>You will be redirected to the login page</li>
              <li>Enter your email and password</li>
              <li>Click "Sign In"</li>
              <li>If you forget your password, click "Forgot Password" to reset via email</li>
            </ol>
            <div className="guide-note">
              <strong>Note:</strong> The app works offline once loaded. Sales made offline are queued and synced when connectivity returns. Electronic payments (MoMo/Card) are blocked while offline.
            </div>
          </section>

          <section className="guide-section">
            <h1>2. Dashboard</h1>
            <p>The dashboard is the first page you see after logging in. It provides a real-time overview of your bar operations.</p>
            <h3>Key Metrics</h3>
            <ul>
              <li><strong>Today&apos;s Revenue:</strong> Total sales for the current day</li>
              <li><strong>Today&apos;s Orders:</strong> Number of transactions completed</li>
              <li><strong>Active Tables:</strong> How many tables are currently occupied</li>
              <li><strong>Low Stock Alerts:</strong> Products at or below reorder level</li>
              <li><strong>Outstanding Debts:</strong> Total unpaid customer debts</li>
              <li><strong>Stock Value:</strong> Total value of current inventory at bottle price</li>
            </ul>
            <h3>Charts</h3>
            <ul>
              <li><strong>Sales Trend:</strong> Line chart showing revenue over the past 7 days</li>
              <li><strong>Category Breakdown:</strong> Pie chart of sales by product category</li>
              <li><strong>Top Products:</strong> Bar chart of best-selling items</li>
            </ul>
            <h3>Quick Actions</h3>
            <p>Use the sidebar to navigate to any section. The bottom navigation (mobile) provides quick access to Dashboard, POS, Tables, and more.</p>
          </section>

          <section className="guide-section">
            <h1>3. POS / Sales</h1>
            <p>The POS (Point of Sale) is where you take orders and process payments. This is the most-used screen for cashiers and waiters.</p>
            <h3>Taking an Order</h3>
            <ol>
              <li><strong>Select a table:</strong> Click a table card at the top to assign the order to a table (optional)</li>
              <li><strong>Browse products:</strong> Use the category filters or search bar to find products</li>
              <li><strong>Add to cart:</strong> Click "Bottle" or "Shot / Tot" to add items to the cart</li>
              <li><strong>Adjust quantities:</strong> Use + / - buttons in the cart to change quantities</li>
              <li><strong>Apply discount:</strong> Enter a discount amount if needed (manager+ only)</li>
              <li><strong>Select customer:</strong> Optionally attach a customer for loyalty points</li>
              <li><strong>Checkout:</strong> Click "Checkout" or press F9</li>
            </ol>
            <h3>Payment Methods</h3>
            <table className="guide-table">
              <thead><tr><th>Method</th><th>Description</th><th>Offline?</th></tr></thead>
              <tbody>
                <tr><td>Cash</td><td>Physical cash payment</td><td>Yes</td></tr>
                <tr><td>MoMo</td><td>Mobile money (Eganow gateway)</td><td>No</td></tr>
                <tr><td>Card</td><td>Card payment (Eganow gateway)</td><td>No</td></tr>
                <tr><td>Gift Card</td><td>Redeem from a gift card balance</td><td>Yes</td></tr>
                <tr><td>Wallet</td><td>Deduct from customer&apos;s wallet balance</td><td>Yes</td></tr>
              </tbody>
            </table>
            <h3>Held Orders</h3>
            <p>Press F8 to hold the current order. This saves the cart without checking out, useful when a customer wants to add more later. Resume held orders from the "Held Orders" panel.</p>
            <h3>Keyboard Shortcuts</h3>
            <table className="guide-table">
              <thead><tr><th>Key</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td>/</td><td>Focus search bar</td></tr>
                <tr><td>F7</td><td>Clear cart</td></tr>
                <tr><td>F8</td><td>Hold order</td></tr>
                <tr><td>F9</td><td>Checkout</td></tr>
              </tbody>
            </table>
            <h3>Voiding a Sale</h3>
            <p>Owners and managers can void (cancel) a completed sale. This reverses the stock deduction and refunds the payment. Use this for mistakes or cancelled orders. Voided sales remain in the records for audit.</p>
          </section>

          <section className="guide-section">
            <h1>4. Tables Management</h1>
            <p>Manage your bar&apos;s physical tables — see which are occupied, transfer bills, split bills, and generate QR codes.</p>
            <h3>Table States</h3>
            <ul>
              <li><strong>Available (green):</strong> No active bill, ready for new customers</li>
              <li><strong>Occupied (gold):</strong> Has an active bill</li>
            </ul>
            <h3>Actions</h3>
            <ul>
              <li><strong>Click a table:</strong> Toggle between available and occupied</li>
              <li><strong>Transfer:</strong> Move a bill from one table to another (e.g., customers change seats). Click Transfer, then click the target table.</li>
              <li><strong>Split:</strong> Split specific line items from a bill into a new separate bill. Useful when a group wants to pay separately.</li>
              <li><strong>QR Code:</strong> Click "QR" on any table to generate a QR code. Customers scan it with their phone camera to open the Customer Portal, pre-linked to that table. Print these QR codes and place them on the tables.</li>
            </ul>
            <h3>Customer Activity Feed</h3>
            <p>The bottom of the Tables page shows live customer activity — new portal orders, waiter calls, and chat messages — so staff can respond in real time.</p>
          </section>

          <section className="guide-section">
            <h1>5. Inventory Management</h1>
            <p>Track bottle stock and open-bottle shot inventory. Get alerts when stock is low and record stock movements for audit.</p>
            <h3>Metrics</h3>
            <ul>
              <li><strong>Total Products:</strong> Number of products in the system</li>
              <li><strong>Low Stock:</strong> Products at or below their reorder level</li>
              <li><strong>Healthy Stock:</strong> Products above reorder level</li>
              <li><strong>Stock Value:</strong> Total inventory value at bottle price</li>
              <li><strong>Categories:</strong> Number of distinct product categories</li>
            </ul>
            <h3>Adding a Product</h3>
            <ol>
              <li>Click "Add Product"</li>
              <li>Fill in the form: name, category, bottle price, cost price, stock, reorder level</li>
              <li>For spirits and wine, you can also set shot price, shots per bottle, and remaining shots</li>
              <li>Upload a product image (optional) — if no image is uploaded, a branded SVG visual is used</li>
              <li>Click "Create Product"</li>
            </ol>
            <h3>Editing a Product</h3>
            <p>Click the "Edit" button on any product row to update its details — name, price, stock, image, etc.</p>
            <h3>Quick Stock Adjustments</h3>
            <ul>
              <li><strong>+5:</strong> Adds 5 bottles to stock (records a "purchase" movement)</li>
              <li><strong>-1:</strong> Removes 1 bottle (records an "adjustment out" movement)</li>
              <li><strong>Deactivate / Activate:</strong> Toggle whether a product appears in the POS</li>
            </ul>
            <h3>Movement History</h3>
            <p>Click "Movement History" to see the last 20 stock movements — purchases, sales, adjustments, and waste. Each movement records the product, type, quantity change, reason, and timestamp.</p>
            <h3>Stock Movements Types</h3>
            <table className="guide-table">
              <thead><tr><th>Type</th><th>When it happens</th></tr></thead>
              <tbody>
                <tr><td>Purchase</td><td>Stock added via +5 button</td></tr>
                <tr><td>Sale (bottle)</td><td>A bottle is sold via POS checkout</td></tr>
                <tr><td>Open for shots</td><td>A new bottle is opened for shot sales</td></tr>
                <tr><td>Adjustment in</td><td>Manual stock increase</td></tr>
                <tr><td>Adjustment out</td><td>Manual stock decrease or -1 button</td></tr>
                <tr><td>Waste</td><td>Recorded breakage or spoilage</td></tr>
              </tbody>
            </table>
          </section>

          <section className="guide-section">
            <h1>6. Customers</h1>
            <p>Manage customer profiles, track their spending, loyalty points, wallet balances, and debts.</p>
            <h3>Customer Profile</h3>
            <p>Each customer record includes:</p>
            <ul>
              <li>Name and phone number</li>
              <li>Total spent (lifetime)</li>
              <li>Current debt outstanding</li>
              <li>Loyalty points (1 point per GHS 10 spent)</li>
              <li>Wallet balance (prepaid credit)</li>
              <li>Visit count and last purchase date</li>
            </ul>
            <h3>Adding a Customer</h3>
            <p>Click "Add Customer" and enter their name and phone number. New customers start with zero balance, debt, and points.</p>
            <h3>Loyalty Points</h3>
            <p>Customers earn 1 loyalty point for every GHS 10 spent. Points can be redeemed for discounts. Points are awarded automatically at checkout when a customer is attached to the sale.</p>
          </section>

          <section className="guide-section">
            <h1>7. Debts Management</h1>
            <p>Track customers who owe money and record payments against their debts.</p>
            <h3>Creating a Debt</h3>
            <ol>
              <li>Select a customer</li>
              <li>Enter the debt amount and an optional note</li>
              <li>The debt is recorded with the current date</li>
            </ol>
            <h3>Recording a Payment</h3>
            <p>Click "Pay" on a debt to record a partial or full payment. The system prevents overpayment — you cannot pay more than the outstanding amount. Each payment records the method (cash, MoMo, card) and timestamp.</p>
            <div className="guide-note">
              <strong>Important:</strong> Debts can never go negative. The system enforces this at the database level in production mode.
            </div>
            <h3>Debt Aging</h3>
            <p>The Debts page shows aging buckets (Current, 1-30 days, 31-60 days, 60+ days) so you can prioritize collection efforts.</p>
          </section>

          <section className="guide-section">
            <h1>8. Payments</h1>
            <p>View and manage all payment transactions processed through the system.</p>
            <h3>Payment Status</h3>
            <ul>
              <li><strong>Successful:</strong> Payment completed and funds confirmed</li>
              <li><strong>Pending:</strong> Payment initiated but not yet confirmed (MoMo/Card)</li>
              <li><strong>Failed:</strong> Payment was declined or errored</li>
              <li><strong>Reversed:</strong> Payment was reversed (e.g., due to a voided sale)</li>
            </ul>
            <h3>Electronic Payments (MoMo / Card)</h3>
            <p>Mobile money and card payments are processed through the Eganow payment gateway. These require an internet connection and will be blocked if offline. The payment state machine ensures idempotency — a payment key can only be processed once, preventing double-charges.</p>
          </section>

          <section className="guide-section">
            <h1>9. Gift Cards</h1>
            <p>Create and manage gift cards that customers can use for payment.</p>
            <h3>Creating a Gift Card</h3>
            <ol>
              <li>Click "Create Gift Card"</li>
              <li>Enter the amount (the initial balance)</li>
              <li>A unique code is generated (format: EMD-XXXX-XXXX)</li>
              <li>Gift cards are valid for 90 days</li>
            </ol>
            <h3>Redeeming a Gift Card</h3>
            <p>At checkout, select "Gift Card" as the payment method and enter the code. The system checks:</p>
            <ul>
              <li>Card exists and is active</li>
              <li>Card has not expired</li>
              <li>Card has sufficient balance</li>
            </ul>
            <p>Partial redemption is supported — the remaining balance stays on the card. Fully redeemed cards are marked as "redeemed".</p>
            <h3>Gift Card Statuses</h3>
            <table className="guide-table">
              <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
              <tbody>
                <tr><td>Active</td><td>Available for use, has balance</td></tr>
                <tr><td>Redeemed</td><td>Balance fully used</td></tr>
                <tr><td>Disabled</td><td>Manually deactivated by staff</td></tr>
                <tr><td>Expired</td><td>Past the expiry date</td></tr>
              </tbody>
            </table>
          </section>

          <section className="guide-section">
            <h1>10. Wallets &amp; Loyalty</h1>
            <p>Manage customer prepaid wallets and loyalty point balances.</p>
            <h3>Wallet</h3>
            <p>Customers can prepay credit into their wallet. At checkout, "Wallet" can be selected as a payment method. The wallet balance is deducted automatically. Wallets cannot be overdrawn.</p>
            <h3>Topping Up a Wallet</h3>
            <ol>
              <li>Select a customer</li>
              <li>Click "Top Up"</li>
              <li>Enter the amount</li>
              <li>The balance is updated immediately</li>
            </ol>
            <h3>Loyalty Points</h3>
            <p>Points are earned automatically at checkout (1 point per GHS 10). Points can be spent via the "Spend Points" action. Points cannot go negative.</p>
          </section>

          <section className="guide-section">
            <h1>11. Reports</h1>
            <p>View detailed business reports and analytics. Available to owner, manager, and cashier roles.</p>
            <h3>Available Reports</h3>
            <ul>
              <li><strong>Sales Summary:</strong> Daily, weekly, and monthly revenue</li>
              <li><strong>Top Products:</strong> Best-selling items by quantity and revenue</li>
              <li><strong>Category Breakdown:</strong> Sales distribution across product categories</li>
              <li><strong>Customer Ranking:</strong> Top customers by total spend</li>
              <li><strong>Stock Valuation:</strong> Current inventory value at cost and retail</li>
              <li><strong>Profit Estimation:</strong> Estimated profit based on cost vs. selling price</li>
              <li><strong>Debt Aging:</strong> Outstanding debts grouped by age</li>
            </ul>
          </section>

          <section className="guide-section">
            <h1>12. AI Assistant</h1>
            <p>Ask natural language questions about your business and get AI-powered insights.</p>
            <h3>Example Questions</h3>
            <ul>
              <li>&quot;What were my best-selling products last week?&quot;</li>
              <li>&quot;Which customers have the highest debts?&quot;</li>
              <li>&quot;How is my stock looking for beer?&quot;</li>
              <li>&quot;What&apos;s my profit margin this month?&quot;</li>
              <li>&quot;Which tables generate the most revenue?&quot;</li>
            </ul>
            <div className="guide-note">
              <strong>Setup:</strong> The AI Assistant requires an OpenAI API key configured in environment variables. Without it, the assistant provides pre-computed insights based on your data.
            </div>
          </section>

          <section className="guide-section">
            <h1>13. Event Management</h1>
            <p>Schedule and promote events at your bar — sports matches, live music, nightclub nights, game tournaments, and special events.</p>
            <h3>Event Categories</h3>
            <table className="guide-table">
              <thead><tr><th>Category</th><th>Examples</th></tr></thead>
              <tbody>
                <tr><td>Sports</td><td>Football matches, boxing, UFC</td></tr>
                <tr><td>Music</td><td>Live bands, DJ nights, concerts</td></tr>
                <tr><td>Nightclub</td><td>Club nights, dance parties</td></tr>
                <tr><td>Games</td><td>Trivia, bingo, gaming tournaments</td></tr>
                <tr><td>Special</td><td>Holidays, promotions, private events</td></tr>
              </tbody>
            </table>
            <h3>Creating an Event</h3>
            <ol>
              <li>Click "Add Event"</li>
              <li>Select category, enter title, date/time, and description</li>
              <li>For sports: enter home team and away team</li>
              <li>For other categories: enter host/performer name</li>
              <li>Set cover charge (optional) and capacity</li>
              <li>Mark as "Featured" to highlight on the dashboard and portal</li>
            </ol>
            <h3>Table Reservations</h3>
            <p>For each event, you can reserve specific tables. Reserved tables are marked on the Tables page so staff knows they&apos;re held for the event.</p>
            <h3>Notifications</h3>
            <p>The system generates notifications for upcoming events, reminders, and capacity warnings. These appear in the notification bell at the top of the app.</p>
          </section>

          <section className="guide-section">
            <h1>14. Expenses</h1>
            <p>Record and track business expenses to calculate net profit.</p>
            <h3>Recording an Expense</h3>
            <ol>
              <li>Click "Add Expense"</li>
              <li>Enter a title (e.g., "Electricity bill", "Stock purchase")</li>
              <li>Enter the amount in GHS</li>
              <li>Select a category (utilities, stock, maintenance, salaries, other)</li>
            </ol>
            <h3>Expense Categories</h3>
            <ul>
              <li>Utilities — electricity, water, internet</li>
              <li>Stock — inventory purchases</li>
              <li>Maintenance — repairs, equipment</li>
              <li>Salaries — staff payments</li>
              <li>Other — miscellaneous expenses</li>
            </ul>
          </section>

          <section className="guide-section">
            <h1>15. Staff Management</h1>
            <p>View and manage staff members and their performance metrics. Owner only.</p>
            <h3>Staff Information</h3>
            <p>Each staff member record shows:</p>
            <ul>
              <li>Name, role, and phone number</li>
              <li>Active status</li>
              <li>Total sales count</li>
              <li>Total orders handled</li>
            </ul>
            <h3>Roles</h3>
            <table className="guide-table">
              <thead><tr><th>Role</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td>Owner</td><td>Full access to all features and settings</td></tr>
                <tr><td>Manager</td><td>Operations management, no staff/settings control</td></tr>
                <tr><td>Cashier</td><td>Sales, tables, customers, debts, reports</td></tr>
                <tr><td>Waiter</td><td>Sales, tables, customers only</td></tr>
              </tbody>
            </table>
          </section>

          <section className="guide-section">
            <h1>16. Settings</h1>
            <p>Configure business settings and integrations. Owner only.</p>
            <h3>Business Settings</h3>
            <ul>
              <li>Business name, currency, location</li>
              <li>Receipt footer text</li>
            </ul>
            <h3>Customer Portal</h3>
            <ul>
              <li><strong>Bar Status Toggle:</strong> Open/Closed — shows customers if the bar is currently open</li>
              <li><strong>Portal URL:</strong> The link to share with customers (your-domain/portal)</li>
            </ul>
            <h3>Integrations</h3>
            <ul>
              <li><strong>Eganow:</strong> MoMo + card payment gateway</li>
              <li><strong>AI Assistant:</strong> OpenAI Responses API</li>
              <li><strong>Supabase:</strong> Postgres database + authentication</li>
            </ul>
          </section>

          <section className="guide-section">
            <h1>17. Customer Portal</h1>
            <p>The Customer Portal is a separate web page that customers access on their phones to browse the menu, place orders, call a waiter, and view their wallet/loyalty.</p>
            <h3>How Customers Access the Portal</h3>
            <ol>
              <li><strong>QR Code:</strong> Each table has a QR code (generate from Tables page → QR button). Customers scan it with their phone camera.</li>
              <li><strong>Direct URL:</strong> Customers can visit your-domain/portal directly</li>
              <li><strong>Table link:</strong> The QR code links to /portal?table=tX, which pre-selects the table</li>
            </ol>
            <h3>Customer Check-In</h3>
            <p>When a customer first opens the portal, they enter their phone number (and optionally their name). If they exist in the system, their profile is loaded. If not, a new customer record is created automatically. Their session is saved on their phone for future visits.</p>
            <h3>Portal Features</h3>
            <ul>
              <li><strong>Home:</strong> Bar status, featured events, quick actions</li>
              <li><strong>Events:</strong> Browse upcoming events and book a table</li>
              <li><strong>Menu:</strong> Browse all active products with images, add to cart, place order to a table</li>
              <li><strong>Tables:</strong> See available/occupied tables, select a table</li>
              <li><strong>My Orders:</strong> View order history and status</li>
              <li><strong>Waiter:</strong> Call a waiter to your table or send a chat message</li>
              <li><strong>Wallet:</strong> View wallet balance and loyalty points</li>
            </ul>
            <h3>Order Flow</h3>
            <ol>
              <li>Customer browses menu and adds items to cart</li>
              <li>Selects a table (from QR code or manually)</li>
              <li>Places the order — stock is drawn immediately</li>
              <li>Staff sees the order in the Customer Activity feed on the Tables page</li>
              <li>When the customer pays (cash to waiter, wallet, etc.), staff marks the order as "paid"</li>
              <li>Revenue is recognized and loyalty points are awarded</li>
            </ol>
          </section>

          <section className="guide-section">
            <h1>18. Role Permissions Reference</h1>
            <p>Complete permission matrix showing what each role can do.</p>
            <table className="guide-table guide-permissions">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Owner</th>
                  <th>Manager</th>
                  <th>Cashier</th>
                  <th>Waiter</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Sell (POS)</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td></tr>
                <tr><td>Manage Tables</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td></tr>
                <tr><td>Manage Customers</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td></tr>
                <tr><td>Manage Debts</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td></tr>
                <tr><td>Manage Inventory</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td></tr>
                <tr><td>Manage Expenses</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td></tr>
                <tr><td>Manage Events</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td></tr>
                <tr><td>View Reports</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td></tr>
                <tr><td>Manage Staff</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td className="no">No</td></tr>
                <tr><td>Manage Settings</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td className="no">No</td></tr>
                <tr><td>Void Sales</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td></tr>
              </tbody>
            </table>
          </section>

          <section className="guide-section">
            <h1>19. Keyboard Shortcuts</h1>
            <p>Speed up your workflow with these keyboard shortcuts (available on the POS page):</p>
            <table className="guide-table">
              <thead><tr><th>Shortcut</th><th>Action</th><th>Where</th></tr></thead>
              <tbody>
                <tr><td>/</td><td>Focus the product search bar</td><td>POS</td></tr>
                <tr><td>?</td><td>Focus the product search bar</td><td>POS</td></tr>
                <tr><td>F7</td><td>Clear the current cart</td><td>POS</td></tr>
                <tr><td>F8</td><td>Hold the current order</td><td>POS</td></tr>
                <tr><td>F9</td><td>Open checkout dialog</td><td>POS</td></tr>
              </tbody>
            </table>
          </section>

          <section className="guide-section">
            <h1>20. Troubleshooting</h1>
            <h3>Can&apos;t Log In</h3>
            <ul>
              <li>Check your email and password are correct</li>
              <li>If in demo mode, use the demo credentials (see Section 1)</li>
              <li>If in production mode, ensure Supabase environment variables are set</li>
              <li>Use "Forgot Password" to reset via email</li>
            </ul>
            <h3>Redirected to Login After Logging In</h3>
            <p>This is usually a cookie issue. Try clearing your browser cookies for the site and logging in again.</p>
            <h3>Offline Mode</h3>
            <p>If you see an "Offline" indicator, the app is working without internet. You can still make cash sales and wallet/gift card payments. MoMo and card payments are blocked. Your sales will sync automatically when connectivity returns.</p>
            <h3>Product Image Not Showing</h3>
            <p>If a product image fails to load, the system automatically falls back to a branded SVG visual. This is normal — some product images may be unavailable.</p>
            <h3>Payment Stuck in Pending</h3>
            <p>MoMo and card payments may stay in "pending" while the gateway processes them. If a payment stays pending too long, check your Eganow gateway configuration and internet connection.</p>
            <h3>Customer Portal Not Loading</h3>
            <p>Ensure the /portal path is accessible. In production, it should be public (no auth required). If you see a login redirect, check the middleware configuration.</p>
            <h3>Stock Count Is Wrong</h3>
            <p>Check the Movement History on the Inventory page to trace all stock changes. Every addition, sale, and adjustment is recorded with a timestamp and reason.</p>
          </section>

          <div className="guide-footer">
            <p>EMD Drinking Sports — Bar &amp; Lounge Management System</p>
            <p>User Guide v1.0 — Generated {new Date().toLocaleDateString()}</p>
            <p>For support, contact your system administrator.</p>
          </div>
        </div>
      </body>
    </html>
  );
}

const GUIDE_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; line-height: 1.6; }
.guide-page { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
.guide-cover { text-align: center; padding: 60px 20px; border-bottom: 3px solid #d4af37; margin-bottom: 40px; page-break-after: always; }
.guide-cover-logo { display: inline-block; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; background: #d4af37; color: #1a1a1a; font-size: 28px; font-weight: 700; margin-bottom: 20px; }
.guide-cover h1 { font-size: 32px; color: #1a1a1a; margin-bottom: 4px; }
.guide-cover h2 { font-size: 18px; color: #666; font-weight: 400; margin-bottom: 20px; }
.guide-cover-subtitle { font-size: 16px; color: #d4af37; font-weight: 600; margin-bottom: 8px; }
.guide-cover-version { font-size: 12px; color: #999; }
.guide-cover-roles { margin-top: 24px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.guide-cover-roles span { background: #f5f5f5; border: 1px solid #ddd; border-radius: 16px; padding: 5px 16px; font-size: 13px; color: #555; }
.guide-toc { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 24px; margin-bottom: 40px; page-break-after: always; }
.guide-toc h2 { font-size: 20px; margin-bottom: 12px; color: #1a1a1a; }
.guide-toc ol { padding-left: 20px; }
.guide-toc li { padding: 4px 0; font-size: 14px; }
.guide-section { margin-bottom: 40px; page-break-inside: avoid; }
.guide-section h1 { font-size: 24px; color: #1a1a1a; border-bottom: 2px solid #d4af37; padding-bottom: 8px; margin-bottom: 16px; }
.guide-section h3 { font-size: 16px; color: #333; margin: 16px 0 8px; }
.guide-section p { margin-bottom: 10px; font-size: 14px; }
.guide-section ul, .guide-section ol { padding-left: 20px; margin-bottom: 12px; }
.guide-section li { font-size: 14px; padding: 3px 0; }
.guide-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.guide-table th { background: #1a1a1a; color: #d4af37; padding: 8px 12px; text-align: left; font-weight: 600; }
.guide-table td { border: 1px solid #ddd; padding: 8px 12px; }
.guide-table tr:nth-child(even) td { background: #f9f9f9; }
.guide-permissions .yes { color: #2a8; font-weight: 600; text-align: center; }
.guide-permissions .no { color: #c44; text-align: center; }
.guide-note { background: #fffbe6; border: 1px solid #f0d860; border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-size: 13px; }
.guide-note strong { color: #8a6d00; }
.guide-footer { text-align: center; padding: 24px; border-top: 2px solid #d4af37; margin-top: 40px; font-size: 12px; color: #999; }
.guide-footer p { margin: 2px 0; }
@media print {
  body { font-size: 11px; }
  .guide-section { page-break-inside: avoid; }
  .guide-cover { page-break-after: always; }
  .guide-toc { page-break-after: always; }
}
`;
