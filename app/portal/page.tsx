"use client";

import {
  Beer, Wine, Crown, GlassWater, Zap, Cigarette, Cookie, CupSoda,
  ShoppingCart, Plus, Minus, Clock, Users, Trophy, Calendar,
  CheckCircle2, AlertTriangle, Phone, MessageSquare, Bell, MapPin,
  Star, Wallet, Receipt, ArrowRight, Home, ShoppingBag, Utensils,
  Loader2, PartyPopper
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { Product, ProductCategory, CartLine } from "@/lib/types";

const money = (v: number) => `GHS ${v.toFixed(2)}`;

type PortalTab = "home" | "events" | "menu" | "tables" | "orders" | "waiter";

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
      <div className="portal-header">
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
          <div>
            <strong>Welcome, {customer.name.split(" ")[0]}</strong>
            <span>{customer.phone}</span>
          </div>
          <div className="portal-wallet">
            <Wallet size={14} />
            <div>
              <small>Wallet</small>
              <b>{money(customer.walletBalance)}</b>
            </div>
          </div>
        </div>
      )}

      <nav className="portal-nav">
        {([
          ["home", "Home", Home],
          ["events", "Events", Trophy],
          ["menu", "Menu", Utensils],
          ["tables", "Tables", MapPin],
          ["orders", "My Orders", Receipt],
          ["waiter", "Waiter", Bell]
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
  const matches = useAppStore(s => s.matches);
  const tables = useAppStore(s => s.tables);
  const bookEvent = useAppStore(s => s.bookEvent);
  const eventBookings = useAppStore(s => s.eventBookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="portal-section">
      <h2 className="portal-title">Upcoming Events</h2>
      <p className="portal-subtitle">Book your spot at the next big event</p>

      {matches.filter(m => m.active).map(m => {
        const reserved = m.reservedTables ?? [];
        const myBooking = eventBookings.find(b => b.matchId === m.id && b.customerId === customerId);
        const isExpanded = expandedId === m.id;

        return (
          <div key={m.id} className="portal-event-card">
            <div className="portal-event-card-header">
              <div className="portal-event-badge">{m.featured ? "FEATURED" : "EVENT"}</div>
              <div className="portal-event-date">
                <Calendar size={14} />
                {new Date(m.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
            <h3>{m.homeTeam} vs {m.awayTeam}</h3>
            <div className="portal-event-time">
              <Clock size={14} />
              {new Date(m.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            {m.promotionText && <p className="portal-event-promo">{m.promotionText}</p>}
            <div className="portal-event-stats">
              <div><Users size={14} /> {reserved.length}/{tables.length} tables reserved</div>
              <div><MapPin size={14} /> {tables.length - reserved.length} available</div>
            </div>

            {myBooking && (
              <div className="portal-booking-confirmed">
                <CheckCircle2 size={16} />
                <span>You {myBooking.type === "attend" ? "are attending" : "reserved a table"}</span>
              </div>
            )}

            {!myBooking && (
              <div className="portal-event-actions">
                <button className="portal-btn-primary" onClick={() => bookEvent(m.id, customerId, customerName, "attend")}>
                  <CheckCircle2 size={16} /> Attend
                </button>
                <button className="portal-btn-secondary" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
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
                        onClick={() => { bookEvent(m.id, customerId, customerName, "reserve", t.id); setExpandedId(null); }}
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

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(l => l.productId === p.id && l.mode === "bottle");
      if (existing) return prev.map(l => l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { id: `cl${Date.now()}`, productId: p.id, name: p.name, mode: "bottle" as const, unitPrice: p.bottlePrice, quantity: 1 }];
    });
  };

  const updateQty = (lineId: string, delta: number) => {
    setCart(prev => prev.map(l => l.id === lineId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l).filter(l => l.quantity > 0));
  };

  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const placeOrder = () => {
    if (!cart.length || !selectedTableId) return;
    placeCustomerOrder(customerId, selectedTableId, cart, note);
    setCart([]); setNote(""); setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 3000);
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
        {filtered.map(p => (
          <div key={p.id} className="portal-menu-item">
            <div className="portal-menu-item-icon">{categoryIcon(p.category)}</div>
            <div className="portal-menu-item-info">
              <strong>{p.name}</strong>
              <small>{p.category}</small>
            </div>
            <div className="portal-menu-item-price">{money(p.bottlePrice)}</div>
            <button className="portal-menu-add" onClick={() => addToCart(p)} disabled={p.stock <= 0 || !selectedTableId}>
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="portal-cart">
          <div className="portal-cart-header">
            <strong>Your Order</strong>
            <span>{cart.length} items • {money(total)}</span>
          </div>
          {cart.map(l => (
            <div key={l.id} className="portal-cart-line">
              <div><b>{l.name}</b><small>{money(l.unitPrice)} each</small></div>
              <div className="portal-stepper">
                <button onClick={() => updateQty(l.id, -1)}><Minus size={14} /></button>
                <b>{l.quantity}</b>
                <button onClick={() => updateQty(l.id, 1)}><Plus size={14} /></button>
              </div>
              <b className="portal-cart-line-total">{money(l.unitPrice * l.quantity)}</b>
            </div>
          ))}
          <input className="portal-cart-note" placeholder="Special instructions..." value={note} onChange={e => setNote(e.target.value)} />
          <button className="portal-btn-primary portal-cart-submit" onClick={placeOrder} disabled={!selectedTableId}>
            <ShoppingCart size={16} /> Place Order • {money(total)}
          </button>
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
  const myOrders = customerOrders.filter(o => o.customerId === customerId);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "#f97316" },
    preparing: { label: "Preparing", color: "#f9c317" },
    served: { label: "Served", color: "#22c55e" },
    paid: { label: "Paid", color: "#92969c" }
  };

  return (
    <div className="portal-section">
      <h2 className="portal-title">My Orders</h2>
      <p className="portal-subtitle">Track your orders in real time</p>

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
  const assignedWaiter = waiters[0];
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

      {!selectedTableId ? (
        <div className="portal-empty">
          <Bell size={40} />
          <p>Select a table first to connect with your waiter.</p>
        </div>
      ) : (
        <>
          {assignedWaiter && (
            <div className="portal-waiter-card">
              <div className="portal-waiter-avatar">{assignedWaiter.name[0]}</div>
              <div className="portal-waiter-info">
                <strong>{assignedWaiter.name}</strong>
                <span>Your Waiter</span>
                <small>Table {selectedTableId.replace("t", "")}</small>
              </div>
              <button className="portal-btn-call" onClick={handleCall}>
                <Phone size={18} />
                Call
              </button>
            </div>
          )}

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
      )}
    </div>
  );
}
