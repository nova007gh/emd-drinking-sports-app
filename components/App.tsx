"use client";

import {
  BarChart3, Beer, Bot, Boxes, CircleDollarSign, CreditCard, Crown, Gift,
  Home, LayoutGrid, Menu, Plus, ReceiptText, Search, Settings, ShieldCheck, ShoppingCart,
  Smartphone, Trophy, Users, WalletCards, X, Minus, AlertTriangle, ArrowUpRight,
  Pause, Play, Trash2, Printer, ArrowRightLeft, TrendingUp, TrendingDown,
  Package, CheckCircle2, Clock, Wifi, WifiOff, LogOut, Loader2, Scissors, Bell,
  Banknote, Send, Music, Gamepad2, Moon, Calendar, Star, Pencil, PartyPopper
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { useAppStore } from "@/lib/store";
import { businessInsights, debtAging, estimatedProfitCalc, customerRanking, stockValuation, weeklySalesSeries, dayOverDayChange } from "@/lib/analytics";
import { useAuth } from "@/lib/auth/context";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { buildReceipt, browserPrinter } from "@/lib/receipt";
import { useSyncIntegration } from "@/lib/hooks/useSyncIntegration";
import { useInstallPrompt } from "@/lib/hooks/useInstallPrompt";
import type { PaymentMethod, ProductCategory, SaleRecord, AppRole, Product, GiftCardStatus, BarEvent, EventCategory } from "@/lib/types";
import type { Permission } from "@/lib/auth/roles";
import { QRCodeSVG } from "qrcode.react";

type Page =
  | "Dashboard" | "POS / Sales" | "Tables" | "Inventory" | "Customers" | "Debts"
  | "Payments" | "Gift Cards" | "Wallets & Loyalty" | "Reports" | "AI Assistant"
  | "Event Management" | "Expenses" | "Staff" | "Settings";

type IconType = typeof Home;

const nav: Array<{ label: Page; icon: IconType }> = [
  { label: "Dashboard", icon: Home },
  { label: "POS / Sales", icon: ShoppingCart },
  { label: "Tables", icon: LayoutGrid },
  { label: "Inventory", icon: Boxes },
  { label: "Customers", icon: Users },
  { label: "Debts", icon: ReceiptText },
  { label: "Payments", icon: CreditCard },
  { label: "Gift Cards", icon: Gift },
  { label: "Wallets & Loyalty", icon: WalletCards },
  { label: "Reports", icon: BarChart3 },
  { label: "AI Assistant", icon: Bot },
  { label: "Event Management", icon: Trophy },
  { label: "Expenses", icon: CircleDollarSign },
  { label: "Staff", icon: ShieldCheck },
  { label: "Settings", icon: Settings }
];

const roleLabels: Record<AppRole, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
  waiter: "Waiter"
};

/** Maps each page to the permission a role needs to view it. Undefined = everyone. */
const pagePermission: Partial<Record<Page, Permission>> = {
  "POS / Sales": "sell",
  "Tables": "manage_tables",
  "Inventory": "manage_inventory",
  "Customers": "manage_customers",
  "Debts": "manage_debts",
  "Payments": "sell",
  "Gift Cards": "manage_customers",
  "Wallets & Loyalty": "manage_customers",
  "Reports": "view_reports",
  "AI Assistant": "view_reports",
  "Event Management": "manage_events",
  "Expenses": "manage_expenses",
  "Staff": "manage_staff",
  "Settings": "manage_settings",
};

const money = (v: number) => `GHS ${v.toFixed(2)}`;
const COLORS = ["#f9c317", "#23c55e", "#5b8cff", "#e66b5b", "#a78bfa"];

const defaultSettings = {
  businessName: "EMD Drinking Sports",
  location: "Ghana",
  receiptFooter: "Thank you for drinking with EMD! Come again."
};

export default function App() {
  return <AppInner />;
}

function AppInner() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [footballMode, setFootballMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { role, setRole, userName, can, isAuthenticated, isLoading, signOut, user, avatarUrl } = useAuth();
  const online = useOnlineStatus();
  const heldOrders = useAppStore((s) => s.heldOrders);
  const setCashierId = useAppStore((s) => s.setCashierId);
  const products = useAppStore((s) => s.products);
  const customers = useAppStore((s) => s.customers);
  const matches = useAppStore((s) => s.matches);
  const events = useAppStore((s) => s.events);
  const syncState = useSyncIntegration();
  const { canInstall, promptInstall } = useInstallPrompt();

  const featuredMatch = matches.find((m) => m.featured && m.active) ?? matches.find((m) => m.active);
  const notifications = useMemo(() => {
    const items: Array<{ text: string; page: Page; danger: boolean }> = [];
    const lowStock = products.filter((p) => p.active && p.stock <= p.reorderLevel);
    if (lowStock.length > 0) items.push({ text: `${lowStock.length} product${lowStock.length>1?"s":""} low on stock`, page: "Inventory", danger: true });
    const debtors = customers.filter((c) => c.debt > 0);
    if (debtors.length > 0) items.push({ text: `${debtors.length} customer${debtors.length>1?"s":""} owe money`, page: "Debts", danger: true });
    if (heldOrders.length > 0) items.push({ text: `${heldOrders.length} held order${heldOrders.length>1?"s":""} waiting`, page: "POS / Sales", danger: false });
    if (syncState.pending > 0) items.push({ text: `${syncState.pending} operation${syncState.pending>1?"s":""} pending sync`, page: "Dashboard", danger: false });
    // Event notifications
    const now = Date.now();
    const todayEvents = events.filter(e => e.active && new Date(e.startsAt).toDateString() === new Date().toDateString() && new Date(e.startsAt).getTime() > now);
    if (todayEvents.length > 0) items.push({ text: `${todayEvents.length} event${todayEvents.length>1?"s":""} happening today!`, page: "Event Management", danger: false });
    const upcomingEvents = events.filter(e => e.active && new Date(e.startsAt).getTime() > now && new Date(e.startsAt).getTime() < now + 86400000 * 3);
    if (upcomingEvents.length > 0 && todayEvents.length === 0) items.push({ text: `${upcomingEvents.length} upcoming event${upcomingEvents.length>1?"s":""} in the next 3 days`, page: "Event Management", danger: false });
    // Capacity warnings
    const nearCapacity = events.filter(e => e.active && e.maxCapacity && (e.attendeeCount ?? 0) >= e.maxCapacity * 0.8);
    if (nearCapacity.length > 0) items.push({ text: `${nearCapacity.length} event${nearCapacity.length>1?"s":""} nearing capacity`, page: "Event Management", danger: true });
    return items;
  }, [products, customers, heldOrders, syncState.pending, events]);

  useEffect(() => {
    if (user?.id) setCashierId(user.id);
  }, [user?.id, setCashierId]);

  const filteredNav = nav.filter((item) => {
    const perm = pagePermission[item.label];
    return !perm || can(perm);
  });

  // If the current page is not accessible to this role, snap to a safe page.
  useEffect(() => {
    const perm = pagePermission[page];
    if (perm && !can(perm)) {
      setPage("Dashboard");
    }
  }, [role, page, can]);

  if (isLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-splash"><Loader2 className="auth-spinner" size={32} /></div>
          <p className="auth-loading-text">Loading EMD Drinking Sports…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return (
    <div className="app-shell">
      {mobileNav && <div className="sidebar-backdrop" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Crown size={27}/></div>
          <div><strong>EMD</strong><span>DRINKING SPORTS APP</span><em>BAR &amp; LOUNGE MANAGEMENT</em></div>
        </div>
        <nav>
          {filteredNav.map(({ label, icon: Icon }) => {
            const tableAlerts = label === "Tables" ? (useAppStore.getState().customerOrders.filter(o => o.status !== "paid").length + useAppStore.getState().waiterCalls.filter(c => c.status === "pending").length) : 0;
            return (
            <button key={label} className={page === label ? "active" : ""} onClick={() => { setPage(label); setMobileNav(false); }}>
              <Icon size={18}/><span>{label}</span>
              {label === "AI Assistant" && <span className="nav-badge">New</span>}
              {tableAlerts > 0 && <span className="nav-badge alert">{tableAlerts}</span>}
            </button>
            );
          })}
        </nav>
        {footballMode && featuredMatch && (
          <button className="big-match-card" onClick={() => { setPage("Event Management"); setMobileNav(false); }}>
            <Beer size={26}/>
            <small>BIG MATCH</small>
            <strong>TONIGHT</strong>
            <span>{featuredMatch.homeTeam} vs {featuredMatch.awayTeam}</span>
          </button>
        )}
        <div className="sidebar-foot">
          <a href="/portal" className="portal-link" target="_blank" rel="noopener noreferrer">
            <Smartphone size={14}/> Customer Portal
          </a>
          <span className={`dot ${online ? "online" : "offline"}`}/> {online ? "You are online" : "Offline"}
          {syncState.pending > 0 && <div className="held-count"><Clock size={11}/> {syncState.pending} syncing</div>}
          {heldOrders.length > 0 && <div className="held-count"><Pause size={11}/> {heldOrders.length} held</div>}
          <button className="logout-btn" onClick={() => signOut()} aria-label="Sign out">
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X/> : <Menu/>}</button>
          <div className="search"><Search size={17}/><input placeholder="Search drinks, customers, tables…"/></div>
          <div className="connection-indicator" title={syncState.status === "syncing" ? "Syncing…" : syncState.status === "failed" ? "Sync failed" : online ? "Online" : "Offline"}>
            {online ? <Wifi size={16}/> : <WifiOff size={16}/>}
            {syncState.status === "syncing" && <span className="sync-badge">syncing…</span>}
            {syncState.status === "failed" && <span className="sync-badge failed">sync failed</span>}
          </div>
          <label className="football-toggle" title="Toggle event mode">
            <span>Event Mode</span>
            <input type="checkbox" checked={footballMode} onChange={(e:React.ChangeEvent<HTMLInputElement>) => setFootballMode(e.target.checked)}/>
            <i/>
          </label>
          <div className="notif-wrap">
            <button className="icon-btn notif-btn" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications">
              <Bell size={18}/>
              {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            </button>
            {showNotifications && (
              <div className="notif-panel">
                <div className="notif-head"><strong>Notifications</strong><button className="icon-btn" onClick={()=>setShowNotifications(false)}><X size={14}/></button></div>
                {notifications.length === 0 && <p className="muted-text">Nothing needs your attention.</p>}
                {notifications.map((n, i) => (
                  <button key={i} className={`notif-item ${n.danger?"danger":""}`} onClick={()=>{ setPage(n.page); setShowNotifications(false); }}>
                    <AlertTriangle size={13}/><span>{n.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {canInstall && <button className="install-btn" onClick={promptInstall} aria-label="Install app"><Smartphone size={16}/> Install</button>}
          <div className="role-switcher">
            <select value={role} onChange={(e:React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as AppRole)} aria-label="Switch role">
              {(Object.keys(roleLabels) as AppRole[]).map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </select>
          </div>
          <div className="owner"><div className="avatar">{avatarUrl ? <img src={avatarUrl} alt={userName} /* eslint-disable-line @next/next/no-img-element */ /> : userName[0]}</div><div><b>{userName}</b><span>{roleLabels[role]}</span></div></div>
        </header>

        <section className="content">
          <React.Suspense fallback={<div className="page-loading"><Loader2 className="auth-spinner" size={24}/> Loading…</div>}>
            {page === "Dashboard" && <Dashboard onNavigate={setPage}/>}
            {page === "POS / Sales" && (can("sell") ? <POS/> : <AccessDenied/>)}
            {page === "Tables" && (can("manage_tables") ? <Tables/> : <AccessDenied/>)}
            {page === "Inventory" && (can("manage_inventory") ? <Inventory/> : <AccessDenied/>)}
            {page === "Customers" && (can("manage_customers") ? <Customers/> : <AccessDenied/>)}
            {page === "Debts" && (can("manage_debts") ? <Debts/> : <AccessDenied/>)}
            {page === "Payments" && (can("sell") ? <Payments/> : <AccessDenied/>)}
            {page === "Gift Cards" && (can("manage_customers") ? <GiftCards/> : <AccessDenied/>)}
            {page === "Wallets & Loyalty" && (can("manage_customers") ? <Wallets/> : <AccessDenied/>)}
            {page === "Reports" && (can("view_reports") ? <Reports/> : <AccessDenied/>)}
            {page === "AI Assistant" && (can("view_reports") ? <AIAssistant/> : <AccessDenied/>)}
            {page === "Event Management" && (can("manage_tables") ? <Football/> : <AccessDenied/>)}
            {page === "Expenses" && (can("manage_expenses") ? <Expenses/> : <AccessDenied/>)}
            {page === "Staff" && (can("manage_staff") ? <Staff/> : <AccessDenied/>)}
            {page === "Settings" && (can("manage_settings") ? <SettingsPage/> : <AccessDenied/>)}
          </React.Suspense>
        </section>

        <nav className="bottom-nav">
          <button className={page === "Dashboard" ? "active" : ""} onClick={() => setPage("Dashboard")}>
            <Home size={20}/><span>Home</span>
          </button>

          {can("sell") && (
            <button className={page === "POS / Sales" ? "active" : ""} onClick={() => setPage("POS / Sales")}>
              <ShoppingCart size={20}/><span>Sales</span>
            </button>
          )}

          <button className="bottom-fab" onClick={() => setPage("POS / Sales")} aria-label="New sale">
            <span className="bottom-fab-btn"><Plus size={26}/></span>
            <span>New Sale</span>
          </button>

          {can("manage_tables") && (
            <button className={page === "Tables" ? "active" : ""} onClick={() => setPage("Tables")}>
              <LayoutGrid size={20}/><span>Tables</span>
            </button>
          )}

          <button onClick={() => setMobileNav(true)} aria-label="More">
            <Menu size={20}/><span>More</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const products = useAppStore((s) => s.products);
  const customers = useAppStore((s) => s.customers);
  const sales = useAppStore((s) => s.sales);
  const tables = useAppStore((s) => s.tables);
  const expenses = useAppStore((s) => s.expenses);
  const debts = useAppStore((s) => s.debts);
  const { can, role, userName } = useAuth();
  const insights = useMemo(() => businessInsights(products, customers, sales), [products, customers, sales]);
  const profit = useMemo(() => estimatedProfitCalc(sales, expenses, products), [sales, expenses, products]);
  const aging = useMemo(() => debtAging(debts), [debts]);
  const weeklySeries = useMemo(() => weeklySalesSeries(sales), [sales]);
  const revenueTrend = useMemo(() => dayOverDayChange(sales, "revenue"), [sales]);
  const unitsTrend = useMemo(() => dayOverDayChange(sales, "units"), [sales]);
  const debt = customers.reduce((s, x) => s + x.debt, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingPayments = sales.filter((s) => s.paymentStatus === "pending" && !s.voided);
  const customersOwing = customers.filter((c) => c.debt > 200);

  const topSelling = insights.ranked.filter((p) => p.units > 0).slice(0, 5);
  const topUnits = topSelling.reduce((a, p) => a + p.units, 0);
  const topDebtors = useMemo(() => customers.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 5), [customers]);
  const recentSaleLines = useMemo(() => sales
    .filter((s) => !s.voided)
    .flatMap((s) => s.lines.map((l) => ({ line: l, sale: s })))
    .sort((a, b) => new Date(b.sale.createdAt).getTime() - new Date(a.sale.createdAt).getTime())
    .slice(0, 6), [sales]);

  const paymentTotal = sales.filter((s) => !s.voided).reduce((a, s) => a + s.total, 0);
  const paymentData = (["momo", "cash", "card", "gift", "wallet"] as PaymentMethod[]).map((m) => ({
    name: m, value: sales.filter((s) => s.paymentMethod === m && !s.voided).reduce((a, s) => a + s.total, 0)
  })).filter((d) => d.value > 0);

  const attentionItems: Array<{ text: string; danger: boolean }> = [];
  if (insights.lowStock.length > 0) attentionItems.push({ text: `${insights.lowStock.length} products need restocking`, danger: true });
  if (aging.overdue > 0) attentionItems.push({ text: `Overdue debt: ${money(aging.overdue)}`, danger: true });
  if (pendingPayments.length > 0) attentionItems.push({ text: `${pendingPayments.length} pending payments`, danger: true });
  if (insights.slowMoving.length > 0) attentionItems.push({ text: `${insights.slowMoving.length} slow-moving products`, danger: false });

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const isWaiter = role === "waiter";
  const isCashier = role === "cashier";
  const greeting = isWaiter ? "Tables & Orders" : isCashier ? "Sales Dashboard" : "Business Dashboard";

  return <>
    <div className="page-title"><div><p>WELCOME BACK, {userName.toUpperCase()}</p><h1>{greeting}</h1><span>{todayStr}</span></div>{can("sell") && <button className="primary" onClick={() => onNavigate("POS / Sales")}><Plus size={18}/> New sale</button>}</div>

    <div className="metric-grid">
      {can("view_reports") && <Metric label="TODAY'S SALES" value={money(revenueTrend.today)} sub="live total" trend={revenueTrend} icon={<CircleDollarSign/>}/>}
      {can("sell") && <Metric label="ITEMS SOLD" value={String(unitsTrend.today)} sub="today" trend={unitsTrend} icon={<Beer/>}/>}
      <Metric label="OPEN TABLES" value={`${tables.filter(t=>t.occupied).length} / ${tables.length}`} sub={`${tables.filter(t=>t.occupied).length} occupied`} icon={<LayoutGrid/>}/>
      {can("manage_debts") && <Metric label="TOTAL DEBTS" value={money(debt)} sub={`${customers.filter(c=>c.debt>0).length} customers`} danger icon={<Users/>}/>}
      {can("manage_inventory") && <Metric label="LOW STOCK ITEMS" value={String(insights.lowStock.length)} sub="View items" danger icon={<AlertTriangle/>} onSubClick={()=>onNavigate("Inventory")}/>}
    </div>

    {can("view_reports") && (
      <div className="insight-card-row">
        <InsightCard tone="gold" icon={<Trophy/>} label="Top Selling" value={insights.bestSeller?.name ?? "—"} sub={`${insights.bestSeller?.units ?? 0} units`} footer="Today"/>
        <InsightCard tone="red" icon={<TrendingDown/>} label="Least Selling" value={insights.leastSeller?.name ?? "—"} sub={`${insights.leastSeller?.units ?? 0} units`} footer="Today"/>
        {can("manage_inventory") && <InsightCard tone="gold" icon={<AlertTriangle/>} label="Low Stock Alert" value={`${insights.lowStock.length} Items`} sub="Need attention" footer="View Items" onClick={()=>onNavigate("Inventory")}/>}
        {can("manage_inventory") && <InsightCard tone="green" icon={<Package/>} label="High Inventory" value={insights.highStock[0]?.name ?? "—"} sub={`${insights.highStock[0]?.stock ?? 0} in stock`} footer="In Stock"/>}
        {can("manage_debts") && <InsightCard tone="red" icon={<Users/>} label="Customers Owing" value={`${customersOwing.length} Customers`} sub="Owing > GHS 200" footer="View Debtors" onClick={()=>onNavigate("Debts")}/>}
      </div>
    )}

    {isWaiter && (
      <div className="dashboard-grid">
        <Panel title="Open tables" className="span2" action={<button className="panel-link" onClick={()=>onNavigate("Tables")}>View all</button>}>
          <div className="responsive-table compact"><table>
            <thead><tr><th>Table</th><th>Status</th><th>Bill</th></tr></thead>
            <tbody>
              {tables.map(t => (
                <tr key={t.id}><td><b>{t.name}</b></td><td>{t.occupied ? "Occupied" : "Free"}</td><td>{money(t.bill)}</td></tr>
              ))}
            </tbody>
          </table></div>
        </Panel>
        <Panel title="Quick actions">
          <div className="quick-actions">
            <button onClick={() => onNavigate("POS / Sales")}><ShoppingCart/> New sale</button>
            <button onClick={() => onNavigate("Tables")}><LayoutGrid/> Manage tables</button>
            <button onClick={() => onNavigate("Customers")}><Users/> Customers</button>
          </div>
        </Panel>
      </div>
    )}

    {isCashier && (
      <div className="dashboard-grid">
        <Panel title="Sales overview" className="span2" action={<span className="panel-tag">This Week</span>}>
          <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeklySeries}>
            <XAxis dataKey="name" stroke="#747474" fontSize={11}/><YAxis stroke="#747474" fontSize={11}/><Tooltip contentStyle={{background:"#111315",border:"1px solid #333",borderRadius:"10px",fontSize:"12px"}}/>
            <Line type="monotone" dataKey="value" stroke="#f9c317" strokeWidth={3} dot={{fill:"#f9c317",r:4}} activeDot={{r:6}}/>
          </LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Sales by payment method">
          <div className="chart small"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
            {paymentData.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
          </Pie></PieChart></ResponsiveContainer></div>
          <div className="legend">{paymentData.map((d,i)=>(
            <span key={d.name}><i style={{background:COLORS[i%COLORS.length]}}/>{d.name.toUpperCase()} <b>{paymentTotal>0?Math.round((d.value/paymentTotal)*100):0}%</b></span>
          ))}</div>
        </Panel>
        <Panel title="Recent sales" className="span2" action={<button className="panel-link" onClick={()=>onNavigate("POS / Sales")}>View all</button>}>
          <div className="responsive-table compact"><table>
            <thead><tr><th>Item</th><th>Type</th><th>Table</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              {recentSaleLines.length === 0 && <tr><td colSpan={5} className="muted-text">No sales yet.</td></tr>}
              {recentSaleLines.map(({line, sale})=>(
                <tr key={`${sale.id}-${line.id}`}>
                  <td>{line.name}</td>
                  <td><span className="mode-tag">{line.mode}</span></td>
                  <td>{tables.find(t=>t.id===sale.tableId)?.name ?? "—"}</td>
                  <td>{money(line.unitPrice*line.quantity)}</td>
                  <td>{new Date(sale.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Panel>
        <Panel title="Quick actions">
          <div className="quick-actions">
            <button onClick={() => onNavigate("POS / Sales")}><ShoppingCart/> New sale</button>
            <button onClick={() => onNavigate("Tables")}><LayoutGrid/> Manage tables</button>
            <button onClick={() => onNavigate("Customers")}><Users/> Customers</button>
          </div>
        </Panel>
      </div>
    )}

    {!isWaiter && !isCashier && (<>
    <div className="dashboard-grid">
      <Panel title="Sales overview" className="span2" action={<span className="panel-tag">This Week</span>}>
        <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeklySeries}>
          <XAxis dataKey="name" stroke="#747474" fontSize={11}/><YAxis stroke="#747474" fontSize={11}/><Tooltip contentStyle={{background:"#111315",border:"1px solid #333",borderRadius:"10px",fontSize:"12px"}}/>
          <Line type="monotone" dataKey="value" stroke="#f9c317" strokeWidth={3} dot={{fill:"#f9c317",r:4}} activeDot={{r:6}}/>
        </LineChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="Top selling drinks" action={<span className="panel-tag">This Week</span>}>
        {topSelling.length === 0 ? <p className="muted-text">No sales recorded yet.</p> : <>
          <div className="chart small"><ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={topSelling} dataKey="units" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
              {topSelling.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip contentStyle={{background:"#111315",border:"1px solid #333",borderRadius:"10px",fontSize:"12px"}}/>
          </PieChart></ResponsiveContainer></div>
          <div className="legend">{topSelling.map((d,i)=>(
            <span key={d.id}><i style={{background:COLORS[i%COLORS.length]}}/>{d.name} <b>{topUnits>0?Math.round((d.units/topUnits)*100):0}%</b></span>
          ))}</div>
        </>}
      </Panel>

      {can("manage_debts") && <Panel title="Top debtors" action={<button className="panel-link" onClick={()=>onNavigate("Debts")}>View all</button>}>
        <ol className="debtor-list">
          {topDebtors.length === 0 && <li className="muted-text">No outstanding debts.</li>}
          {topDebtors.map((c) => (
            <li key={c.id}>
              <span className="debtor-avatar">{c.name[0]}</span>
              <span className="debtor-name">{c.name}</span>
              <b className="debtor-amount">{money(c.debt)}</b>
            </li>
          ))}
        </ol>
      </Panel>}
      <Panel title="Sales by payment method">
        <div className="chart small"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
          {paymentData.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
        </Pie></PieChart></ResponsiveContainer></div>
        <div className="legend">{paymentData.map((d,i)=>(
          <span key={d.name}><i style={{background:COLORS[i%COLORS.length]}}/>{d.name.toUpperCase()} <b>{paymentTotal>0?Math.round((d.value/paymentTotal)*100):0}%</b></span>
        ))}</div>
      </Panel>

      {can("manage_inventory") && <Panel title="Low stock items" action={<button className="panel-link" onClick={()=>onNavigate("Inventory")}>View all</button>}>
        <div className="responsive-table compact"><table>
          <thead><tr><th>Product</th><th>Stock</th><th>Reorder Level</th><th>Status</th></tr></thead>
          <tbody>
            {insights.lowStock.length === 0 && <tr><td colSpan={4} className="muted-text">All products healthy.</td></tr>}
            {insights.lowStock.slice(0,5).map(p=>(
              <tr key={p.id}><td><b>{p.name}</b></td><td>{p.stock}</td><td>{p.reorderLevel}</td><td><StockBadge product={p}/></td></tr>
            ))}
          </tbody>
        </table></div>
      </Panel>}
      <Panel title="Recent sales" action={<button className="panel-link" onClick={()=>onNavigate("POS / Sales")}>View all</button>}>
        <div className="responsive-table compact"><table>
          <thead><tr><th>Item</th><th>Type</th><th>Table</th><th>Amount</th><th>Time</th></tr></thead>
          <tbody>
            {recentSaleLines.length === 0 && <tr><td colSpan={5} className="muted-text">No sales yet.</td></tr>}
            {recentSaleLines.map(({line, sale})=>(
              <tr key={`${sale.id}-${line.id}`}>
                <td>{line.name}</td>
                <td><span className="mode-tag">{line.mode}</span></td>
                <td>{tables.find(t=>t.id===sale.tableId)?.name ?? "—"}</td>
                <td>{money(line.unitPrice*line.quantity)}</td>
                <td>{new Date(sale.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Panel>
    </div>

    <div className="metric-grid second-row">
      <Metric label="EST. PROFIT" value={money(profit)} sub="revenue - COGS - expenses" icon={<TrendingUp/>}/>
      <Metric label="EXPENSES" value={money(expenseTotal)} sub={`${expenses.length} recorded`} icon={<CircleDollarSign/>}/>
      <Metric label="OVERDUE DEBT" value={money(aging.overdue)} sub="past due date" danger icon={<Clock/>}/>
      <Metric label="BEST SELLER" value={insights.bestSeller?.name ?? "—"} sub={`${insights.bestSeller?.units ?? 0} units`} icon={<Package/>}/>
      <Metric label="TOP CUSTOMER" value={insights.topBuyer?.name ?? "—"} sub={money(insights.topBuyer?.totalSpent ?? 0)} icon={<Users/>}/>
    </div>

    <div className="dashboard-grid second-row">
      <Panel title="AI business insights" className="span2">
        <div className="insight-grid">
          <Insight title="Top buyer" value={`${insights.topBuyer?.name ?? "—"} • ${money(insights.topBuyer?.totalSpent ?? 0)}`}/>
          <Insight title="Highest debt" value={`${insights.topDebtor?.name ?? "—"} • ${money(insights.topDebtor?.debt ?? 0)}`} danger/>
          <Insight title="Est. profit" value={`${money(profit)} after COGS + expenses`}/>
          <Insight title="Expenses" value={`${money(expenseTotal)} across ${expenses.length} entries`}/>
        </div>
      </Panel>
      <Panel title="AI attention items">
        <div className="attention-list">
          {attentionItems.length === 0 && <p className="muted-text">All clear — no issues detected.</p>}
          {attentionItems.map((item, i) => (
            <div key={i} className={`attention-item ${item.danger ? "danger" : ""}`}>
              <AlertTriangle size={14}/> <span>{item.text}</span>
            </div>
          ))}
        </div>
        <div className="quick-actions">
          <button onClick={() => onNavigate("POS / Sales")}><ShoppingCart/> New sale</button>
          <button onClick={() => onNavigate("AI Assistant")}><Bot/> Ask AI</button>
        </div>
      </Panel>
    </div>

    <DashboardAssistant onNavigate={onNavigate}/>
    </>)}

    <div className="feature-strip">
      {[
        { icon: <Beer/>, title: "Bottle & Shot Sales", sub: "Sell full bottles or tots" },
        { icon: <LayoutGrid/>, title: "Table Management", sub: "Track tables & open tabs" },
        ...(can("manage_inventory") ? [{ icon: <Package/>, title: "Inventory Control", sub: "Real-time stock tracking" }] : []),
        ...(can("manage_debts") ? [{ icon: <ReceiptText/>, title: "Credit / Debts", sub: "Manage customer debts" }] : []),
        ...(can("view_reports") ? [{ icon: <BarChart3/>, title: "Reports & Analytics", sub: "Powerful business insights" }] : []),
        ...(can("view_reports") ? [{ icon: <Bot/>, title: "AI Assistant", sub: "Smart business advisor" }] : []),
        ...(can("manage_tables") ? [{ icon: <Trophy/>, title: "Event Management", sub: "Schedule & promos" }] : []),
      ].map((f) => (
        <div className="feature-item" key={f.title}>
          <div className="feature-icon">{f.icon}</div>
          <div><strong>{f.title}</strong><small>{f.sub}</small></div>
        </div>
      ))}
    </div>
  </>;
}

function DashboardAssistant({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const products = useAppStore(s => s.products);
  const customers = useAppStore(s => s.customers);
  const sales = useAppStore(s => s.sales);
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string[] | null>(null);

  const insights = useMemo(() => businessInsights(products, customers, sales), [products, customers, sales]);
  const firstName = (user?.name ?? "there").split(" ")[0];

  const todaySummary = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => !s.voided && new Date(s.createdAt).toDateString() === today);
    const total = todaySales.reduce((a, s) => a + s.total, 0);
    const units = todaySales.reduce((a, s) => a + s.lines.reduce((x, l) => x + l.quantity, 0), 0);
    const owing = customers.filter(c => c.debt > 200);
    return [
      `Total Sales: ${money(total)}`,
      `Items Sold: ${units}`,
      `Highest Selling: ${insights.bestSeller?.name ?? "—"} (${insights.bestSeller?.units ?? 0} units)`,
      `Lowest Selling: ${insights.leastSeller?.name ?? "—"} (${insights.leastSeller?.units ?? 0} units)`,
      `Low Stock Items: ${insights.lowStock.length}`,
      `Customers Owing More Than GHS 200: ${owing.length}`
    ];
  }, [sales, customers, insights]);

  const answerFor = (q: string): string[] => {
    const t = q.toLowerCase();
    if (t.includes("summary") || t.includes("today")) return todaySummary;
    if (t.includes("owe") || t.includes("debt") || t.includes("debtor")) {
      const top = customers.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 5);
      return top.length ? top.map(c => `${c.name} owes ${money(c.debt)}`) : ["No customers currently owe you money."];
    }
    if (t.includes("stock") || t.includes("restock") || t.includes("low")) {
      return insights.lowStock.length
        ? insights.lowStock.map(p => `${p.name}: ${p.stock} left (reorder at ${p.reorderLevel})`)
        : ["All products are healthy — nothing needs restocking."];
    }
    if (t.includes("selling") || t.includes("best") || t.includes("top")) {
      const top = insights.ranked.filter(p => p.units > 0).slice(0, 5);
      return top.length ? top.map((p, i) => `${i + 1}. ${p.name} — ${p.units} units`) : ["No sales recorded yet."];
    }
    return todaySummary;
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    setAnswer(answerFor(q));
  };

  const chips = ["Give me a summary of today's business", "Who owes the most?", "What is selling most?", "Which products are low?"];

  return (
    <div className="dash-assistant">
      <div className="dash-assistant-intro">
        <div className="dash-bot"><Bot size={30}/></div>
        <strong>EMD AI ASSISTANT</strong>
        <p>Hello {firstName}! I&apos;m your AI bar assistant. I analyze your business and give you smart insights.</p>
        <button className="dash-assistant-new" onClick={() => { setAnswer(null); setQuestion(""); }}>
          <Plus size={14}/> New Chat
        </button>
        <button className="dash-assistant-full" onClick={() => onNavigate("AI Assistant")}>
          Open full assistant <ArrowUpRight size={14}/>
        </button>
      </div>

      <div className="dash-assistant-chat">
        <div className="dash-chips">
          {chips.map(c => <button key={c} onClick={() => ask(c)}>{c}</button>)}
        </div>

        <div className="dash-answer">
          {answer === null ? (
            <div className="dash-answer-empty">
              <Bot size={20}/>
              <p>Ask me about sales, stock, debtors or top drinks — or tap a suggestion above.</p>
            </div>
          ) : (
            <>
              <div className="dash-answer-q">{question}</div>
              <div className="dash-answer-body">
                <strong>Here&apos;s what I found:</strong>
                <ul>{answer.map((line, i) => <li key={i}><CheckCircle2 size={13}/> {line}</li>)}</ul>
                <small className="dash-answer-time">Just now</small>
              </div>
            </>
          )}
        </div>

        <div className="dash-ask">
          <input
            placeholder="Ask about sales, stock, debtors, top drinks…"
            value={question}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") ask(question); }}
          />
          <button onClick={() => ask(question)} aria-label="Send"><Send size={16}/></button>
        </div>
      </div>
    </div>
  );
}

// Brand-accurate colours so each product reads instantly on the POS grid
const BRAND: Record<string, { body: string; body2: string; label: string; text: string; cap: string }> = {
  "Guinness":      { body:"#1a1005", body2:"#0b0703", label:"#12100c", text:"#e3b23c", cap:"#c8992b" },
  "Club Beer":     { body:"#1b4f8f", body2:"#0d2a4f", label:"#1256a0", text:"#ffffff", cap:"#c9ced4" },
  "Star Beer":     { body:"#2f6fbf", body2:"#17406f", label:"#ffffff", text:"#1b4f8f", cap:"#c9ced4" },
  "Heineken":      { body:"#1c6b2f", body2:"#0c3517", label:"#127a33", text:"#ffffff", cap:"#e2231a" },
  "Black & White": { body:"#2a2317", body2:"#12100b", label:"#f2efe6", text:"#1a1a1a", cap:"#1a1a1a" },
  "Johnnie Walker":{ body:"#7a4a12", body2:"#40260a", label:"#111111", text:"#d4af37", cap:"#d4af37" },
  "Hennessy VS":   { body:"#8a5210", body2:"#4a2a06", label:"#e9d9a8", text:"#5a3606", cap:"#1a1a1a" },
  "Red Wine":      { body:"#3e0d18", body2:"#1c060b", label:"#e8dcc4", text:"#6a1220", cap:"#6a1220" },
  "White Wine":    { body:"#6d6a2c", body2:"#333213", label:"#f4eecd", text:"#6a6420", cap:"#c9b458" },
  "Malt":          { body:"#43230c", body2:"#1e0f05", label:"#8a4a16", text:"#f0d9a8", cap:"#c8992b" },
  "Coke":          { body:"#5c0a0a", body2:"#2a0404", label:"#e2231a", text:"#ffffff", cap:"#e2231a" },
  "Water":         { body:"#8fd3ef", body2:"#3f9dc4", label:"#ffffff", text:"#1b7fa8", cap:"#1b7fa8" },
};
const CATEGORY_FALLBACK: Record<ProductCategory, { body: string; body2: string; label: string; text: string; cap: string }> = {
  "Beer":         { body:"#6b4413", body2:"#2f1d07", label:"#8a5a18", text:"#f0d9a8", cap:"#c8992b" },
  "Spirits":      { body:"#7a4a12", body2:"#3a230a", label:"#efe3c4", text:"#4a2c06", cap:"#d4af37" },
  "Wine":         { body:"#2c3d1c", body2:"#131c0b", label:"#e8dcc4", text:"#3f5527", cap:"#8a7333" },
  "Soft Drinks":  { body:"#7a1414", body2:"#380808", label:"#e2231a", text:"#ffffff", cap:"#e2231a" },
  "Water":        { body:"#8fd3ef", body2:"#3f9dc4", label:"#ffffff", text:"#1b7fa8", cap:"#1b7fa8" },
  "Energy Drinks":{ body:"#20304a", body2:"#0d1622", label:"#f9c317", text:"#101010", cap:"#c9ced4" },
  "Cigarettes":   { body:"#e8e6e0", body2:"#bdb9b0", label:"#c8102e", text:"#ffffff", cap:"#8c8781" },
  "Snacks":       { body:"#b8791b", body2:"#75470b", label:"#f3c969", text:"#5a3606", cap:"#8a5a18" },
  "Juice":        { body:"#d98613", body2:"#8a5205", label:"#ffb733", text:"#5a3606", cap:"#c8992b" },
};

function ProductVisual({ product }: { product: Product }) {
  // If product has a real image URL, show it with SVG fallback on error
  if (product.imageUrl) {
    return (
      <>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            // Hide broken image and show fallback SVG
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
            const fallback = img.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "block";
          }}
        />
        <div style={{ display: "none" }}><ProductSvg product={product} /></div>
      </>
    );
  }
  return <ProductSvg product={product} />;
}

function ProductSvg({ product }: { product: Product }) {
  const c = BRAND[product.name] ?? CATEGORY_FALLBACK[product.category];
  const id = product.id;
  const cat = product.category;
  const glass = (
    <>
      <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={c.body2}/><stop offset="38%" stopColor={c.body}/>
        <stop offset="62%" stopColor={c.body}/><stop offset="100%" stopColor={c.body2}/>
      </linearGradient>
      <linearGradient id={`s-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity=".34"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>
    </>
  );

  // Can — energy drinks
  if (cat === "Energy Drinks") return (
    <svg viewBox="0 0 40 64" role="img" aria-label={product.name}>
      <defs>{glass}</defs>
      <rect x="11" y="4" width="18" height="3" rx="1.4" fill={c.cap}/>
      <rect x="10" y="6" width="20" height="54" rx="4" fill={`url(#g-${id})`}/>
      <rect x="10" y="22" width="20" height="22" fill={c.label}/>
      <rect x="12.5" y="8" width="3.5" height="50" rx="1.8" fill={`url(#s-${id})`}/>
      <text x="20" y="36" textAnchor="middle" fontSize="7" fontWeight="700" fill={c.text}>{product.name.slice(0,3).toUpperCase()}</text>
    </svg>
  );

  // Pack — cigarettes
  if (cat === "Cigarettes") return (
    <svg viewBox="0 0 40 64" role="img" aria-label={product.name}>
      <defs>{glass}</defs>
      <rect x="9" y="10" width="22" height="46" rx="2.5" fill={`url(#g-${id})`}/>
      <rect x="9" y="10" width="22" height="13" rx="2.5" fill={c.cap}/>
      <rect x="9" y="28" width="22" height="16" fill={c.label}/>
      <rect x="11.5" y="12" width="3" height="42" rx="1.5" fill={`url(#s-${id})`}/>
      <text x="20" y="39" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c.text}>{product.name.slice(0,3).toUpperCase()}</text>
    </svg>
  );

  // Bag — snacks
  if (cat === "Snacks") return (
    <svg viewBox="0 0 40 64" role="img" aria-label={product.name}>
      <defs>{glass}</defs>
      <path d="M8 14 h24 v40 a3 3 0 0 1-3 3 h-18 a3 3 0 0 1-3-3 z" fill={`url(#g-${id})`}/>
      <path d="M8 14 l4-4 h16 l4 4 z" fill={c.cap}/>
      <rect x="8" y="28" width="24" height="16" fill={c.label}/>
      <rect x="11" y="17" width="3" height="38" rx="1.5" fill={`url(#s-${id})`}/>
      <text x="20" y="39" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c.text}>{product.name.slice(0,3).toUpperCase()}</text>
    </svg>
  );

  // Bottle — beer / spirits / wine / soft drinks / water / juice
  const wide = cat === "Spirits" || cat === "Juice";
  const bodyTop = cat === "Wine" ? 24 : 26;
  const w = wide ? 26 : 22;
  const x = (40 - w) / 2;
  return (
    <svg viewBox="0 0 40 64" role="img" aria-label={product.name}>
      <defs>{glass}</defs>
      <rect x="16" y="3" width="8" height="5" rx="1.2" fill={c.cap}/>
      <path
        d={`M16.5 8 h7 v${bodyTop - 16} c0 3 ${(w/2-3.5).toFixed(1)} 4 ${(w/2-3.5).toFixed(1)} 8 v${58-bodyTop} a3 3 0 0 1-3 3 h-${w-6} a3 3 0 0 1-3-3 v${-(58-bodyTop)} c0-4 ${(w/2-3.5).toFixed(1)}-5 ${(w/2-3.5).toFixed(1)}-8 z`}
        fill={`url(#g-${id})`}
      />
      <rect x={x} y={bodyTop + 10} width={w} height="17" fill={c.label}/>
      <rect x={x + 2.5} y={bodyTop + 3} width="3" height={52 - bodyTop} rx="1.5" fill={`url(#s-${id})`}/>
      <text x="20" y={bodyTop + 21.5} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c.text}>
        {product.name.slice(0, 3).toUpperCase()}
      </text>
    </svg>
  );
}

function POS() {
  const products = useAppStore(s=>s.products);
  const cart = useAppStore(s=>s.cart);
  const add = useAppStore(s=>s.addToCart);
  const qty = useAppStore(s=>s.updateCartQty);
  const clear = useAppStore(s=>s.clearCart);
  const checkout = useAppStore(s=>s.checkout);
  const holdOrder = useAppStore(s=>s.holdOrder);
  const heldOrders = useAppStore(s=>s.heldOrders);
  const resumeHeldOrder = useAppStore(s=>s.resumeHeldOrder);
  const customers = useAppStore(s=>s.customers);
  const tables = useAppStore(s=>s.tables);
  const selectedTableId = useAppStore(s=>s.selectedTableId);
  const selectedCustomerId = useAppStore(s=>s.selectedCustomerId);
  const selectTable = useAppStore(s=>s.selectTable);
  const selectCustomer = useAppStore(s=>s.selectCustomer);
  const cartNote = useAppStore(s=>s.cartNote);
  const setCartNote = useAppStore(s=>s.setCartNote);
  const discount = useAppStore(s=>s.discount);
  const setDiscount = useAppStore(s=>s.setDiscount);
  const sales = useAppStore(s=>s.sales);
  const voidSale = useAppStore(s=>s.voidSale);
  const { can, user, userName, role, avatarUrl, uploadAvatar } = useAuth();
  const online = useOnlineStatus();
  const currentCashierId = useAppStore(s => s.currentCashierId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Compute current cashier's sales stats
  const mySales = sales.filter(s => !s.voided && s.cashierId === currentCashierId);
  const myTotal = mySales.reduce((sum, s) => sum + s.total, 0);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const myTodaySales = mySales.filter(s => new Date(s.createdAt) >= todayStart);
  const myTodayTotal = myTodaySales.reduce((sum, s) => sum + s.total, 0);
  const myTodayItems = myTodaySales.reduce((sum, s) => sum + s.lines.reduce((ls, l) => ls + l.quantity, 0), 0);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [showPay, setShowPay] = useState(false);
  const [momoProvider, setMomoProvider] = useState("MTN Mobile Money");
  const [momoPhone, setMomoPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showHeld, setShowHeld] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === "Escape" && e.target === searchRef.current) {
          setSearch("");
        }
        return;
      }
      if (e.key === "/" || e.key === "?") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length) setShowPay(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length) holdOrder();
      } else if (e.key === "F7") {
        e.preventDefault();
        if (cart.length && confirm("Clear cart?")) clear();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length, payment, discount]);

  // Reset to first page whenever search or category filter changes
  useEffect(() => { setPage(1); }, [search, category]);

  const subtotal = cart.reduce((s,l)=>s+l.unitPrice*l.quantity,0);
  const total = Math.max(0, subtotal - discount);

  const isElectronicPayment = payment === "momo" || payment === "card";

  const complete = async () => {
    if (!cart.length) return;
    if (isElectronicPayment && !online) {
      setMessage("Electronic payments (MoMo/Card) cannot be processed while offline. Use cash, gift card, or wallet instead.");
      return;
    }
    if (payment === "momo" || payment === "card") {
      setPaying(true);
      try {
        const res = await fetch("/api/payments/eganow/initiate", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            amount: total, currency:"GHS", method:payment,
            ...(payment === "momo" ? { provider: momoProvider, phone: momoPhone } : {})
          })
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          // Gateway not configured in demo — still record the sale locally.
          if (res.status !== 501 && res.status !== 500) {
            setMessage(e.error ?? "Payment could not start.");
            setPaying(false);
            return;
          }
        }
      } catch {
        setMessage("Network error while contacting payment service.");
        setPaying(false);
        return;
      }
      setPaying(false);
    }
    const result = checkout(payment);
    setLastSale(result.sale);
    setShowPay(false);
    setMomoPhone("");
    setMessage(`Sale ${result.sale.id.slice(0,8)} completed • ${money(result.total)}`);
  };

  const handlePrint = () => {
    if (!lastSale) return;
    const receipt = buildReceipt(lastSale, defaultSettings);
    browserPrinter.print(receipt);
  };

  /** Keep the order running on the selected table without taking payment yet. */
  const openTab = () => {
    if (!cart.length || !selectedTableId) return;
    const table = tables.find(t => t.id === selectedTableId);
    holdOrder();
    setMessage(`Tab opened on ${table?.name ?? "table"} • ${money(total)} running`);
  };

  const categories: Array<ProductCategory|"All"> = ["All","Beer","Spirits","Wine","Soft Drinks","Energy Drinks","Cigarettes","Snacks","Juice","Water"];
  const filteredProducts = products.filter(p =>
    (category === "All" || p.category === category) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const recentSales = sales.slice(0, 5);

  return <>
    <div className="page-title"><div><p>FAST CHECKOUT</p><h1>POS / Sales</h1></div>
      <div className="pos-actions">
        {heldOrders.length > 0 && <button className="secondary" onClick={() => setShowHeld(!showHeld)}><Pause size={16}/> Held ({heldOrders.length})</button>}
        <button className="secondary" onClick={() => holdOrder()} disabled={!cart.length} title="Hold order (F8)"><Pause size={16}/> Hold <span className="kbd-hint">F8</span></button>
        <button className="secondary" onClick={() => { if (confirm("Clear cart?")) clear(); }} disabled={!cart.length}><Trash2 size={16}/> Clear</button>
      </div>
    </div>

    <div className="cashier-bar">
      <div className="cashier-profile">
        <div className="cashier-avatar" onClick={()=>fileInputRef.current?.click()} title="Click to upload profile picture">
          {avatarUrl ? <img src={avatarUrl} alt={userName} /* eslint-disable-line @next/next/no-img-element */ /> : <span>{userName[0]}</span>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:"none"}} />
        <div className="cashier-info">
          <strong>{userName}</strong>
          <span>{role}</span>
          <small>{user?.email ?? `${role}@emd.com`}</small>
        </div>
      </div>
      <div className="cashier-stats">
        <div className="cashier-stat">
          <small>Today's Sales</small>
          <strong>{myTodaySales.length}</strong>
        </div>
        <div className="cashier-stat">
          <small>Items Sold</small>
          <strong>{myTodayItems}</strong>
        </div>
        <div className="cashier-stat">
          <small>My Total</small>
          <strong className="gold">{money(myTodayTotal)}</strong>
        </div>
        <div className="cashier-stat">
          <small>All-Time Sales</small>
          <strong>{mySales.length}</strong>
        </div>
        <div className="cashier-stat">
          <small>All-Time Total</small>
          <strong className="gold">{money(myTotal)}</strong>
        </div>
      </div>
    </div>

    {showHeld && heldOrders.length > 0 && (
      <div className="held-orders-panel">
        <h3>Held Orders</h3>
        {heldOrders.map(h => (
          <div key={h.id} className="held-order-item">
            <div><b>{h.lines.length} items</b><small>{new Date(h.heldAt).toLocaleTimeString()}</small></div>
            <button className="mini" onClick={() => { resumeHeldOrder(h.id); setShowHeld(false); }}><Play size={12}/> Resume</button>
          </div>
        ))}
      </div>
    )}

    <div className="pos-layout">
      <div className="pos-products-col">
        <div className="search pos-search"><Search size={17}/><input ref={searchRef} placeholder="Search products… (press / to search)" value={search} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSearch(e.target.value)} autoFocus/></div>
        <div className="category-row">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="product-grid">
          {pagedProducts.map(p=>{
            const low = p.stock <= p.reorderLevel;
            return <article className={`product-card ${p.stock<=0?"out-of-stock":""}`} key={p.id}>
            <div className="product-card-head">
              <h3>{p.name}</h3>
              {p.stock<=0 ? <span className="stock-chip out">OUT</span> : low ? <span className="stock-chip low">LOW</span> : null}
            </div>
            <div className="price-buttons">
              <button onClick={()=>add(p.id,"bottle")} disabled={p.stock<=0}><span>Bottle</span>{money(p.bottlePrice)}</button>
              {p.shotPrice && <button className="gold" onClick={()=>add(p.id,"shot")} disabled={p.stock<=0}><span>Shot</span>{money(p.shotPrice)}</button>}
            </div>
          </article>;
          })}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="page-info">Page {currentPage} of {totalPages} · {filteredProducts.length} items</span>
            <div className="page-controls">
              <button className="page-nav" disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))} aria-label="Previous page">‹</button>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(n =>
                <button key={n} className={`page-num ${n===currentPage?"active":""}`} onClick={()=>setPage(n)}>{n}</button>
              )}
              <button className="page-nav" disabled={currentPage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} aria-label="Next page">›</button>
            </div>
          </div>
        )}
        {totalPages === 1 && filteredProducts.length > 0 && (
          <div className="pagination"><span className="page-info">{filteredProducts.length} items</span></div>
        )}
      </div>
      <div className="pos-cart-col">
      <aside className="cart-panel">
        <div className="panel-head"><div><small>CURRENT ORDER</small><h2>Table order</h2></div><button className="text-btn" onClick={clear} title="Clear cart (F7)">Clear <span className="kbd-hint">F7</span></button></div>

        <div className="cart-selects">
          <select value={selectedTableId ?? ""} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>selectTable(e.target.value || undefined)} aria-label="Select table">
            <option value="">No table</option>
            {tables.map(t=><option key={t.id} value={t.id}>{t.name} {t.occupied ? "(occupied)" : ""}</option>)}
          </select>
          <select value={selectedCustomerId ?? ""} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>selectCustomer(e.target.value || undefined)} aria-label="Select customer">
            <option value="">Walk-in customer</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="cart-lines">
          {!cart.length && <div className="empty"><ShoppingCart/><p>Add drinks to start an order.</p></div>}
          {cart.map(l=><div className="cart-line" key={l.id}>
            <div><b>{l.name}</b><small>{l.mode==="shot"?"Shot / Tot":"Bottle"} • {money(l.unitPrice)}</small></div>
            <div className="stepper"><button onClick={()=>qty(l.id,-1)}><Minus/></button><b>{l.quantity}</b><button onClick={()=>qty(l.id,1)}><Plus/></button></div>
            <span className="cart-line-total">{money(l.unitPrice*l.quantity)}</span>
            <button className="cart-line-remove" onClick={()=>qty(l.id,-l.quantity)} aria-label={`Remove ${l.name}`}><Trash2 size={13}/></button>
          </div>)}
        </div>

        <input className="cart-note-input" placeholder="Add a note…" value={cartNote} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setCartNote(e.target.value)} />

        {can("void_sale") && (
          <div className="discount-row">
            <label>Discount</label>
            <input type="number" min="0" value={discount || ""} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setDiscount(Number(e.target.value) || 0)} placeholder="0.00" />
          </div>
        )}

        <div className="payment-pills">{(["cash","momo","card","gift","wallet"] as PaymentMethod[]).map(m=>{
          const isElectronic = m === "momo" || m === "card";
          const disabled = isElectronic && !online;
          return <button className={`${payment===m?"active":""} ${disabled?"disabled-offline":""}`} onClick={()=>!disabled && setPayment(m)} key={m} disabled={disabled} title={disabled?"Not available offline":""}>{m}{disabled && " ⚠"}</button>;
        })}</div>
        <div className="cart-summary">
          <div className="summary-row"><span>Subtotal</span><b>{money(subtotal)}</b></div>
          <div className="summary-row"><span>Discount</span><b className="discount-value">- {money(discount)}</b></div>
        </div>
        <div className="cart-total"><span>TOTAL</span><strong>{money(total)}</strong></div>
        <button className="checkout" disabled={!cart.length} onClick={()=>setShowPay(true)} title="Checkout (F9)"><CreditCard/> PAY NOW <span className="kbd-hint">F9</span></button>
        <div className="cart-secondary-actions">
          <button className="secondary" disabled={!cart.length || !selectedTableId} onClick={openTab} title="Keep this order open on the selected table"><LayoutGrid size={15}/> OPEN TAB</button>
          <button className="secondary" disabled={!cart.length} onClick={()=>{holdOrder();setMessage("Order saved to held orders.")}} title="Save order for later (F8)"><Pause size={15}/> SAVE ORDER</button>
        </div>
        {lastSale && <button className="secondary receipt-btn" onClick={handlePrint}><Printer size={16}/> Print receipt</button>}
        {message && <div className="notice">{message}</div>}

        {recentSales.length > 0 && (
          <div className="recent-sales">
            <small>RECENT SALES</small>
            {recentSales.map(s => (
              <div key={s.id} className="recent-sale-item">
                <span>{s.id.slice(0,8)}</span>
                <span>{money(s.total)}</span>
                <span>{s.paymentMethod.toUpperCase()}</span>
                {can("void_sale") && !s.voided && <button className="mini danger-mini" onClick={() => { if (confirm("Void this sale?")) voidSale(s.id); }}>Void</button>}
                {s.voided && <span className="voided-tag">VOIDED</span>}
              </div>
            ))}
          </div>
        )}
      </aside>
      </div>
    </div>

    {showPay && (
      <div className="modal-overlay" onClick={()=>!paying && setShowPay(false)}>
        <div className="modal-card pay-modal" onClick={(e:React.MouseEvent<HTMLDivElement>)=>e.stopPropagation()}>
          <div className="pay-amount">
            <small>TOTAL AMOUNT</small>
            <strong>{money(total)}</strong>
          </div>

          <p className="pay-label">Select Payment Method</p>
          <div className="pay-methods">
            {([
              ["cash","Cash",<Banknote key="c" size={17}/>],
              ["momo","Mobile Money",<Smartphone key="m" size={17}/>],
              ["card","Card",<CreditCard key="k" size={17}/>],
              ["gift","Gift Card",<Gift key="g" size={17}/>],
              ["wallet","Wallet",<WalletCards key="w" size={17}/>]
            ] as Array<[PaymentMethod,string,React.ReactNode]>).map(([m,label,icon])=>{
              const isElectronic = m === "momo" || m === "card";
              const disabled = isElectronic && !online;
              return (
                <button key={m} className={`${payment===m?"active":""}`} disabled={disabled}
                  title={disabled?"Not available offline":""} onClick={()=>setPayment(m)}>
                  {icon}<span>{label}</span>
                  {disabled && <em>offline</em>}
                  {payment===m && <CheckCircle2 size={15} className="pay-check"/>}
                </button>
              );
            })}
          </div>

          {payment === "momo" && (
            <div className="pay-fields">
              <label>
                <small>Mobile Money Provider</small>
                <select value={momoProvider} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setMomoProvider(e.target.value)}>
                  <option>MTN Mobile Money</option>
                  <option>Telecel Cash</option>
                  <option>AirtelTigo Money</option>
                </select>
              </label>
              <label>
                <small>Phone Number</small>
                <input inputMode="tel" placeholder="055 123 4567" value={momoPhone}
                  onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setMomoPhone(e.target.value)}/>
              </label>
            </div>
          )}

          {payment === "card" && (
            <div className="pay-note"><CreditCard size={14}/> Customer will be prompted on the card terminal.</div>
          )}
          {payment === "cash" && (
            <div className="pay-note"><Banknote size={14}/> Collect {money(total)} in cash and confirm below.</div>
          )}

          <button className="checkout pay-confirm" disabled={paying || (payment==="momo" && momoPhone.trim().length < 9)} onClick={complete}>
            {paying ? <><Loader2 size={17} className="animate-spin"/> Processing…</> : <>Pay {money(total)}</>}
          </button>
          <button className="pay-cancel" disabled={paying} onClick={()=>setShowPay(false)}>Cancel</button>
        </div>
      </div>
    )}
  </>;
}

function CustomerOrdersPanel() {
  const customerOrders = useAppStore(s => s.customerOrders);
  const customers = useAppStore(s => s.customers);
  const tables = useAppStore(s => s.tables);
  const updateCustomerOrderStatus = useAppStore(s => s.updateCustomerOrderStatus);
  const waiterCalls = useAppStore(s => s.waiterCalls);
  const updateWaiterCall = useAppStore(s => s.updateWaiterCall);
  const { can } = useAuth();

  const statusFlow: Array<{ key: "pending" | "preparing" | "served" | "paid"; label: string; next?: "preparing" | "served" | "paid"; nextLabel?: string }> = [
    { key: "pending", label: "Pending", next: "preparing", nextLabel: "Start Preparing" },
    { key: "preparing", label: "Preparing", next: "served", nextLabel: "Mark Served" },
    { key: "served", label: "Served", next: "paid", nextLabel: "Mark Paid" },
    { key: "paid", label: "Paid" }
  ];

  const pendingCalls = waiterCalls.filter(c => c.status === "pending");

  if (customerOrders.length === 0 && pendingCalls.length === 0) {
    return (
      <div className="customer-orders-panel">
        <h3 className="panel-title">
          Customer Activity
          <span className="live-indicator"><span className="live-dot" /> Live</span>
        </h3>
        <div className="customer-activity-empty">
          <ReceiptText size={32} />
          <p>No customer activity yet. Customers can place orders from the <a href="/portal" target="_blank" rel="noopener noreferrer" className="inline-link">Customer Portal</a>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-orders-panel">
      <h3 className="panel-title">
        Customer Activity
        <span className="live-indicator"><span className="live-dot" /> Live</span>
      </h3>

      {pendingCalls.length > 0 && (
        <div className="waiter-calls-section">
          <h4><Bell size={14} /> Waiter Calls ({pendingCalls.length})</h4>
          {pendingCalls.map(c => {
            const table = tables.find(t => t.id === c.tableId);
            return (
              <div key={c.id} className="waiter-call-card">
                <div>
                  <strong>{table?.name ?? "Unknown table"}</strong>
                  <small>{c.message ?? "Table is calling for service"}</small>
                  <small className="call-time">{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                </div>
                <button className="mini btn-primary" onClick={() => updateWaiterCall(c.id, { status: "arrived" })}>
                  <CheckCircle2 size={12} /> Arrived
                </button>
              </div>
            );
          })}
        </div>
      )}

      {customerOrders.length > 0 && (
        <div className="customer-orders-section">
          <h4><ReceiptText size={14} /> Customer Orders ({customerOrders.length})</h4>
          {customerOrders.map(o => {
            const customer = customers.find(c => c.id === o.customerId);
            const table = tables.find(t => t.id === o.tableId);
            const total = o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
            const statusInfo = statusFlow.find(s => s.key === o.status)!;
            return (
              <div key={o.id} className="customer-order-card">
                <div className="customer-order-top">
                  <div>
                    <strong>Order #{o.id.slice(-4)}</strong>
                    <small>{customer?.name ?? "Walk-in"} • {table?.name ?? "No table"}</small>
                  </div>
                  <span className={`customer-order-status ${o.status}`}>{statusInfo.label}</span>
                </div>
                <div className="customer-order-items">
                  {o.lines.map(l => (
                    <div key={l.id} className="customer-order-item">
                      <span>{l.quantity}x {l.name}</span>
                      <b>{money(l.unitPrice * l.quantity)}</b>
                    </div>
                  ))}
                </div>
                {o.note && <div className="customer-order-note">Note: {o.note}</div>}
                <div className="customer-order-bottom">
                  <span className="customer-order-total">Total: <b>{money(total)}</b></span>
                  {statusInfo.next && can("sell") && (
                    <button className="mini btn-primary" onClick={() => updateCustomerOrderStatus(o.id, statusInfo.next!)}>
                      {statusInfo.nextLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tables() {
  const tables = useAppStore(s=>s.tables);
  const toggle = useAppStore(s=>s.toggleTable);
  const select = useAppStore(s=>s.selectTable);
  const transferTable = useAppStore(s=>s.transferTable);
  const splitBill = useAppStore(s=>s.splitBill);
  const sales = useAppStore(s=>s.sales);
  const selected = useAppStore(s=>s.selectedTableId);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [splitTableId, setSplitTableId] = useState<string | null>(null);
  const [splitLines, setSplitLines] = useState<Set<string>>(new Set());
  const [qrTableId, setQrTableId] = useState<string | null>(null);

  const handleTableClick = (id: string) => {
    if (transferFrom) {
      if (id !== transferFrom) {
        transferTable(transferFrom, id);
      }
      setTransferFrom(null);
    } else {
      select(id);
      toggle(id);
    }
  };

  const openSplit = (tableId: string) => {
    const tableSale = sales.find(s => s.tableId === tableId && !s.voided);
    if (tableSale) {
      setSplitTableId(tableId);
      setSplitLines(new Set());
    }
  };

  const splitSale = splitTableId ? sales.find(s => s.tableId === splitTableId && !s.voided) : null;

  const toggleSplitLine = (lineId: string) => {
    setSplitLines(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const confirmSplit = () => {
    if (!splitSale || splitLines.size === 0 || !splitTableId) return;
    const lineIds = Array.from(splitLines);
    splitBill(splitTableId, lineIds);
    setSplitTableId(null);
    setSplitLines(new Set());
  };

  return <PageBox title="Tables" subtitle="Open, close and manage bar tables">
    {transferFrom && <div className="notice">Select a target table to transfer from {tables.find(t=>t.id===transferFrom)?.name}</div>}
    <div className="table-grid">{tables.map(t=><div key={t.id} role="button" tabIndex={0} className={`table-card ${t.occupied?"occupied":"available"} ${selected===t.id?"selected":""} ${transferFrom===t.id?"transfer-source":""}`} onClick={()=>handleTableClick(t.id)} onKeyDown={(e:React.KeyboardEvent)=>{if(e.key==="Enter"||e.key===" ")handleTableClick(t.id)}}>
      <LayoutGrid/><h3>{t.name}</h3><span>{t.occupied?"Occupied":"Available"}</span><b>{money(t.bill)}</b>
      <div className="table-actions">
        <button className="mini qr-btn" onClick={(e:React.MouseEvent<HTMLButtonElement>)=>{e.stopPropagation();setQrTableId(t.id)}}><Smartphone size={11}/> QR</button>
        {t.occupied && <button className="mini transfer-btn" onClick={(e:React.MouseEvent<HTMLButtonElement>)=>{e.stopPropagation();setTransferFrom(t.id)}}><ArrowRightLeft size={11}/> Transfer</button>}
        {t.occupied && <button className="mini split-btn" onClick={(e:React.MouseEvent<HTMLButtonElement>)=>{e.stopPropagation();openSplit(t.id)}}><Scissors size={11}/> Split</button>}
      </div>
    </div>)}</div>

    <CustomerOrdersPanel />

    {qrTableId && (
      <div className="modal-overlay" onClick={()=>setQrTableId(null)}>
        <div className="modal-card qr-modal" onClick={(e:React.MouseEvent<HTMLDivElement>)=>e.stopPropagation()}>
          <h2>{tables.find(t=>t.id===qrTableId)?.name} — QR Code</h2>
          <p className="modal-subtitle">Customers scan this to open the portal and order to this table</p>
          <div className="qr-display">
            <QRCodeSVG
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/portal?table=${qrTableId}`}
              size={220}
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="qr-url">
            <Smartphone size={14} /> {`/portal?table=${qrTableId}`}
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={()=>setQrTableId(null)}>Close</button>
            <button className="btn-primary" onClick={()=>window.print()}>Print</button>
          </div>
        </div>
      </div>
    )}

    {splitTableId && splitSale && (
      <div className="modal-overlay" onClick={()=>setSplitTableId(null)}>
        <div className="modal-card" onClick={(e:React.MouseEvent<HTMLDivElement>)=>e.stopPropagation()}>
          <h2>Split Bill — {tables.find(t=>t.id===splitTableId)?.name}</h2>
          <p className="modal-subtitle">Select items to move to a new bill</p>
          <div className="split-lines">
            {splitSale.lines.map(l => (
              <label key={l.id} className={`split-line ${splitLines.has(l.id)?"selected":""}`}>
                <input type="checkbox" checked={splitLines.has(l.id)} onChange={()=>toggleSplitLine(l.id)} />
                <span className="split-line-name">{l.name}</span>
                <span className="split-line-detail">{l.mode} × {l.quantity}</span>
                <span className="split-line-price">{money(l.unitPrice * l.quantity)}</span>
              </label>
            ))}
          </div>
          <div className="split-summary">
            <span>New bill: <strong>{money(splitSale.lines.filter(l=>splitLines.has(l.id)).reduce((s,l)=>s+l.unitPrice*l.quantity,0))}</strong></span>
            <span>Remaining: <strong>{money(splitSale.lines.filter(l=>!splitLines.has(l.id)).reduce((s,l)=>s+l.unitPrice*l.quantity,0))}</strong></span>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={()=>setSplitTableId(null)}>Cancel</button>
            <button className="btn-primary" disabled={splitLines.size===0} onClick={confirmSplit}>Confirm Split</button>
          </div>
        </div>
      </div>
    )}
  </PageBox>;
}

function Inventory() {
  const products = useAppStore(s=>s.products);
  const addStock = useAppStore(s=>s.addStock);
  const adjustStock = useAppStore(s=>s.adjustStock);
  const toggleProductActive = useAppStore(s=>s.toggleProductActive);
  const addProduct = useAppStore(s=>s.addProduct);
  const updateProduct = useAppStore(s=>s.updateProduct);
  const stockMovements = useAppStore(s=>s.stockMovements);
  const { can, isDemoMode } = useAuth();
  const [showMovements, setShowMovements] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel && p.active).length;
  const healthyCount = products.filter(p => p.stock > p.reorderLevel && p.active).length;
  const totalStockValue = products.reduce((s, p) => s + p.stock * p.bottlePrice, 0);

  return <PageBox title="Inventory" subtitle="Bottle stock and open-shot inventory">
    <div className="metric-grid" style={{marginBottom:16}}>
      <Metric label="TOTAL PRODUCTS" value={String(totalProducts)} sub={`${products.filter(p=>p.active).length} active`} icon={<Package/>}/>
      <Metric label="LOW STOCK" value={String(lowStockCount)} sub="Need restocking" danger={lowStockCount>0} icon={<AlertTriangle/>}/>
      <Metric label="HEALTHY STOCK" value={String(healthyCount)} sub="Above reorder level" icon={<CheckCircle2/>}/>
      <Metric label="STOCK VALUE" value={money(totalStockValue)} sub="At bottle price" icon={<CircleDollarSign/>}/>
      <Metric label="CATEGORIES" value={String(new Set(products.map(p=>p.category)).size)} sub="Product types" icon={<Boxes/>}/>
    </div>

    <div className="inline-form">
      {can("manage_inventory") && <button className="primary" onClick={() => { setEditingProduct(null); setShowForm(true); }}><Plus/> Add product</button>}
      <button className="secondary" onClick={() => setShowMovements(!showMovements)}><Package/> Movement history</button>
    </div>

    {showMovements && (
      <div className="responsive-table" style={{marginBottom:"14px"}}>
        <table><thead><tr><th>Product</th><th>Type</th><th>Bottle Δ</th><th>Shot Δ</th><th>Reason</th><th>Date</th></tr></thead>
          <tbody>{stockMovements.slice(0,20).map(m=><tr key={m.id}><td>{m.productName}</td><td>{m.movementType.replace(/_/g," ")}</td><td>{m.bottleDelta>0?"+":""}{m.bottleDelta}</td><td>{m.shotDelta>0?"+":""}{m.shotDelta}</td><td>{m.reason}</td><td>{new Date(m.createdAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    )}

    <div className="responsive-table">
      <table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Shots left</th><th>Reorder</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{products.map(p=><tr key={p.id}><td className="product-cell"><div className="product-cell-img">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="product-thumb" loading="lazy" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}}/> : <div className="product-thumb-svg"><ProductVisual product={p}/></div>}</div><b>{p.name}</b>{!p.active && <span className="voided-tag" style={{marginLeft:"6px"}}>INACTIVE</span>}</td><td>{p.category}</td><td><b className={p.stock<=p.reorderLevel?"danger-text":""}>{p.stock}</b></td><td>{p.shotsPerBottle ? `${p.remainingShots ?? p.shotsPerBottle}/${p.shotsPerBottle}` : "—"}</td><td>{p.reorderLevel}</td><td><StockBadge product={p}/></td><td><div className="button-row">{can("manage_inventory") && <button className="mini" onClick={()=>addStock(p.id,5)}>+5</button>}{can("manage_inventory") && <button className="mini" onClick={()=>adjustStock(p.id,-1,"Manual adjustment out")}>-1</button>}{can("manage_inventory") && <button className="mini" onClick={()=>{ setEditingProduct(p); setShowForm(true); }}><Pencil size={12}/> Edit</button>}{can("manage_inventory") && <button className="mini" onClick={()=>toggleProductActive(p.id)}>{p.active?"Deactivate":"Activate"}</button>}</div></td></tr>)}</tbody></table>
    </div>

    {showForm && can("manage_inventory") && (
      <ProductFormModal
        product={editingProduct}
        isDemoMode={isDemoMode}
        onClose={() => { setShowForm(false); setEditingProduct(null); }}
        onSave={(data) => {
          if (editingProduct) {
            updateProduct(editingProduct.id, data);
          } else {
            addProduct(data);
          }
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    )}
  </PageBox>;
}

const PRODUCT_CATEGORIES: ProductCategory[] = ["Beer","Spirits","Wine","Soft Drinks","Energy Drinks","Cigarettes","Snacks","Juice","Water"];
const SHOT_CATEGORIES: ProductCategory[] = ["Spirits","Wine"];

function ProductFormModal({ product, isDemoMode, onClose, onSave }: {
  product: Product | null;
  isDemoMode: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, "id" | "active">) => void;
}) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "Beer");
  const [bottlePrice, setBottlePrice] = useState(String(product?.bottlePrice ?? ""));
  const [shotPrice, setShotPrice] = useState(product?.shotPrice != null ? String(product.shotPrice) : "");
  const [costPrice, setCostPrice] = useState(product?.costPrice != null ? String(product.costPrice) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [reorderLevel, setReorderLevel] = useState(String(product?.reorderLevel ?? 10));
  const [shotsPerBottle, setShotsPerBottle] = useState(product?.shotsPerBottle != null ? String(product.shotsPerBottle) : "");
  const [remainingShots, setRemainingShots] = useState(product?.remainingShots != null ? String(product.remainingShots) : "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(product?.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasShots = SHOT_CATEGORIES.includes(category);
  const previewSrc = imageUrl;

  const handleImageSelect = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { setUploadError("Image must be under 2MB"); return; }

    if (isDemoMode) {
      // Demo mode: convert to data URL stored in zustand
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Production mode: upload to Supabase storage
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("products").upload(path, file, { upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
      setImageUrl(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (!bottlePrice || Number(bottlePrice) <= 0) return;
    const data: Omit<Product, "id" | "active"> = {
      name: name.trim(),
      category,
      bottlePrice: Number(bottlePrice),
      stock: Number(stock) || 0,
      reorderLevel: Number(reorderLevel) || 0,
      imageUrl,
    };
    if (costPrice && Number(costPrice) > 0) data.costPrice = Number(costPrice);
    if (hasShots) {
      if (shotPrice && Number(shotPrice) > 0) data.shotPrice = Number(shotPrice);
      if (shotsPerBottle) {
        data.shotsPerBottle = Number(shotsPerBottle);
        data.remainingShots = Number(remainingShots) || 0;
      }
    }
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card product-form-modal" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <h2>{isEdit ? "Edit Product" : "Add Product"}</h2>
        <p className="modal-subtitle">{isEdit ? "Update product details" : "Create a new product for your inventory"}</p>

        <div className="product-form-grid">
          <div className="product-form-image">
            <div className="product-form-preview">
              {previewSrc ? (
                <img src={previewSrc} alt="Preview" className="product-form-preview-img" />
              ) : (
                <div className="product-form-preview-svg">
                  <ProductVisual product={{ id: "preview", name, category, bottlePrice: Number(bottlePrice) || 0, stock: 0, reorderLevel: 0, active: true } as Product} />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
            />
            <button type="button" className="btn-secondary product-form-upload-btn" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
              {uploading ? "Uploading..." : "Upload image"}
            </button>
            {imageUrl && (
              <button type="button" className="btn-secondary product-form-clear-btn" onClick={() => { setImageUrl(undefined); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                <Trash2 size={12} /> Remove image
              </button>
            )}
            {uploadError && <small className="danger-text">{uploadError}</small>}
            {!imageUrl && <small className="muted-text">No image? A branded SVG will be used.</small>}
          </div>

          <div className="product-form-fields">
            <label className="product-form-label">Product name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Club Beer" /></label>
            <label className="product-form-label">Category
              <select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="product-form-label">Bottle price (GHS)<input type="number" value={bottlePrice} onChange={(e) => setBottlePrice(e.target.value)} placeholder="18" /></label>
            <label className="product-form-label">Cost price (GHS)<input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="12" /></label>
            {hasShots && (
              <>
                <label className="product-form-label">Shot price (GHS)<input type="number" value={shotPrice} onChange={(e) => setShotPrice(e.target.value)} placeholder="15" /></label>
                <label className="product-form-label">Shots per bottle<input type="number" value={shotsPerBottle} onChange={(e) => setShotsPerBottle(e.target.value)} placeholder="15" /></label>
                <label className="product-form-label">Remaining shots<input type="number" value={remainingShots} onChange={(e) => setRemainingShots(e.target.value)} placeholder="0" /></label>
              </>
            )}
            <label className="product-form-label">Stock (bottles)<input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" /></label>
            <label className="product-form-label">Reorder level<input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} placeholder="10" /></label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!name.trim() || !bottlePrice || Number(bottlePrice) <= 0} onClick={handleSave}>
            {isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Customers() {
  const customers = useAppStore(s=>s.customers);
  const sales = useAppStore(s=>s.sales);
  const addCustomer = useAppStore(s=>s.addCustomer);
  const ranked = customerRanking(customers);
  const [name,setName]=useState(""); const [phone,setPhone]=useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCustomer = selectedId ? customers.find(c => c.id === selectedId) : null;
  const customerSales = selectedId ? sales.filter(s => s.customerId === selectedId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  if (selectedCustomer) {
    return <PageBox title="Customer Detail" subtitle={selectedCustomer.name}>
      <button className="secondary" style={{marginBottom:14}} onClick={()=>setSelectedId(null)}><ArrowUpRight size={14}/> Back to customers</button>
      <div className="customer-detail-header">
        <div className="avatar large">{selectedCustomer.name[0]}</div>
        <div>
          <h2>{selectedCustomer.name}</h2>
          <small>{selectedCustomer.phone}</small>
        </div>
      </div>
      <div className="metric-grid" style={{marginBottom:16}}>
        <Metric label="TOTAL SPENT" value={money(selectedCustomer.totalSpent)} sub={`${customerSales.length} orders`} icon={<TrendingUp/>}/>
        <Metric label="DEBT" value={money(selectedCustomer.debt)} sub={selectedCustomer.debt>0?"Outstanding":"Clear"} danger={selectedCustomer.debt>0} icon={<ReceiptText/>}/>
        <Metric label="WALLET" value={money(selectedCustomer.walletBalance)} sub="Balance" icon={<WalletCards/>}/>
        <Metric label="LOYALTY" value={`${selectedCustomer.loyaltyPoints}`} sub="Points" icon={<Trophy/>}/>
      </div>
      <h3>Order History</h3>
      {customerSales.length === 0 ? <p className="muted-text">No orders yet.</p> : (
        <div className="responsive-table"><table><thead><tr><th>Date</th><th>Items</th><th>Method</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{customerSales.map(s=><tr key={s.id} className={s.voided?"voided-row":""}>
            <td>{new Date(s.createdAt).toLocaleString()}</td>
            <td>{s.lines.reduce((sum,l)=>sum+l.quantity,0)} items</td>
            <td>{s.paymentMethod.toUpperCase()}</td>
            <td>{money(s.total)}</td>
            <td>{s.voided ? <Status ok={false} label="VOIDED"/> : <Status ok={s.paymentStatus==="successful"} label={s.paymentStatus}/>}</td>
          </tr>)}</tbody>
        </table></div>
      )}
    </PageBox>;
  }

  return <PageBox title="Customers" subtitle="Spending, loyalty and customer value">
    <div className="inline-form"><input placeholder="Customer name" value={name} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setName(e.target.value)}/><input placeholder="Phone" value={phone} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setPhone(e.target.value)}/><button className="primary" onClick={()=>{if(name&&phone){addCustomer(name,phone);setName("");setPhone("")}}}><Plus/> Add customer</button></div>
    <div className="card-grid">{ranked.map((c, i)=><article className="info-card clickable" key={c.id} onClick={()=>setSelectedId(c.id)}><div className="avatar">{c.name[0]}</div>{i===0 && <span className="rank-badge">#{i+1}</span>}<h3>{c.name}</h3><small>{c.phone}</small><div className="info-row"><span>Spent</span><b>{money(c.totalSpent)}</b></div><div className="info-row"><span>Debt</span><b className={c.debt>0?"danger-text":""}>{money(c.debt)}</b></div><div className="info-row"><span>Wallet</span><b>{money(c.walletBalance)}</b></div><div className="info-row"><span>Points</span><b>{c.loyaltyPoints}</b></div><div className="info-row"><span>Visits</span><b>{c.visitCount}</b></div><small className="view-detail-hint">Click to view order history →</small></article>)}</div>
  </PageBox>;
}

function Debts() {
  const debts = useAppStore(s=>s.debts);
  const addDebt = useAppStore(s=>s.addDebt);
  const payDebt = useAppStore(s=>s.payDebt);
  const customers = useAppStore(s=>s.customers);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState<Record<string, PaymentMethod>>({});
  const aging = useMemo(() => debtAging(debts), [debts]);
  const totalOutstanding = debts.reduce((s, d) => s + d.outstandingAmount, 0);

  return <PageBox title="Debts" subtitle="Know exactly who owes and how much">
    <div className="metric-grid">
      <Metric label="TOTAL OUTSTANDING" value={money(totalOutstanding)} sub={`${debts.length} debts`} danger icon={<ReceiptText/>}/>
      <Metric label="OVERDUE" value={money(aging.overdue)} sub="past due date" danger icon={<Clock/>}/>
      <Metric label="CURRENT (≤30d)" value={money(aging.current)} sub="within terms" icon={<CheckCircle2/>}/>
    </div>
    <div className="responsive-table"><table><thead><tr><th>Customer</th><th>Original</th><th>Outstanding</th><th>Due Date</th><th>Age</th><th>Payments</th><th>Pay</th></tr></thead>
      <tbody>{debts.filter(d=>d.outstandingAmount>0).sort((a,b)=>b.outstandingAmount-a.outstandingAmount).map(d=>{
        const days = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000);
        const overdue = d.dueDate && new Date(d.dueDate) < new Date();
        return <tr key={d.id}><td><b>{d.customerName}</b></td><td>{money(d.originalAmount)}</td><td className="danger-text">{money(d.outstandingAmount)}</td><td>{d.dueDate ?? "—"}</td><td className={overdue?"danger-text":""}>{days}d{overdue?" ⚠":""}</td><td>{d.payments.length} payment(s)</td><td><div className="button-row"><input type="number" placeholder="Amt" style={{width:"60px"}} value={payAmount[d.id] ?? ""} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setPayAmount({...payAmount,[d.id]:e.target.value})}/><select value={payMethod[d.id] ?? "cash"} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setPayMethod({...payMethod,[d.id]:e.target.value as PaymentMethod})}><option value="cash">Cash</option><option value="momo">MoMo</option><option value="wallet">Wallet</option></select><button className="mini" onClick={()=>{const amt=Number(payAmount[d.id] ?? 0);if(amt>0){payDebt(d.id,amt,payMethod[d.id] ?? "cash");setPayAmount({...payAmount,[d.id]:""})}}}>Pay</button></div></td></tr>;
      })}</tbody>
    </table></div>
    <div className="inline-form" style={{marginTop:"12px"}}>
      <select onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>{const cid=e.target.value; if(cid) addDebt(cid, Number(prompt("Debt amount (GHS):") ?? 0))}} defaultValue="">
        <option value="" disabled>Add new debt for customer…</option>
        {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  </PageBox>;
}

function Payments() {
  const sales = useAppStore(s=>s.sales);
  const validSales = sales.filter(s=>!s.voided);
  const totalRevenue = validSales.reduce((a,s)=>a+s.total,0);
  const reconciled = validSales.filter(s=>s.paymentStatus==="successful").length;
  const pending = validSales.filter(s=>s.paymentStatus==="pending").length;
  return <PageBox title="Payments" subtitle="Cash, Eganow MoMo, cards, gift cards and wallets">
    <div className="method-grid">{(["momo","cash","card","gift","wallet"] as PaymentMethod[]).map(m=>{
      const total=validSales.filter(s=>s.paymentMethod===m).reduce((a,s)=>a+s.total,0);
      const count=validSales.filter(s=>s.paymentMethod===m).length;
      return <article className="method-card" key={m}><Smartphone/><small>{m.toUpperCase()}</small><strong>{money(total)}</strong><span>{count} transactions</span></article>
    })}</div>
    <div className="metric-grid" style={{marginBottom:14}}>
      <Metric label="TOTAL REVENUE" value={money(totalRevenue)} sub={`${validSales.length} sales`} icon={<TrendingUp/>}/>
      <Metric label="RECONCILED" value={`${reconciled}`} sub="settled payments" icon={<CheckCircle2/>}/>
      <Metric label="PENDING" value={`${pending}`} sub="awaiting settlement" danger={pending>0} icon={<Clock/>}/>
    </div>
    <div className="responsive-table"><table><thead><tr><th>Reference</th><th>Method</th><th>Provider</th><th>Amount</th><th>Date</th><th>Status</th><th>Reconciliation</th></tr></thead>
      <tbody>{sales.map(s=>{
        const provider = s.paymentMethod==="momo"?"Eganow":s.paymentMethod==="card"?"Eganow":s.paymentMethod==="gift"?"EMD Gift":s.paymentMethod==="wallet"?"EMD Wallet":"Cash desk";
        const reconciled = s.paymentStatus==="successful" && !s.voided;
        return <tr key={s.id} className={s.voided?"voided-row":""}>
          <td>{s.id.slice(0,10)}</td>
          <td>{s.paymentMethod.toUpperCase()}</td>
          <td><small>{provider}</small></td>
          <td>{money(s.total)}</td>
          <td>{new Date(s.createdAt).toLocaleString()}</td>
          <td>{s.voided ? <Status ok={false} label="VOIDED"/> : <Status ok={s.paymentStatus==="successful"} label={s.paymentStatus}/>}</td>
          <td>{s.voided ? <span className="muted-text">—</span> : reconciled ? <Status ok={true} label="Reconciled"/> : <Status ok={false} label="Pending"/>}</td>
        </tr>;
      })}</tbody>
    </table></div>
  </PageBox>;
}

function GiftCards() {
  const cards = useAppStore(s=>s.giftCards);
  const create = useAppStore(s=>s.createGiftCard);
  const redeem = useAppStore(s=>s.redeemGiftCard);
  const [amount,setAmount]=useState("100"); const [code,setCode]=useState(""); const [redeemAmount,setRedeemAmount]=useState("50"); const [msg,setMsg]=useState("");
  const [lookup,setLookup]=useState<{code:string;balance:number;status:GiftCardStatus}|null>(null);

  const activeCard = cards.find(c => c.code === code.trim().toUpperCase());
  const featured = lookup ?? (cards[0] ? { code: cards[0].code, balance: cards[0].balance, status: cards[0].status } : null);

  const checkBalance = () => {
    if (!activeCard) { setLookup(null); setMsg("No card found with that code."); return; }
    setLookup({ code: activeCard.code, balance: activeCard.balance, status: activeCard.status });
    setMsg(`${activeCard.code} • ${money(activeCard.balance)} available`);
  };

  return <PageBox title="Gift Cards" subtitle="Sell, check and redeem EMD credit">
    <div className="gift-layout">
      <div className="gift-create">
        <div className="gift-preview">
          <Crown/>
          <small>EMD DRINKING SPORTS</small>
          <strong>GIFT CARD</strong>
          <span className="gift-code">{featured?.code ?? "EMD-XXXX-XXXX"}</span>
          <div className="gift-preview-foot">
            <div><small>Balance</small><b>{money(featured?.balance ?? 0)}</b></div>
            <div><small>Status</small><b className={featured?.status === "active" ? "gold" : ""}>{(featured?.status ?? "—").toUpperCase()}</b></div>
          </div>
        </div>
        <div className="gift-amount-row">
          {[50,100,200,500].map(a=>(
            <button key={a} className={amount===String(a)?"active":""} onClick={()=>setAmount(String(a))}>{money(a)}</button>
          ))}
        </div>
        <div className="inline-form">
          <input type="number" value={amount} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setAmount(e.target.value)}/>
          <button className="primary" onClick={()=>{const c=create(Number(amount));setLookup({code:c.code,balance:c.balance,status:c.status});setMsg(`Created ${c.code}`)}}><Gift/> Buy Gift Card</button>
        </div>
      </div>
      <div>
        <h3>Check balance &amp; redeem</h3>
        <div className="stack-form">
          <input placeholder="Gift card code e.g. EMD-9XK2-44LM" value={code} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setCode(e.target.value)}/>
          <button className="secondary" onClick={checkBalance}><Search size={15}/> Check Balance</button>
          <input type="number" value={redeemAmount} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setRedeemAmount(e.target.value)}/>
          <button className="secondary" onClick={()=>{const ok=redeem(code,Number(redeemAmount));setMsg(ok?"Redeemed successfully":"Invalid card or insufficient balance");if(ok){const c=cards.find(x=>x.code===code.trim().toUpperCase());if(c)setLookup({code:c.code,balance:c.balance,status:c.status});}}}><Gift size={15}/> Redeem Card</button>
        </div>
        {msg&&<div className="notice">{msg}</div>}
      </div>
    </div>
    <div className="card-grid">{cards.map(c=><article className="info-card" key={c.id}><Gift/><h3>{c.code}</h3><strong className="gold-text">{money(c.balance)}</strong>{c.expiryDate && <small className="muted-text">Expires: {new Date(c.expiryDate).toLocaleDateString()}</small>}<Status ok={c.status==="active"} label={c.status}/></article>)}</div>
  </PageBox>;
}

function Wallets() {
  const customers=useAppStore(s=>s.customers);
  const topUpWallet=useAppStore(s=>s.topUpWallet);
  const [topupAmount, setTopupAmount] = useState<Record<string, string>>({});
  return <PageBox title="Wallets & Loyalty" subtitle="Reward the people who keep coming back">
    <div className="card-grid">{customers.map(c=><article className="info-card" key={c.id}><WalletCards/><h3>{c.name}</h3><div className="big-number">{c.loyaltyPoints}</div><small>Loyalty points</small><div className="info-row"><span>Wallet</span><b>{money(c.walletBalance)}</b></div><div className="progress"><i style={{width:`${Math.min(100,c.loyaltyPoints)}%`}}/></div><div className="button-row"><input type="number" placeholder="Top up" style={{width:"70px"}} value={topupAmount[c.id] ?? ""} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setTopupAmount({...topupAmount,[c.id]:e.target.value})}/><button className="mini" onClick={()=>{const amt=Number(topupAmount[c.id] ?? 0);if(amt>0){topUpWallet(c.id,amt);setTopupAmount({...topupAmount,[c.id]:""})}}}>Top up</button></div></article>)}</div>
  </PageBox>;
}

function Reports() {
  const sales=useAppStore(s=>s.sales); const products=useAppStore(s=>s.products); const customers=useAppStore(s=>s.customers);
  const expenses=useAppStore(s=>s.expenses);
  const insights=businessInsights(products,customers,sales);
  const profit=estimatedProfitCalc(sales,expenses,products);
  const valuation=stockValuation(products);
  const weeklySeries = useMemo(() => weeklySalesSeries(sales), [sales]);
  const productUnits = new Map<string, number>();
  sales.filter(s=>!s.voided).forEach(s=>s.lines.forEach(l=>productUnits.set(l.productId,(productUnits.get(l.productId) ?? 0)+l.quantity)));
  const barDataFull = products.map(p=>({name:p.name.slice(0,8),units:productUnits.get(p.id) ?? 0})).sort((a,b)=>b.units-a.units).slice(0,8);

  return <PageBox title="Reports" subtitle="Understand what is moving and what is not">
    <div className="metric-grid" style={{marginBottom:"16px"}}>
      <Metric label="TOTAL REVENUE" value={money(insights.totalSales)} sub="all sales" icon={<TrendingUp/>}/>
      <Metric label="EST. PROFIT" value={money(profit)} sub="after COGS + expenses" icon={<TrendingUp/>}/>
      <Metric label="STOCK VALUE" value={money(valuation)} sub="current inventory" icon={<Package/>}/>
      <Metric label="SLOW MOVING" value={String(insights.slowMoving.length)} sub="zero sales" icon={<TrendingDown/>}/>
    </div>
    <div className="dashboard-grid">
      <Panel title="Revenue trend" className="span2"><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeklySeries}><XAxis dataKey="name" stroke="#777"/><YAxis stroke="#777"/><Tooltip contentStyle={{background:"#111",border:"1px solid #333"}}/><Line dataKey="value" stroke="#f9c317" strokeWidth={3}/></LineChart></ResponsiveContainer></div></Panel>
      <Panel title="Product intelligence"><div className="report-list"><Insight title="Top selling" value={insights.bestSeller?.name ?? "—"}/><Insight title="Least selling" value={insights.leastSeller?.name ?? "—"} danger/><Insight title="Highest inventory" value={insights.highStock[0]?.name ?? "—"}/><Insight title="Slow moving" value={`${insights.slowMoving.length} products`} danger={insights.slowMoving.length>0}/></div></Panel>
      <Panel title="Top products by units sold" className="span2"><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={barDataFull}><XAxis dataKey="name" stroke="#777"/><YAxis stroke="#777"/><Tooltip contentStyle={{background:"#111",border:"1px solid #333"}}/><Bar dataKey="units" fill="#f9c317"/></BarChart></ResponsiveContainer></div></Panel>
    </div>
  </PageBox>;
}

function AIAssistant() {
  const products=useAppStore(s=>s.products); const customers=useAppStore(s=>s.customers); const sales=useAppStore(s=>s.sales);
  const insights=businessInsights(products,customers,sales);
  const [question,setQuestion]=useState(""); const [messages,setMessages]=useState<Array<{who:"me"|"ai";text:string}>>([
    {who:"ai", text:`I can analyse EMD sales, stock and debts. Right now ${insights.topDebtor?.name ?? "no customer"} has the highest debt.`}
  ]);
  const [busy,setBusy]=useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const localAnswer=(q:string)=>{
    const s=q.toLowerCase();
    if(s.includes("owe")||s.includes("debt")) return `${insights.topDebtor?.name ?? "Nobody"} owes the most at ${money(insights.topDebtor?.debt ?? 0)}.`;
    if(s.includes("selling most")||s.includes("sell most")||s.includes("top")) return `${insights.bestSeller?.name ?? "No product"} is currently the strongest seller in recorded line-item data.`;
    if(s.includes("selling less")||s.includes("least")||s.includes("slow")) return `${insights.leastSeller?.name ?? "No product"} is currently the slowest seller in recorded line-item data.`;
    if(s.includes("low")&&s.includes("stock")) return insights.lowStock.length ? `Low stock: ${insights.lowStock.map(p=>`${p.name} (${p.stock})`).join(", ")}.` : "No product is below its reorder level.";
    if(s.includes("high")&&s.includes("stock")) return `Highest inventory: ${insights.highStock.map(p=>`${p.name} (${p.stock})`).join(", ")}.`;
    if(s.includes("buy")||s.includes("customer")) return `${insights.topBuyer?.name ?? "No customer"} is your highest-value customer at ${money(insights.topBuyer?.totalSpent ?? 0)} tracked spend.`;
    return "I can answer about highest debts, top buyers, best/least sellers, low stock and high inventory. Connect OPENAI_API_KEY + OPENAI_MODEL for broader natural-language analysis.";
  };

  const ask=async()=>{
    const q=question.trim(); if(!q||busy)return;
    setMessages(m=>[...m,{who:"me",text:q}]); setQuestion(""); setBusy(true);
    try{
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q,snapshot:{products,customers,sales}})});
      if(res.ok){const data=await res.json();setMessages(m=>[...m,{who:"ai",text:data.text}]);}
      else setMessages(m=>[...m,{who:"ai",text:localAnswer(q)}]);
    }catch{setMessages(m=>[...m,{who:"ai",text:localAnswer(q)}]);}
    setBusy(false);
  };

  const prompts = [
    { q: "Who owes the most?", icon: <ReceiptText size={14}/> },
    { q: "What is selling most?", icon: <TrendingUp size={14}/> },
    { q: "What is selling less?", icon: <TrendingDown size={14}/> },
    { q: "Which stock is low?", icon: <AlertTriangle size={14}/> },
    { q: "Who is buying more?", icon: <Users size={14}/> }
  ];

  return <PageBox title="EMD AI Assistant" subtitle="Ask your bar what is working, what is wrong and what needs attention">
    <div className="ai-layout">
      <div className="assistant-card">
        <div className="bot-orb"><Bot/></div>
        <h2>Business Intelligence</h2>
        <p>Grounded in your sales, inventory and customer data. Ask me anything about your bar operations.</p>
        <div className="prompt-chips">{prompts.map(p=><button key={p.q} onClick={()=>setQuestion(p.q)}>{p.icon} {p.q}</button>)}</div>
      </div>
      <div className="chat">
        <div className="messages">
          {messages.map((m,i)=><div key={i} className={`bubble ${m.who}`}>{m.text}</div>)}
          {busy && <div className="typing-indicator"><span/><span/><span/></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input"><input value={question} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setQuestion(e.target.value)} onKeyDown={(e:React.KeyboardEvent<HTMLInputElement>)=>e.key==="Enter"&&ask()} placeholder="Ask about your business…" disabled={busy}/><button onClick={ask} disabled={busy}><ArrowUpRight/></button></div>
      </div>
    </div>
  </PageBox>;
}

function Football() {
  const events = useAppStore(s=>s.events);
  const tables = useAppStore(s=>s.tables);
  const addEvent = useAppStore(s=>s.addEvent);
  const updateEvent = useAppStore(s=>s.updateEvent);
  const deleteEvent = useAppStore(s=>s.deleteEvent);
  const featureEvent = useAppStore(s=>s.featureEvent);
  const reserveTable = useAppStore(s=>s.reserveTableForMatch);
  const unreserveTable = useAppStore(s=>s.unreserveTableForMatch);
  const eventBookings = useAppStore(s=>s.eventBookings);
  const { can } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<EventCategory | "all">("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("sports");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [hostName, setHostName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [promo, setPromo] = useState("");
  const [cover, setCover] = useState("");
  const [capacity, setCapacity] = useState("");

  const featured = events.find(e => e.featured && e.active);
  const canManage = can("manage_events");

  const categoryMeta: Record<EventCategory, { icon: React.ReactNode; label: string; color: string }> = {
    sports: { icon: <Trophy size={18}/>, label: "Sports", color: "var(--yellow)" },
    music: { icon: <Music size={18}/>, label: "Live Music", color: "#a78bfa" },
    nightclub: { icon: <Moon size={18}/>, label: "Nightclub", color: "#f472b6" },
    games: { icon: <Gamepad2 size={18}/>, label: "Games", color: "#60a5fa" },
    other: { icon: <PartyPopper size={18}/>, label: "Special", color: "#34d399" },
  };

  const resetForm = () => {
    setTitle(""); setCategory("sports"); setHome(""); setAway(""); setHostName("");
    setStartsAt(""); setEndsAt(""); setPromo(""); setCover(""); setCapacity("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (e: BarEvent) => {
    setEditingId(e.id);
    setShowForm(true);
    setTitle(e.title);
    setCategory(e.category);
    setHome(e.homeTeam ?? "");
    setAway(e.awayTeam ?? "");
    setHostName(e.hostName ?? "");
    setStartsAt(e.startsAt.slice(0, 16));
    setEndsAt(e.endsAt?.slice(0, 16) ?? "");
    setPromo(e.promotionText ?? "");
    setCover(e.coverChargePesewas ? String(e.coverChargePesewas / 100) : "");
    setCapacity(e.maxCapacity ? String(e.maxCapacity) : "");
  };

  const handleSubmit = () => {
    if (!title || !startsAt) return;
    const eventData = {
      title,
      category,
      homeTeam: category === "sports" ? home : undefined,
      awayTeam: category === "sports" ? away : undefined,
      hostName: hostName || undefined,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      promotionText: promo || undefined,
      coverChargePesewas: cover ? Math.round(Number(cover) * 100) : 0,
      maxCapacity: capacity ? Number(capacity) : undefined,
      reservedTables: [],
    };
    if (editingId) {
      updateEvent(editingId, eventData);
    } else {
      addEvent(eventData);
    }
    resetForm();
  };

  const filteredEvents = events.filter(e => e.active && (filter === "all" || e.category === filter));
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const upcomingCount = events.filter(e => e.active && new Date(e.startsAt).getTime() > Date.now()).length;
  const totalBookings = eventBookings.length;
  const totalCapacity = events.filter(e => e.active).reduce((sum, e) => sum + (e.maxCapacity ?? 0), 0);
  const totalAttendees = events.filter(e => e.active).reduce((sum, e) => sum + (e.attendeeCount ?? 0), 0);

  return <PageBox title="Event Management" subtitle="Turn big events into bigger nights">
    {/* Stats */}
    <div className="metric-grid" style={{marginBottom: "12px"}}>
      <Metric label="UPCOMING EVENTS" value={String(upcomingCount)} sub="Scheduled" icon={<Calendar/>}/>
      <Metric label="TOTAL BOOKINGS" value={String(totalBookings)} sub="Customer reservations" icon={<Users/>}/>
      <Metric label="ATTENDEES" value={`${totalAttendees}/${totalCapacity || "∞"}`} sub="Across all events" icon={<PartyPopper/>}/>
      <Metric label="CATEGORIES" value="5" sub="Sports, Music, Club, Games, Special" icon={<Star/>}/>
    </div>

    {/* Featured Event Hero */}
    {featured && (
      <div className="match-hero">
        <div>
          <small style={{color: categoryMeta[featured.category].color}}>{categoryMeta[featured.category].label.toUpperCase()} • FEATURED</small>
          <h2>{featured.title}</h2>
          <p>{new Date(featured.startsAt).toLocaleString()}
            {featured.hostName && ` • ${featured.hostName}`}
            {featured.coverChargePesewas ? ` • Cover: GHS ${(featured.coverChargePesewas / 100).toFixed(2)}` : " • Free entry"}
          </p>
          {featured.promotionText && <p className="muted-text">{featured.promotionText}</p>}
        </div>
        {categoryMeta[featured.category].icon}
      </div>
    )}

    {/* Add/Edit Form */}
    {canManage && (
      <>
        {!showForm ? (
          <button className="primary" style={{marginBottom: "12px"}} onClick={() => setShowForm(true)}>
            <Plus/> Add New Event
          </button>
        ) : (
          <Panel title={editingId ? "Edit Event" : "Create New Event"} onClose={resetForm}>
            <div className="event-form">
              <div className="event-form-row">
                <label className="auth-field">
                  <span className="event-form-label">Event Title *</span>
                  <input placeholder="e.g. Manchester United vs Arsenal" value={title} onChange={(e)=>setTitle(e.target.value)} autoFocus/>
                </label>
                <label className="auth-field">
                  <span className="event-form-label">Category *</span>
                  <select value={category} onChange={(e)=>setCategory(e.target.value as EventCategory)}>
                    <option value="sports">🏆 Sports (Football, Boxing, etc.)</option>
                    <option value="music">🎵 Live Music (Bands, DJs, Concerts)</option>
                    <option value="nightclub">🌙 Nightclub / Party</option>
                    <option value="games">🎮 Games (FIFA, Trivia, etc.)</option>
                    <option value="other">🎉 Special Event (Karaoke, Comedy, etc.)</option>
                  </select>
                </label>
              </div>

              {category === "sports" && (
                <div className="event-form-row">
                  <label className="auth-field">
                    <span className="event-form-label">Home Team</span>
                    <input placeholder="e.g. Manchester United" value={home} onChange={(e)=>setHome(e.target.value)}/>
                  </label>
                  <label className="auth-field">
                    <span className="event-form-label">Away Team</span>
                    <input placeholder="e.g. Arsenal" value={away} onChange={(e)=>setAway(e.target.value)}/>
                  </label>
                </div>
              )}

              {category !== "sports" && (
                <label className="auth-field" style={{marginBottom: "10px"}}>
                  <span className="event-form-label">{category === "nightclub" ? "DJ / Host Name" : category === "music" ? "Artist / Band Name" : "Host / MC Name"}</span>
                  <input placeholder="e.g. DJ Blacko" value={hostName} onChange={(e)=>setHostName(e.target.value)}/>
                </label>
              )}

              <div className="event-form-row">
                <label className="auth-field">
                  <span className="event-form-label">Start Date & Time *</span>
                  <input type="datetime-local" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)}/>
                </label>
                <label className="auth-field">
                  <span className="event-form-label">End Date & Time</span>
                  <input type="datetime-local" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)}/>
                </label>
              </div>

              <div className="event-form-row">
                <label className="auth-field">
                  <span className="event-form-label">Cover Charge (GHS)</span>
                  <input type="number" placeholder="0 = Free" value={cover} onChange={(e)=>setCover(e.target.value)}/>
                </label>
                <label className="auth-field">
                  <span className="event-form-label">Max Capacity</span>
                  <input type="number" placeholder="e.g. 80" value={capacity} onChange={(e)=>setCapacity(e.target.value)}/>
                </label>
              </div>

              <label className="auth-field" style={{marginBottom: "10px"}}>
                <span className="event-form-label">Promotion Text</span>
                <input placeholder="e.g. Big match tonight — live on the big screen" value={promo} onChange={(e)=>setPromo(e.target.value)}/>
              </label>

              <div className="event-form-actions">
                <button className="primary" onClick={handleSubmit} disabled={!title || !startsAt}>
                  {editingId ? "Update Event" : "Create Event"}
                </button>
                <button className="mini" onClick={resetForm}>Cancel</button>
              </div>
            </div>
          </Panel>
        )}
      </>
    )}

    {/* Category Filters */}
    <div className="event-filters">
      <button className={`event-filter-chip ${filter === "all" ? "active" : ""}`} onClick={()=>setFilter("all")}>
        All ({events.filter(e=>e.active).length})
      </button>
      {(Object.keys(categoryMeta) as EventCategory[]).map(cat => (
        <button key={cat} className={`event-filter-chip ${filter === cat ? "active" : ""}`} onClick={()=>setFilter(cat)} style={filter === cat ? {borderColor: categoryMeta[cat].color, color: categoryMeta[cat].color} : {}}>
          {categoryMeta[cat].icon} {categoryMeta[cat].label} ({events.filter(e=>e.active && e.category===cat).length})
        </button>
      ))}
    </div>

    {/* Event Cards */}
    <div className="card-grid">
      {sortedEvents.map(e => {
        const reserved = e.reservedTables ?? [];
        const reservedCount = reserved.length;
        const matchBookings = eventBookings.filter(b => b.matchId === e.id);
        const meta = categoryMeta[e.category];
        const isUpcoming = new Date(e.startsAt).getTime() > Date.now();
        const isToday = new Date(e.startsAt).toDateString() === new Date().toDateString();
        return <article className="info-card event-card" key={e.id}>
          <div className="event-card-header" style={{borderColor: meta.color}}>
            <div className="event-card-icon" style={{color: meta.color}}>{meta.icon}</div>
            <div className="event-card-info">
              <h3>{e.title}</h3>
              <small style={{color: meta.color}}>{meta.label}</small>
            </div>
            {isToday && <span className="event-badge event-badge-today">TODAY</span>}
            {!isUpcoming && !isToday && <span className="event-badge event-badge-past">PAST</span>}
          </div>

          <small>{new Date(e.startsAt).toLocaleString()}{e.endsAt ? ` → ${new Date(e.endsAt).toLocaleTimeString()}` : ""}</small>

          {e.hostName && <p className="muted-text">👤 {e.hostName}</p>}
          {e.promotionText && <p className="muted-text">{e.promotionText}</p>}

          <div className="event-card-meta">
            {e.coverChargePesewas ? (
              <span className="event-meta-pill">Cover: GHS {(e.coverChargePesewas / 100).toFixed(2)}</span>
            ) : (
              <span className="event-meta-pill event-meta-free">Free Entry</span>
            )}
            {e.maxCapacity && (
              <span className="event-meta-pill">{e.attendeeCount ?? 0}/{e.maxCapacity} attending</span>
            )}
            <span className="event-meta-pill">{reservedCount}/{tables.length} tables</span>
          </div>

          {matchBookings.length > 0 && (
            <div className="event-bookings-list">
              <small className="bookings-title">Customer bookings ({matchBookings.length}):</small>
              {matchBookings.map(b => (
                <div key={b.id} className="event-booking-row">
                  <span>{b.customerName}</span>
                  <small>{b.type === "attend" ? "Attending" : `Table ${b.tableId?.replace("t","")}`}</small>
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <div className="event-card-actions">
              <button className="mini" onClick={()=>setExpandedEvent(expandedEvent===e.id?null:e.id)}>
                {expandedEvent===e.id ? "Hide tables" : "Manage tables"}
              </button>
              <button className="mini" onClick={()=>featureEvent(e.id)} disabled={e.featured}>
                <Star size={12}/> {e.featured ? "Featured" : "Feature"}
              </button>
              <button className="mini" onClick={()=>startEdit(e)}><Pencil size={12}/> Edit</button>
              <button className="mini danger-btn" onClick={()=>{ if(confirm("Delete this event?")) deleteEvent(e.id); }}><Trash2 size={12}/> Delete</button>
            </div>
          )}

          {expandedEvent===e.id && (
            <div className="match-table-reservations">
              {tables.map(t=>{
                const isReserved = reserved.includes(t.id);
                return <div key={t.id} className={`reservation-row ${isReserved?"reserved":""}`}>
                  <span>{t.name}</span>
                  <small>{t.occupied?"(occupied)":"(available)"}</small>
                  <button className="mini" onClick={()=>{
                    if (isReserved) unreserveTable(e.id, t.id);
                    else reserveTable(e.id, t.id);
                  }}>{isReserved?"Unreserve":"Reserve"}</button>
                </div>;
              })}
            </div>
          )}
        </article>;
      })}
    </div>

    {sortedEvents.length === 0 && (
      <Panel title="No events">
        <p className="muted-text">No {filter !== "all" ? categoryMeta[filter as EventCategory].label.toLowerCase() : ""} events scheduled. {canManage && "Click \"Add New Event\" to create one."}</p>
      </Panel>
    )}
  </PageBox>;
}

function Expenses() {
  const expenses=useAppStore(s=>s.expenses); const add=useAppStore(s=>s.addExpense);
  const [title,setTitle]=useState(""); const [amount,setAmount]=useState(""); const [category,setCategory]=useState("supplies");
  const total=expenses.reduce((s,e)=>s+e.amount,0);
  return <PageBox title="Expenses" subtitle="Know where the money goes">
    <div className="metric-grid" style={{marginBottom:"12px"}}><Metric label="TOTAL EXPENSES" value={money(total)} sub={`${expenses.length} entries`} icon={<CircleDollarSign/>}/></div>
    <div className="inline-form"><input placeholder="Expense e.g. Ice" value={title} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setTitle(e.target.value)}/><input type="number" placeholder="Amount" value={amount} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setAmount(e.target.value)}/><select value={category} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>setCategory(e.target.value)}><option value="supplies">Supplies</option><option value="utilities">Utilities</option><option value="salaries">Salaries</option><option value="maintenance">Maintenance</option><option value="other">Other</option></select><button className="primary" onClick={()=>{if(title&&Number(amount)>0){add(title,Number(amount),category);setTitle("");setAmount("")}}}>Add expense</button></div>
    <div className="responsive-table"><table><thead><tr><th>Expense</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td>{e.title}</td><td>{e.category}</td><td>{money(e.amount)}</td><td>{new Date(e.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
  </PageBox>;
}

function Staff() {
  const staff=useAppStore(s=>s.staff);
  return <PageBox title="Staff" subtitle="Simple role-aware team overview">
    <div className="card-grid">{staff.map(s=><article className="info-card" key={s.id}><div className="avatar">{s.name[0]}</div><h3>{s.name}</h3><small>{roleLabels[s.role]}</small>{s.phone && <small>{s.phone}</small>}<div className="info-row"><span>Sales</span><b>{s.salesCount}</b></div><div className="info-row"><span>Orders</span><b>{s.ordersHandled}</b></div><Status ok={s.active} label={s.active?"Active":"Inactive"}/></article>)}</div>
  </PageBox>;
}

function AccessDenied() {
  return <PageBox title="Access Denied" subtitle="You don't have permission to view this page">
    <Panel title="Restricted area">
      <p className="muted-text">Your current role doesn't include access to this section. Switch roles from the top bar if you have the credentials, or contact an administrator.</p>
    </Panel>
  </PageBox>;
}

function SettingsPage() {  const { role, userName } = useAuth();
  const barOpen = useAppStore(s => s.barOpen);
  const toggleBarOpen = useAppStore(s => s.toggleBarOpen);
  return <PageBox title="Settings" subtitle="Business preferences and integrations">
    <div className="settings-grid">
      <Panel title="Business"><label>Business name<input defaultValue="EMD Drinking Sports"/></label><label>Currency<input defaultValue="GHS"/></label><label>Location<input defaultValue="Ghana"/></label><label>Receipt footer<input defaultValue="Thank you for drinking with EMD! Come again."/></label></Panel>
      <Panel title="Customer Portal"><div className="setting-row"><div><b>Bar Status</b><small>Toggle to show customers if the bar is open</small></div><label className="football-toggle"><input type="checkbox" checked={barOpen} onChange={toggleBarOpen}/><i/></label></div><div className="setting-row"><div><b>Portal URL</b><small>Share this link with customers</small></div><a href="/portal" target="_blank" rel="noopener noreferrer" className="panel-link">/portal</a></div></Panel>
      <Panel title="Integrations"><div className="setting-row"><div><b>Eganow</b><small>MoMo + card gateway</small></div><Status ok={false} label="Configure env"/></div><div className="setting-row"><div><b>AI Assistant</b><small>OpenAI Responses API</small></div><Status ok={false} label="Configure env"/></div><div className="setting-row"><div><b>Supabase</b><small>Postgres + Auth</small></div><Status ok={false} label="Configure env"/></div></Panel>
      <Panel title="Current session"><div className="info-row"><span>Role</span><b>{roleLabels[role]}</b></div><div className="info-row"><span>User</span><b>{userName}</b></div><p className="muted-text">Switch roles from the top bar to test permissions.</p></Panel>
      <Panel title="Appearance"><p>Black, white, gold and yellow luxury theme is active.</p><div className="swatches"><i/><i/><i/><i/></div></Panel>
    </div>
  </PageBox>;
}

function Metric({label,value,sub,icon,danger=false,trend,onSubClick}:{label:string;value:string;sub:string;icon:React.ReactNode;danger?:boolean;trend?:{percent:number;up:boolean};onSubClick?:()=>void}) {
  return <article className={`metric ${danger?"danger":""}`}>
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
      {trend
        ? <span className={`metric-trend ${trend.up?"up":"down"}`}>
            {trend.up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(trend.percent).toFixed(1)}% from yesterday
          </span>
        : onSubClick
          ? <button className="metric-link" onClick={onSubClick}>{sub}</button>
          : <span>{sub}</span>}
    </div>
    <div className="metric-icon">{icon}</div>
  </article>;
}
function Panel({title,children,className="",action,onClose}:{title:string;children:React.ReactNode;className?:string;action?:React.ReactNode;onClose?:()=>void}) {
  return <section className={`panel ${className}`}><div className="panel-head"><h3>{title}</h3>{onClose ? <button className="icon-btn" onClick={onClose}><X size={16}/></button> : action}</div>{children}</section>;
}
function InsightCard({icon,label,value,sub,footer,tone="gold",onClick}:{icon:React.ReactNode;label:string;value:string;sub?:string;footer?:string;tone?:"gold"|"red"|"green"|"blue";onClick?:()=>void}) {
  return <article className={`insight-card tone-${tone} ${onClick?"clickable":""}`} onClick={onClick}>
    <div className="insight-card-icon">{icon}</div>
    <small>{label}</small>
    <strong>{value}</strong>
    {sub && <span>{sub}</span>}
    {footer && <em>{footer}</em>}
  </article>;
}
function StockBadge({product}:{product:Product}) {
  const ratio = product.reorderLevel > 0 ? product.stock / product.reorderLevel : 1;
  if (product.stock === 0) return <span className="stock-badge out">Out of stock</span>;
  if (ratio <= 0.5) return <span className="stock-badge very-low">Very Low</span>;
  if (product.stock <= product.reorderLevel) return <span className="stock-badge low">Low Stock</span>;
  return <span className="stock-badge ok">Healthy</span>;
}
function Insight({title,value,danger=false}:{title:string;value:string;danger?:boolean}) {
  return <div className={`insight ${danger?"danger":""}`}><small>{title}</small><b>{value}</b></div>;
}
function Status({ok,label}:{ok:boolean;label:string}) {
  return <span className={`status ${ok?"ok":"warn"}`}>{label}</span>;
}
function PageBox({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) {
  return <><div className="page-title"><div><p>EMD OPERATIONS</p><h1>{title}</h1><span>{subtitle}</span></div></div>{children}</>;
}
