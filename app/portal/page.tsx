"use client";

import {
  Beer, Wine, Crown, GlassWater, Zap, Cigarette, Cookie, CupSoda,
  ShoppingCart, Plus, Minus, Clock, Users, Trophy, Calendar,
  CheckCircle2, AlertTriangle, Phone, MessageSquare, Bell, MapPin,
  Star, Wallet, Receipt, ArrowRight, Home, ShoppingBag, Utensils,
  Loader2, PartyPopper, Smartphone, CircleDollarSign, CreditCard
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { Product, ProductCategory, CartLine } from "@/lib/types";
import { InventoryError } from "@/lib/domain/inventory";

const money = (v: number) => `GHS ${v.toFixed(2)}`;

type PortalTab = "home" | "events" | "menu" | "tables" | "orders" | "waiter" | "wallet";

export default function CustomerPortal() {
  const [tab, setTab] = useState<PortalTab>("home");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [, setCustomerName] = useState("");
  const [, setCustomerPhone] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const customers = useAppStore(s => s.customers);
  const barOpen = useAppStore(s => s.barOpen);

  // Auto-select first customer for demo
  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
      setCustomerName(customers[0].name);
      setCustomerPhone(customers[0].phone);
    }
  }, [customers, customerId]);

  if (!customerId) {
    return <div className="portal-shell"><div className="portal-loading"><Loader2 className="animate-spin" size={24} /> Loading...</div></div>;
  }

  const customer = customers.find(c => c.id === customerId);

  return (
    <div className="portal-shell">
      <div className="portal-inner">
        <div className="portal-header">
          <div className="portal-header-left">
            <div className="portal-brand">
              <div className="portal-logo"><Crown size={22} /></div>
              <div>
                <strong>EMD</strong>
                <span>BAR &amp; LOUNGE</span>
              </div>
            </div>
            <div className={`portal-bar-status ${barOpen ? "open" : "closed"}`}>
              <span className="status-dot" />
              {barOpen ? "OPEN NOW" : "CLOSED"}
            </div>
          </div>
          {customer && (
            <div className="portal-welcome">
              <div className="portal-avatar">{customer.name[0]}</div>
              <div className="portal-welcome-info">
                <strong>Welcome, {customer.name.split(" ")[0]}</strong>
                <span>{customer.phone}</span>
              </div>
              <button className="portal-wallet" onClick={() => setTab("wallet")}>
                <Wallet size={14} />
                <div>
                  <small>Wallet</small>
                  <b>{money(customer.walletBalance)}</b>
                </div>
              </button>
            </div>
          )}
        </div>

        <nav className="portal-nav">
          {([
            ["home", "Home", Home],
            ["events", "Events", Trophy],
            ["menu", "Menu", Utensils],
            ["tables", "Tables", MapPin],
            ["orders", "My Orders", Receipt],
            ["waiter", "Waiter", Bell],
            ["wallet", "Wallet", Wallet]
          ] as Array<[PortalTab, string, typeof Home]>).map(([key, label, Icon]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="portal-content">
          {tab === "home" && <PortalHome barOpen={barOpen} onTab={setTab} />}
          {tab === "events" && <PortalEvents customerId={customerId} customerName={customer?.name ?? ""} />}
          {tab === "menu" && <PortalMenu customerId={customerId} selectedTableId={selectedTableId} />}
          {tab === "tables" && <PortalTables selectedTableId={selectedTableId} onSelect={setSelectedTableId} />}
          {tab === "orders" && <PortalOrders customerId={customerId} />}
          {tab === "waiter" && <PortalWaiter customerId={customerId} selectedTableId={selectedTableId} />}
          {tab === "wallet" && <PortalWallet customerId={customerId} />}
        </div>
      </div>
    </div>
  );
}

function PortalHome({ barOpen, onTab }: { barOpen: boolean; onTab: (t: PortalTab) => void }) {
  const matches = useAppStore(s => s.matches);
  const products = useAppStore(s => s.products);
  const tables = useAppStore(s => s.tables);
  const featured = matches.find(m => m.featured && m.active) ?? matches.find(m => m.active);
  const availableTables = tables.filter(t => !t.occupied).length;
  const totalProducts = products.filter(p => p.active).length;

  return (
    <div className="portal-section">
      <div className="portal-hero">
        <div className="portal-hero-content">
          <small>WELCOME TO EMD</small>
          <h1>Bar &amp; Lounge</h1>
          <p>Your premium drinking and entertainment destination in Ghana</p>
          <div className="portal-hero-stats">
            <div className="portal-hero-stat">
              <CheckCircle2 size={16} className={barOpen ? "text-green" : "text-red"} />
              <span>{barOpen ? "Open Now" : "Closed"}</span>
            </div>
            <div className="portal-hero-stat">
              <MapPin size={16} />
              <span>{availableTables} tables free</span>
            </div>
            <div className="portal-hero-stat">
              <Utensils size={16} />
              <span>{totalProducts} items on menu</span>
            </div>
          </div>
        </div>
      </div>

      {featured && (
        <div className="portal-featured-event" onClick={() => onTab("events")}>
          <div className="portal-event-icon"><Trophy size={24} /></div>
          <div className="portal-event-info">
            <small>FEATURED EVENT</small>
            <strong>{featured.homeTeam} vs {featured.awayTeam}</strong>
            <span>{new Date(featured.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {new Date(featured.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            {featured.promotionText && <em>{featured.promotionText}</em>}
          </div>
          <ArrowRight size={20} />
        </div>
      )}

      <div className="portal-quick-grid">
        <button className="portal-quick-card" onClick={() => onTab("menu")}>
          <div className="portal-quick-icon"><Utensils size={22} /></div>
          <strong>Order Food &amp; Drinks</strong>
          <span>Browse menu and order to your table</span>
        </button>
        <button className="portal-quick-card" onClick={() => onTab("tables")}>
          <div className="portal-quick-icon"><MapPin size={22} /></div>
          <strong>Reserve a Table</strong>
          <span>See available tables and pick one</span>
        </button>
        <button className="portal-quick-card" onClick={() => onTab("events")}>
          <div className="portal-quick-icon"><PartyPopper size={22} /></div>
          <strong>Upcoming Events</strong>
          <span>See what's happening at EMD</span>
        </button>
        <button className="portal-quick-card" onClick={() => onTab("waiter")}>
          <div className="portal-quick-icon"><Bell size={22} /></div>
          <strong>Call Waiter</strong>
          <span>Request service from your table</span>
        </button>
      </div>

      <div className="portal-promo">
        <div className="portal-promo-icon"><Star size={20} /></div>
        <div>
          <strong>Loyalty Rewards</strong>
          <p>Earn points on every purchase. Redeem for discounts and free items.</p>
        </div>
      </div>
    </div>
  );
}

function PortalEvents({ customerId, customerName }: { customerId: string; customerName: string }) {
  const events = useAppStore(s => s.events);
  const tables = useAppStore(s => s.tables);
  const bookEvent = useAppStore(s => s.bookEvent);
  const eventBookings = useAppStore(s => s.eventBookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoryLabels: Record<string, string> = {
    sports: "🏆 Sports",
    music: "🎵 Live Music",
    nightclub: "🌙 Nightclub",
    games: "🎮 Games",
    other: "🎉 Special Event",
  };

  const sortedEvents = [...events].filter(e => e.active).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <div className="portal-section">
      <h2 className="portal-title">Upcoming Events</h2>
      <p className="portal-subtitle">Book your spot at the next big event</p>

      {sortedEvents.map(e => {
        const reserved = e.reservedTables ?? [];
        const myBooking = eventBookings.find(b => b.matchId === e.id && b.customerId === customerId);
        const isExpanded = expandedId === e.id;

        return (
          <div key={e.id} className="portal-event-card">
            <div className="portal-event-card-header">
              <div className="portal-event-badge">{e.featured ? "FEATURED" : categoryLabels[e.category] ?? "EVENT"}</div>
              <div className="portal-event-date">
                <Calendar size={14} />
                {new Date(e.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
            <h3>{e.title}</h3>
            {e.hostName && <p className="portal-event-host">👤 {e.hostName}</p>}
            <div className="portal-event-time">
              <Clock size={14} />
              {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            {e.promotionText && <p className="portal-event-promo">{e.promotionText}</p>}
            <div className="portal-event-stats">
              {e.coverChargePesewas ? (
                <div>💰 Cover: GHS {(e.coverChargePesewas / 100).toFixed(2)}</div>
              ) : (
                <div>✅ Free Entry</div>
              )}
              <div><Users size={14} /> {e.attendeeCount ?? 0}{e.maxCapacity ? `/${e.maxCapacity}` : ""} attending</div>
              <div><MapPin size={14} /> {reserved.length}/{tables.length} tables</div>
            </div>

            {myBooking && (
              <div className="portal-booking-confirmed">
                <CheckCircle2 size={16} />
                <span>You {myBooking.type === "attend" ? "are attending" : "reserved a table"}</span>
              </div>
            )}

            {!myBooking && (
              <div className="portal-event-actions">
                <button className="portal-btn-primary" onClick={() => bookEvent(e.id, customerId, customerName, "attend")}>
                  <CheckCircle2 size={16} /> Attend
                </button>
                <button className="portal-btn-secondary" onClick={() => setExpandedId(isExpanded ? null : e.id)}>
                  <MapPin size={16} /> Reserve Table
                </button>
              </div>
            )}

            {isExpanded && !myBooking && (
              <div className="portal-table-picker">
                <small>Select a table to reserve:</small>
                <div className="portal-table-grid">
                  {tables.map(t => {
                    const isReserved = reserved.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        className={`portal-table-pick ${isReserved ? "taken" : ""}`}
                        disabled={isReserved}
                        onClick={() => { bookEvent(e.id, customerId, customerName, "reserve", t.id); setExpandedId(null); }}
                      >
                        {t.name}
                        {isReserved ? <small>Reserved</small> : <small>Available</small>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PortalMenu({ customerId, selectedTableId }: { customerId: string; selectedTableId: string | null }) {
  const products = useAppStore(s => s.products);
  const placeCustomerOrder = useAppStore(s => s.placeCustomerOrder);
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [note, setNote] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const categories: Array<ProductCategory | "All"> = ["All", "Beer", "Spirits", "Wine", "Soft Drinks", "Energy Drinks", "Cigarettes", "Snacks", "Juice", "Water"];
  const filtered = products.filter(p => p.active && (category === "All" || p.category === category));

  const cartQtyFor = (productId: string) => cart.find(l => l.productId === productId && l.mode === "bottle")?.quantity ?? 0;

  const addToCart = (p: Product) => {
    if (cartQtyFor(p.id) >= p.stock) return;
    setCart(prev => {
      const existing = prev.find(l => l.productId === p.id && l.mode === "bottle");
      if (existing) return prev.map(l => l.id === existing.id ? { ...l, quantity: Math.min(p.stock, l.quantity + 1) } : l);
      return [...prev, { id: `cl${Date.now()}`, productId: p.id, name: p.name, mode: "bottle" as const, unitPrice: p.bottlePrice, quantity: 1 }];
    });
  };

  const updateQty = (lineId: string, delta: number) => {
    setCart(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const product = products.find(p => p.id === l.productId);
      const maxQty = product?.stock ?? l.quantity;
      return { ...l, quantity: Math.max(0, Math.min(maxQty, l.quantity + delta)) };
    }).filter(l => l.quantity > 0));
  };

  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const [orderError, setOrderError] = useState<string | null>(null);

  const placeOrder = () => {
    if (!cart.length || !selectedTableId) return;
    try {
      placeCustomerOrder(customerId, selectedTableId, cart, note);
      setCart([]); setNote(""); setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 3000);
    } catch (err) {
      setOrderError(err instanceof InventoryError ? err.message : "Could not place order. Please try again.");
      setTimeout(() => setOrderError(null), 4000);
    }
  };

  const categoryIcon = (cat: ProductCategory) => {
    const map: Record<string, React.ReactNode> = {
      Beer: <Beer size={16} />, Spirits: <Crown size={16} />, Wine: <Wine size={16} />,
      "Soft Drinks": <CupSoda size={16} />, Water: <GlassWater size={16} />,
      "Energy Drinks": <Zap size={16} />, Cigarettes: <Cigarette size={16} />,
      Snacks: <Cookie size={16} />, Juice: <CupSoda size={16} />
    };
    return map[cat] ?? <ShoppingBag size={16} />;
  };

  return (
    <div className="portal-section">
      <h2 className="portal-title">Menu</h2>
      <p className="portal-subtitle">Order food &amp; drinks to your table{selectedTableId ? ` (Table ${selectedTableId.replace("t", "")})` : " — select a table first"}</p>

      {!selectedTableId && (
        <div className="portal-alert">
          <AlertTriangle size={16} />
          <span>Please select a table first from the Tables tab</span>
        </div>
      )}

      <div className="portal-category-row">
        {categories.map(c => (
          <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="portal-menu-grid">
        {filtered.map(p => {
          const inCart = cartQtyFor(p.id);
          const atStockLimit = inCart >= p.stock;
          const lowStock = p.stock > 0 && p.stock <= 3;
          return (
            <div key={p.id} className="portal-menu-item">
              <div className="portal-menu-item-icon">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="portal-menu-item-img" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : categoryIcon(p.category)}
              </div>
              <div className="portal-menu-item-info">
                <strong>{p.name}</strong>
                <small>{p.category}</small>
                {p.stock <= 0 ? (
                  <small className="portal-stock-out">Out of stock</small>
                ) : lowStock ? (
                  <small className="portal-stock-low">Only {p.stock} left{inCart > 0 ? ` (${inCart} in cart)` : ""}</small>
                ) : null}
              </div>
              <div className="portal-menu-item-price">{money(p.bottlePrice)}</div>
              <button className="portal-menu-add" onClick={() => addToCart(p)} disabled={p.stock <= 0 || !selectedTableId || atStockLimit}>
                <Plus size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="portal-cart">
          <div className="portal-cart-header">
            <strong>Your Order</strong>
            <span>{cart.length} items • {money(total)}</span>
          </div>
          {cart.map(l => {
            const product = products.find(p => p.id === l.productId);
            const atStockLimit = product ? l.quantity >= product.stock : false;
            return (
              <div key={l.id} className="portal-cart-line">
                <div><b>{l.name}</b><small>{money(l.unitPrice)} each</small></div>
                <div className="portal-stepper">
                  <button onClick={() => updateQty(l.id, -1)}><Minus size={14} /></button>
                  <b>{l.quantity}</b>
                  <button onClick={() => updateQty(l.id, 1)} disabled={atStockLimit}><Plus size={14} /></button>
                </div>
                <b className="portal-cart-line-total">{money(l.unitPrice * l.quantity)}</b>
              </div>
            );
          })}
          <input className="portal-cart-note" placeholder="Special instructions..." value={note} onChange={e => setNote(e.target.value)} />
          <button className="portal-btn-primary portal-cart-submit" onClick={placeOrder} disabled={!selectedTableId}>
            <ShoppingCart size={16} /> Place Order • {money(total)}
          </button>
        </div>
      )}

      {orderError && (
        <div className="portal-alert">
          <AlertTriangle size={16} />
          <span>{orderError}</span>
        </div>
      )}

      {orderPlaced && (
        <div className="portal-success">
          <CheckCircle2 size={20} />
          <span>Order placed! Your waiter will bring it to your table.</span>
        </div>
      )}
    </div>
  );
}

function PortalTables({ selectedTableId, onSelect }: { selectedTableId: string | null; onSelect: (id: string) => void }) {
  const tables = useAppStore(s => s.tables);
  const toggleTable = useAppStore(s => s.toggleTable);

  return (
    <div className="portal-section">
      <h2 className="portal-title">Tables</h2>
      <p className="portal-subtitle">Pick your table when you arrive at the bar</p>

      {selectedTableId && (
        <div className="portal-alert success">
          <CheckCircle2 size={16} />
          <span>You're at Table {selectedTableId.replace("t", "")}</span>
        </div>
      )}

      <div className="portal-table-grid">
        {tables.map(t => {
          const isSelected = selectedTableId === t.id;
          return (
            <button
              key={t.id}
              className={`portal-table-pick ${t.occupied && !isSelected ? "taken" : ""} ${isSelected ? "selected" : ""}`}
              disabled={t.occupied && !isSelected}
              onClick={() => { onSelect(t.id); if (!t.occupied) toggleTable(t.id); }}
            >
              <MapPin size={18} />
              <strong>{t.name}</strong>
              {isSelected ? <small>Your table</small> : t.occupied ? <small>Occupied</small> : <small>Available</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PortalOrders({ customerId }: { customerId: string }) {
  const customerOrders = useAppStore(s => s.customerOrders);
  const customers = useAppStore(s => s.customers);
  const updateCustomerOrderStatus = useAppStore(s => s.updateCustomerOrderStatus);
  const spendWallet = useAppStore(s => s.spendWallet);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"wallet" | "momo" | "cash">("wallet");
  const [paidId, setPaidId] = useState<string | null>(null);
  const myOrders = customerOrders.filter(o => o.customerId === customerId);
  const customer = customers.find(c => c.id === customerId);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "#f97316" },
    preparing: { label: "Preparing", color: "#f9c317" },
    served: { label: "Served", color: "#22c55e" },
    paid: { label: "Paid", color: "#92969c" }
  };

  const handlePay = (orderId: string, total: number) => {
    if (payMethod === "wallet") {
      if (!spendWallet(customerId, total)) {
        alert("Insufficient wallet balance. Please use MoMo or cash.");
        return;
      }
    }
    updateCustomerOrderStatus(orderId, "paid", payMethod);
    setPayingId(null);
    setPaidId(orderId);
    setTimeout(() => setPaidId(null), 3000);
  };

  return (
    <div className="portal-section">
      <h2 className="portal-title">My Orders</h2>
      <p className="portal-subtitle">Track your orders and pay from your phone</p>

      {myOrders.length === 0 ? (
        <div className="portal-empty">
          <Receipt size={40} />
          <p>No orders yet. Go to the Menu to place an order.</p>
        </div>
      ) : (
        <div className="portal-orders">
          {myOrders.map(o => {
            const total = o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
            const status = statusLabels[o.status];
            const canPay = o.status === "served";
            const isPaying = payingId === o.id;
            return (
              <div key={o.id} className="portal-order-card">
                <div className="portal-order-header">
                  <strong>Order #{o.id.slice(-4)}</strong>
                  <span className="portal-order-status" style={{ color: status.color, borderColor: status.color }}>{status.label}</span>
                </div>
                <div className="portal-order-lines">
                  {o.lines.map(l => (
                    <div key={l.id} className="portal-order-line">
                      <span>{l.quantity}x {l.name}</span>
                      <b>{money(l.unitPrice * l.quantity)}</b>
                    </div>
                  ))}
                </div>
                {o.note && <div className="portal-order-note">Note: {o.note}</div>}
                <div className="portal-order-total">
                  <span>Total</span>
                  <b>{money(total)}</b>
                </div>
                <div className="portal-order-time">
                  <Clock size={12} />
                  {new Date(o.createdAt).toLocaleString()}
                </div>

                {canPay && !isPaying && (
                  <button className="portal-btn-primary portal-pay-btn" onClick={() => setPayingId(o.id)}>
                    <Wallet size={16} /> Pay {money(total)}
                  </button>
                )}

                {canPay && isPaying && (
                  <div className="portal-pay-section">
                    <small>Select payment method:</small>
                    <div className="portal-pay-methods">
                      <button className={payMethod === "wallet" ? "active" : ""} onClick={() => setPayMethod("wallet")}>
                        <Wallet size={14} /> Wallet ({customer ? money(customer.walletBalance) : ""})
                      </button>
                      <button className={payMethod === "momo" ? "active" : ""} onClick={() => setPayMethod("momo")}>
                        <Smartphone size={14} /> MoMo
                      </button>
                      <button className={payMethod === "cash" ? "active" : ""} onClick={() => setPayMethod("cash")}>
                        <CircleDollarSign size={14} /> Cash
                      </button>
                    </div>
                    <button className="portal-btn-primary" onClick={() => handlePay(o.id, total)}>
                      <CheckCircle2 size={16} /> Confirm Payment {money(total)}
                    </button>
                    <button className="portal-btn-cancel" onClick={() => setPayingId(null)}>Cancel</button>
                  </div>
                )}

                {paidId === o.id && (
                  <div className="portal-success">
                    <CheckCircle2 size={18} />
                    <span>Payment successful! Thank you.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PortalWaiter({ customerId, selectedTableId }: { customerId: string; selectedTableId: string | null }) {
  const staff = useAppStore(s => s.staff);
  const waiterCalls = useAppStore(s => s.waiterCalls);
  const chatMessages = useAppStore(s => s.chatMessages);
  const callWaiter = useAppStore(s => s.callWaiter);
  const sendChatMessage = useAppStore(s => s.sendChatMessage);
  const [message, setMessage] = useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const waiters = staff.filter(s => s.role === "waiter" && s.active);
  const myCalls = waiterCalls.filter(c => c.customerId === customerId);
  const myMessages = chatMessages.filter(m => m.customerId === customerId || (selectedTableId && m.tableId === selectedTableId));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [myMessages.length]);

  const handleCall = () => {
    if (!selectedTableId) return;
    callWaiter(selectedTableId, customerId, "Table is calling for service");
  };

  const handleSend = () => {
    if (!message.trim() || !selectedTableId) return;
    sendChatMessage(selectedTableId, "customer", message, customerId);
    setMessage("");
  };

  return (
    <div className="portal-section">
      <h2 className="portal-title">Your Waiter</h2>
      <p className="portal-subtitle">Call for service or send a message</p>

      {/* Show all waiters */}
      <div className="portal-waiters-list">
        {waiters.map(w => (
          <div key={w.id} className="portal-waiter-card">
            <div className="portal-waiter-avatar">{w.name[0]}</div>
            <div className="portal-waiter-info">
              <strong>{w.name}</strong>
              <span>Waiter</span>
              <small>{w.ordersHandled} orders handled</small>
            </div>
            {selectedTableId
              ? <button className="portal-btn-call" onClick={handleCall}><Phone size={18} /> Call</button>
              : <small className="portal-waiter-hint">Select a table to call</small>}
          </div>
        ))}
      </div>

      {selectedTableId ? (
        <>
          {myCalls.length > 0 && (
            <div className="portal-call-status">
              {myCalls.slice(0, 3).map(c => (
                <div key={c.id} className={`portal-call-item ${c.status}`}>
                  <Bell size={14} />
                  <span>Call {c.status === "pending" ? "sent — waiter is on the way" : c.status === "accepted" ? "accepted — waiter is coming" : "arrived at your table"}</span>
                  <small>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                </div>
              ))}
            </div>
          )}

          <div className="portal-chat">
            <div className="portal-chat-header">
              <MessageSquare size={16} />
              <strong>Chat with your waiter</strong>
            </div>
            <div className="portal-chat-messages">
              {myMessages.length === 0 && <div className="portal-chat-empty">No messages yet. Say hello to your waiter!</div>}
              {myMessages.map(m => (
                <div key={m.id} className={`portal-chat-bubble ${m.sender}`}>
                  {m.text}
                  <small>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="portal-chat-input">
              <input
                placeholder="Type a message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend}><ArrowRight size={18} /></button>
            </div>
          </div>
        </>
      ) : (
        <div className="portal-alert">
          <AlertTriangle size={16} />
          <span>Select a table from the Tables tab to enable chat and calling</span>
        </div>
      )}
    </div>
  );
}

function PortalWallet({ customerId }: { customerId: string }) {
  const customers = useAppStore(s => s.customers);
  const topUpWallet = useAppStore(s => s.topUpWallet);
  const customer = customers.find(c => c.id === customerId);
  const [amount, setAmount] = useState(20);
  const [method, setMethod] = useState<"momo" | "card" | "cash">("momo");
  const [toppedUp, setToppedUp] = useState(false);
  const [processing, setProcessing] = useState(false);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleTopUp = () => {
    if (amount <= 0) return;
    setProcessing(true);
    setTimeout(() => {
      topUpWallet(customerId, amount);
      setProcessing(false);
      setToppedUp(true);
      setTimeout(() => setToppedUp(false), 3000);
    }, 1200);
  };

  if (!customer) return null;

  return (
    <div className="portal-section">
      <h2 className="portal-title">My Wallet</h2>
      <p className="portal-subtitle">Top up your wallet to pay for orders instantly</p>

      {/* Balance card */}
      <div className="portal-wallet-hero">
        <div className="portal-wallet-hero-bg" />
        <small>CURRENT BALANCE</small>
        <strong>{money(customer.walletBalance)}</strong>
        <div className="portal-wallet-hero-info">
          <div><Star size={14} /> <span>{customer.loyaltyPoints} loyalty points</span></div>
          <div><Receipt size={14} /> <span>{customer.visitCount} visits</span></div>
        </div>
      </div>

      {/* How it works */}
      <div className="portal-wallet-how">
        <strong>How EMD Wallet Works</strong>
        <div className="portal-wallet-step">
          <div className="portal-wallet-step-num">1</div>
          <div><b>Top up</b><p>Add money to your wallet using MoMo, card, or cash at the bar.</p></div>
        </div>
        <div className="portal-wallet-step">
          <div className="portal-wallet-step-num">2</div>
          <div><b>Order</b><p>Place food and drink orders from your table using the Menu tab.</p></div>
        </div>
        <div className="portal-wallet-step">
          <div className="portal-wallet-step-num">3</div>
          <div><b>Pay instantly</b><p>When your order is served, pay with one tap from your wallet. No waiting for the bill.</p></div>
        </div>
        <div className="portal-wallet-step">
          <div className="portal-wallet-step-num">4</div>
          <div><b>Earn rewards</b><p>Every purchase earns loyalty points. Redeem for discounts and free items.</p></div>
        </div>
      </div>

      {/* Top up form */}
      <div className="portal-topup">
        <strong>Top Up Wallet</strong>

        <div className="portal-topup-amounts">
          {quickAmounts.map(a => (
            <button key={a} className={amount === a ? "active" : ""} onClick={() => setAmount(a)}>
              {money(a)}
            </button>
          ))}
        </div>

        <label className="portal-topup-custom">
          <small>Custom amount (GHS)</small>
          <input type="number" min="1" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)} />
        </label>

        <small>Payment method:</small>
        <div className="portal-pay-methods">
          <button className={method === "momo" ? "active" : ""} onClick={() => setMethod("momo")}>
            <Smartphone size={14} /> MoMo
          </button>
          <button className={method === "card" ? "active" : ""} onClick={() => setMethod("card")}>
            <CreditCard size={14} /> Card
          </button>
          <button className={method === "cash" ? "active" : ""} onClick={() => setMethod("cash")}>
            <CircleDollarSign size={14} /> Cash
          </button>
        </div>

        <button className="portal-btn-primary portal-topup-btn" onClick={handleTopUp} disabled={amount <= 0 || processing}>
          {processing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Wallet size={16} /> Top Up {money(amount)}</>}
        </button>

        {toppedUp && (
          <div className="portal-success">
            <CheckCircle2 size={18} />
            <span>Wallet topped up with {money(amount)}! New balance: {money(customer.walletBalance + amount)}</span>
          </div>
        )}
      </div>

      {/* Spending info */}
      <div className="portal-wallet-tips">
        <strong>Wallet Tips</strong>
        <p>Use your wallet to pay for orders from the My Orders tab when they're served. Wallet payments are instant — no need to wait for a waiter to bring the bill.</p>
        <p>You can also pay with MoMo or cash directly from the My Orders tab if you prefer.</p>
      </div>
    </div>
  );
}
