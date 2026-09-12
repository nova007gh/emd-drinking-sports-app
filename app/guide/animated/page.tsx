"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    title: "1. Sign In",
    desc: "Open the app and sign in with your role. Demo: owner@emd.com / owner123. Waiter, cashier, and manager have their own demo emails.",
    mock: "login",
  },
  {
    title: "2. Dashboard Overview",
    desc: "The dashboard shows today's revenue, active tables, low stock, debts, and charts. Use the sidebar to jump to any section.",
    mock: "dashboard",
  },
  {
    title: "3. POS / Sales",
    desc: "Select a table, pick a category, click Bottle or Shot to add products, then press F9 or click PAY NOW to checkout.",
    mock: "pos",
  },
  {
    title: "4. Tables",
    desc: "Click a table to expand. Add people, add orders per person, transfer, split, or close the table. QR codes open the Customer Portal.",
    mock: "tables",
  },
  {
    title: "5. Customer Portal",
    desc: "Customers scan the table QR, browse the menu, and order. Staff see the order on the Tables page and can mark it paid.",
    mock: "portal",
  },
  {
    title: "6. Inventory & Customers",
    desc: "Add products, adjust stock, and view movement history. Track customer spending, debts, wallets, and loyalty points.",
    mock: "inventory",
  },
];

export default function AnimatedGuidePage() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused]);

  const active = steps[step];

  return (
    <div className="animated-guide-page">
      <style>{ANIMATED_CSS}</style>
      <div className="ag-header">
        <div className="ag-logo">EMD</div>
        <h1>Quick Start Animation</h1>
        <p>Auto-playing walkthrough of the EMD Drinking Sports system</p>
      </div>

      <div className="ag-stage">
        <div className="ag-mockup" key={active.mock}>
          {active.mock === "login" && <LoginMockup />}
          {active.mock === "dashboard" && <DashboardMockup />}
          {active.mock === "pos" && <PosMockup />}
          {active.mock === "tables" && <TablesMockup />}
          {active.mock === "portal" && <PortalMockup />}
          {active.mock === "inventory" && <InventoryMockup />}
        </div>

        <div className="ag-step-info">
          <h2>{active.title}</h2>
          <p>{active.desc}</p>
        </div>
      </div>

      <div className="ag-controls">
        <button onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>
        <button onClick={() => setStep((s) => (s - 1 + steps.length) % steps.length)}>Previous</button>
        <button onClick={() => setStep((s) => (s + 1) % steps.length)}>Next</button>
      </div>

      <div className="ag-dots">
        {steps.map((_, i) => (
          <button key={i} className={i === step ? "active" : ""} onClick={() => setStep(i)} />
        ))}
      </div>

      <div className="ag-link">
        <a href="/guide" className="ag-back-link">Read the full written guide →</a>
      </div>
    </div>
  );
}

function LoginMockup() {
  return (
    <div className="mockup-card">
      <h3>Sign In</h3>
      <div className="mockup-field">Email address</div>
      <div className="mockup-field">••••••••</div>
      <div className="mockup-button primary">Sign In</div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="mockup-card">
      <h3>Dashboard</h3>
      <div className="mockup-metrics">
        <div className="mockup-metric"><span>Revenue</span><b>GHS 1,245</b></div>
        <div className="mockup-metric"><span>Tables</span><b>4 / 12</b></div>
        <div className="mockup-metric"><span>Stock</span><b>3 low</b></div>
      </div>
      <div className="mockup-chart" />
    </div>
  );
}

function PosMockup() {
  return (
    <div className="mockup-card pos">
      <div className="mockup-pos-top">
        <div className="mockup-pos-cashier">
          <div className="mockup-avatar">K</div>
          <div><b>Kojo</b><small>waiter</small></div>
        </div>
      </div>
      <div className="mockup-pos-cats">
        <span className="active">All</span>
        <span>Beer</span>
        <span>Spirits</span>
      </div>
      <div className="mockup-pos-products">
        <div className="mockup-product"><b>Club Beer</b><span>GHS 18.00</span></div>
        <div className="mockup-product"><b>Guinness</b><span>GHS 20.00</span></div>
        <div className="mockup-product active"><b>Heineken</b><span>GHS 22.00</span></div>
      </div>
      <div className="mockup-order">
        <b>Current Order</b>
        <span>Heineken ×1 — GHS 22.00</span>
      </div>
      <div className="mockup-button primary">PAY NOW</div>
    </div>
  );
}

function TablesMockup() {
  return (
    <div className="mockup-card tables">
      <div className="mockup-table-grid">
        <div className="mockup-table occupied">T1 <span>Occupied</span><b>GHS 120</b></div>
        <div className="mockup-table available">T2 <span>Available</span><b>GHS 0</b></div>
        <div className="mockup-table occupied">T3 <span>Occupied</span><b>GHS 80</b></div>
        <div className="mockup-table occupied">T6 <span>Occupied</span><b>GHS 60</b></div>
      </div>
      <div className="mockup-detail">
        <b>Table 1 — Individual Tabs</b>
        <div className="mockup-seat"><span>Person 1</span><b>GHS 38</b></div>
        <div className="mockup-seat"><span>Person 2</span><b>GHS 22</b></div>
        <div className="mockup-button">Close Table</div>
      </div>
    </div>
  );
}

function PortalMockup() {
  return (
    <div className="mockup-card portal">
      <h3>Customer Portal</h3>
      <div className="mockup-menu">
        <div className="mockup-menu-item">Club Beer <span>GHS 18</span></div>
        <div className="mockup-menu-item active">Guinness <span>GHS 20</span></div>
        <div className="mockup-menu-item">Heineken <span>GHS 22</span></div>
      </div>
      <div className="mockup-button primary">Add to Order</div>
      <p className="mockup-note">Customer scans QR on the table to open this portal.</p>
    </div>
  );
}

function InventoryMockup() {
  return (
    <div className="mockup-card inventory">
      <h3>Inventory</h3>
      <div className="mockup-stock-row low"><span>Club Beer</span><b>5 left</b></div>
      <div className="mockup-stock-row ok"><span>Guinness</span><b>32 left</b></div>
      <div className="mockup-stock-row ok"><span>Heineken</span><b>18 left</b></div>
      <div className="mockup-button">Add Product</div>
    </div>
  );
}

const ANIMATED_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
.animated-guide-page { min-height: 100vh; background: #0a0a0a; color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
.ag-header { text-align: center; margin-bottom: 30px; animation: fadeIn 1s ease both; }
.ag-logo { width: 70px; height: 70px; border-radius: 50%; background: #d4af37; color: #0a0a0a; display: grid; place-items: center; font-size: 22px; font-weight: 800; margin: 0 auto 16px; }
.ag-header h1 { font-size: 28px; margin-bottom: 6px; }
.ag-header p { color: #a0a0a0; font-size: 14px; }
.ag-stage { display: grid; grid-template-columns: minmax(280px, 360px) minmax(280px, 400px); gap: 30px; align-items: center; max-width: 900px; width: 100%; animation: slideUp 0.8s ease 0.2s both; }
@media (max-width: 720px) { .ag-stage { grid-template-columns: 1fr; } }
.ag-mockup { background: #141414; border: 1px solid #2a2a2a; border-radius: 20px; padding: 24px; min-height: 360px; display: flex; flex-direction: column; justify-content: center; }
.ag-step-info { padding: 20px; }
.ag-step-info h2 { font-size: 24px; color: #d4af37; margin-bottom: 12px; }
.ag-step-info p { font-size: 15px; line-height: 1.6; color: #e0e0e0; }
.ag-controls { display: flex; gap: 10px; margin-top: 28px; }
.ag-controls button, .ag-dots button { background: #1a1a1a; color: #f7f7f7; border: 1px solid #444; border-radius: 10px; padding: 10px 18px; cursor: pointer; font-weight: 600; }
.ag-controls button:hover, .ag-dots button:hover { background: #2a2a2a; }
.ag-dots { display: flex; gap: 8px; margin-top: 18px; }
.ag-dots button { width: 12px; height: 12px; border-radius: 50%; padding: 0; }
.ag-dots button.active { background: #d4af37; border-color: #d4af37; }
.ag-link { margin-top: 24px; }
.ag-back-link { color: #d4af37; text-decoration: none; font-weight: 600; }
.ag-back-link:hover { text-decoration: underline; }

.mockup-card { background: #1c1c1c; border: 1px solid #333; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 12px; animation: popIn 0.5s ease both; }
.mockup-card h3 { font-size: 16px; color: #d4af37; margin-bottom: 6px; }
.mockup-field { background: #0e0e0e; border: 1px solid #333; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #888; }
.mockup-button { background: #2a2a2a; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 700; }
.mockup-button.primary { background: #d4af37; color: #0a0a0a; }
.mockup-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.mockup-metric { background: #0e0e0e; border-radius: 8px; padding: 12px; text-align: center; }
.mockup-metric span { display: block; font-size: 10px; color: #888; }
.mockup-metric b { color: #d4af37; font-size: 16px; }
.mockup-chart { height: 80px; background: linear-gradient(90deg, #d4af37 0%, #d4af37 30%, transparent 30%); border-radius: 8px; opacity: 0.3; }
.mockup-pos-top { display: flex; align-items: center; gap: 10px; background: #0e0e0e; border-radius: 10px; padding: 12px; }
.mockup-pos-cashier { display: flex; align-items: center; gap: 10px; }
.mockup-avatar { width: 36px; height: 36px; border-radius: 50%; background: #d4af37; color: #0a0a0a; display: grid; place-items: center; font-weight: 800; }
.mockup-pos-cashier b { display: block; font-size: 13px; }
.mockup-pos-cashier small { color: #888; font-size: 11px; }
.mockup-pos-cats { display: flex; gap: 8px; }
.mockup-pos-cats span { background: #0e0e0e; border: 1px solid #333; border-radius: 8px; padding: 6px 12px; font-size: 11px; }
.mockup-pos-cats span.active { background: #d4af37; color: #0a0a0a; border-color: #d4af37; }
.mockup-pos-products { display: flex; flex-direction: column; gap: 8px; }
.mockup-product { display: flex; justify-content: space-between; background: #0e0e0e; border: 1px solid #333; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
.mockup-product.active { border-color: #d4af37; }
.mockup-product b { color: #fff; }
.mockup-product span { color: #d4af37; font-weight: 700; }
.mockup-order { background: #0e0e0e; border-radius: 8px; padding: 12px; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
.mockup-table-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.mockup-table { border-radius: 10px; padding: 12px; font-size: 11px; display: flex; flex-direction: column; gap: 4px; }
.mockup-table.occupied { background: #2a1510; border: 1px solid #5c221c; color: #ff6b5f; }
.mockup-table.available { background: #0a1a10; border: 1px solid #174626; color: #48df78; }
.mockup-table b { font-size: 15px; color: #fff; }
.mockup-detail { background: #0e0e0e; border-radius: 10px; padding: 14px; margin-top: 8px; }
.mockup-detail b { display: block; margin-bottom: 10px; font-size: 13px; color: #d4af37; }
.mockup-seat { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid #2a2a2a; }
.mockup-menu { display: flex; flex-direction: column; gap: 8px; }
.mockup-menu-item { display: flex; justify-content: space-between; background: #0e0e0e; border: 1px solid #333; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
.mockup-menu-item.active { border-color: #d4af37; }
.mockup-note { color: #888; font-size: 11px; text-align: center; }
.mockup-stock-row { display: flex; justify-content: space-between; background: #0e0e0e; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
.mockup-stock-row.low b { color: #ff6b5f; }
.mockup-stock-row.ok b { color: #48df78; }

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
@keyframes popIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
`;
