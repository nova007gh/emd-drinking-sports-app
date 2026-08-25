"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customersSeed, debtsSeed, expensesSeed, giftCardsSeed, matchesSeed, productsSeed, salesSeed, staffSeed, tablesSeed } from "./seed";
import { applySaleToProduct } from "./domain/inventory";
import { enqueueOfflineOperation } from "./offline/queue";
import type { BarTable, CartLine, Customer, Debt, Expense, GiftCard, HeldOrder, BarEvent, Match, PaymentMethod, Product, SaleMode, SaleRecord, StaffMember, StockMovement, CustomerOrder, WaiterCall, ChatMessage, EventBooking } from "./types";

const PERSIST_KEY = "emd-drinking-sports-v4";

/**
 * Bump this whenever the demo seed data changes shape or content (e.g. adding
 * product categories). On load, a mismatch replaces the seeded collections once
 * so everyone picks up the new catalogue; a match keeps the operator's real work
 * (sales, stock levels, customers, open tables) intact across refreshes.
 */
const SEED_VERSION = 6;

// Clean up old persisted keys from previous versions
if (typeof window !== "undefined") {
  ["emd-drinking-sports", "emd-drinking-sports-v1", "emd-drinking-sports-v2", "emd-drinking-sports-v3"].forEach(k => {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  });
}

interface AppState {
  seedVersion: number;
  products: Product[];
  customers: Customer[];
  tables: BarTable[];
  giftCards: GiftCard[];
  sales: SaleRecord[];
  expenses: Expense[];
  cart: CartLine[];
  selectedTableId?: string;
  selectedCustomerId?: string;
  heldOrders: HeldOrder[];
  debts: Debt[];
  staff: StaffMember[];
  matches: Match[]; // kept for backwards compat — same as events
  events: BarEvent[];
  stockMovements: StockMovement[];
  currentRole: "owner" | "manager" | "cashier" | "waiter";
  currentCashierId: string;
  cartNote: string;
  discount: number;
  selectedGiftCardCode?: string;
  addToCart: (productId: string, mode: SaleMode) => void;
  updateCartQty: (lineId: string, delta: number) => void;
  clearCart: () => void;
  checkout: (method: PaymentMethod) => { sale: SaleRecord; total: number };
  selectTable: (id?: string) => void;
  toggleTable: (id: string) => void;
  transferTable: (fromId: string, toId: string) => void;
  splitBill: (tableId: string, lineIds: string[]) => string | null;
  addStock: (id: string, quantity: number) => void;
  adjustStock: (id: string, delta: number, reason: string) => void;
  addProduct: (product: Omit<Product, "id" | "active">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  toggleProductActive: (id: string) => void;
  addCustomer: (name: string, phone: string) => void;
  addDebt: (customerId: string, amount: number, note?: string) => void;
  payDebt: (debtId: string, amount: number, method: PaymentMethod) => void;
  createGiftCard: (amount: number) => GiftCard;
  redeemGiftCard: (code: string, amount: number) => boolean;
  addExpense: (title: string, amount: number, category: string) => void;
  holdOrder: () => void;
  resumeHeldOrder: (id: string) => void;
  setCartNote: (note: string) => void;
  setDiscount: (amount: number) => void;
  setRole: (role: "owner" | "manager" | "cashier" | "waiter") => void;
  setCashierId: (id: string) => void;
  selectCustomer: (id?: string) => void;
  selectGiftCardCode: (code?: string) => void;
  voidSale: (saleId: string) => void;
  addMatch: (home: string, away: string, startsAt: string, promotion?: string) => void;
  addEvent: (event: Omit<BarEvent, "id" | "active" | "featured">) => void;
  updateEvent: (id: string, updates: Partial<BarEvent>) => void;
  deleteEvent: (id: string) => void;
  featureEvent: (id: string) => void;
  reserveTableForMatch: (matchId: string, tableId: string) => void;
  unreserveTableForMatch: (matchId: string, tableId: string) => void;
  topUpWallet: (customerId: string, amount: number) => void;
  spendWallet: (customerId: string, amount: number) => boolean;
  spendLoyaltyPoints: (customerId: string, points: number) => boolean;
  // Customer portal
  barOpen: boolean;
  toggleBarOpen: () => void;
  customerOrders: CustomerOrder[];
  placeCustomerOrder: (customerId: string, tableId: string, lines: CartLine[], note?: string) => string;
  /** Passing "paid" records a real sale; `method` is how the customer paid. */
  updateCustomerOrderStatus: (orderId: string, status: CustomerOrder["status"], method?: PaymentMethod) => void;
  waiterCalls: WaiterCall[];
  callWaiter: (tableId: string, customerId?: string, message?: string) => void;
  updateWaiterCall: (callId: string, updates: Partial<WaiterCall>) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (tableId: string, sender: "customer" | "waiter", text: string, customerId?: string, waiterId?: string) => void;
  eventBookings: EventBooking[];
  bookEvent: (matchId: string, customerId: string, customerName: string, type: "attend" | "reserve", tableId?: string) => void;
  /** Notifications for upcoming events */
  eventNotifications: Array<{ id: string; text: string; eventId: string; severity: "info" | "warning" }>;
  dismissEventNotification: (id: string) => void;
}

const totalOf = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

/**
 * Decide what state to restore on load.
 *
 * Exported so the persistence contract can be unit tested: operator work must
 * survive a refresh, while a bumped SEED_VERSION still rolls a new demo
 * catalogue out to browsers holding an older cache.
 */
export function mergePersistedState(
  persistedState: unknown,
  currentState: AppState
): AppState {
  const persisted = persistedState as Partial<AppState> | undefined;

  // First run, or the demo catalogue changed since this browser last loaded:
  // start from the fresh seed so new products/tables show up.
  if (!persisted || persisted.seedVersion !== SEED_VERSION) {
    return {
      ...currentState,
      seedVersion: SEED_VERSION,
      // Customer-portal activity is the operator's own data, so keep it even
      // through a seed refresh.
      customerOrders: persisted?.customerOrders ?? [],
      waiterCalls: persisted?.waiterCalls ?? [],
      chatMessages: persisted?.chatMessages ?? [],
      eventBookings: persisted?.eventBookings ?? [],
      barOpen: persisted?.barOpen ?? true,
    };
  }

  // Same seed version: restore everything the operator did last session.
  return { ...currentState, ...persisted, seedVersion: SEED_VERSION };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      seedVersion: SEED_VERSION,
      products: productsSeed,
      customers: customersSeed,
      tables: tablesSeed,
      giftCards: giftCardsSeed,
      sales: salesSeed,
      expenses: expensesSeed,
      cart: [],
      selectedTableId: "t5",
      selectedCustomerId: undefined,
      heldOrders: [],
      debts: debtsSeed,
      staff: staffSeed,
      matches: matchesSeed,
      events: matchesSeed,
      stockMovements: [],
      currentRole: "owner",
      currentCashierId: "demo-owner",
      cartNote: "",
      discount: 0,
      selectedGiftCardCode: undefined,
      barOpen: true,
      customerOrders: [],
      waiterCalls: [],
      chatMessages: [],
      eventBookings: [],
      eventNotifications: [],

      addToCart: (productId, mode) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product || !product.active) return;
        if (mode === "bottle" && product.stock <= 0) return;
        if (mode === "shot" && !product.shotPrice) return;

        const price = mode === "shot" ? product.shotPrice! : product.bottlePrice;
        const key = `${productId}-${mode}`;
        set((state) => {
          const existing = state.cart.find((l) => l.id === key);
          if (existing) {
            return { cart: state.cart.map((l) => l.id === key ? { ...l, quantity: l.quantity + 1 } : l) };
          }
          return {
            cart: [...state.cart, {
              id: key,
              productId,
              name: product.name,
              mode,
              unitPrice: price,
              quantity: 1
            }]
          };
        });
      },

      updateCartQty: (lineId, delta) => set((state) => ({
        cart: state.cart
          .map((l) => l.id === lineId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l)
          .filter((l) => l.quantity > 0)
      })),

      clearCart: () => set({ cart: [], cartNote: "", discount: 0, selectedGiftCardCode: undefined }),

      checkout: (method) => {
        const state = get();
        const subtotal = totalOf(state.cart);
        if (subtotal <= 0) throw new Error("Cart is empty");
        const total = Math.max(0, subtotal - state.discount);

        if (method === "wallet") {
          if (!state.selectedCustomerId) throw new Error("Wallet payment requires a selected customer.");
          const customer = state.customers.find((c) => c.id === state.selectedCustomerId);
          if (!customer) throw new Error("Selected customer not found.");
          if (customer.walletBalance < total) throw new Error("Insufficient wallet balance.");
        }

        if (method === "gift") {
          if (!state.selectedGiftCardCode) throw new Error("Gift card payment requires a gift card code.");
          const card = state.giftCards.find((g) => g.code.toUpperCase() === state.selectedGiftCardCode!.toUpperCase() && g.status === "active");
          if (!card) throw new Error("Gift card not found or inactive.");
          if (card.expiryDate && new Date(card.expiryDate) < new Date()) throw new Error("Gift card has expired.");
          if (card.balance < total) throw new Error("Insufficient gift card balance.");
        }

        let nextProducts = [...state.products];
        const newMovements: StockMovement[] = [];

        for (const line of state.cart) {
          const product = nextProducts.find((p) => p.id === line.productId);
          if (!product) continue;
          const updated = applySaleToProduct(product, line.mode, line.quantity);
          nextProducts = nextProducts.map((p) => p.id === product.id ? updated : p);

          if (line.mode === "bottle") {
            newMovements.push({
              id: crypto.randomUUID(),
              productId: product.id,
              productName: product.name,
              movementType: "sale_bottle",
              bottleDelta: -line.quantity,
              shotDelta: 0,
              reason: `POS checkout - ${line.quantity} bottle(s)`,
              createdAt: new Date().toISOString()
            });
          } else {
            const bottlesOpened = product.stock - updated.stock;
            if (bottlesOpened > 0) {
              newMovements.push({
                id: crypto.randomUUID(),
                productId: product.id,
                productName: product.name,
                movementType: "open_for_shots",
                bottleDelta: -bottlesOpened,
                shotDelta: product.shotsPerBottle ?? 0,
                reason: `Opened ${bottlesOpened} bottle(s) for shot/tot sales`,
                createdAt: new Date().toISOString()
              });
            }
            newMovements.push({
              id: crypto.randomUUID(),
              productId: product.id,
              productName: product.name,
              movementType: "adjustment_out",
              bottleDelta: 0,
              shotDelta: -line.quantity,
              reason: `Shot/tot consumption - ${line.quantity} shot(s)`,
              createdAt: new Date().toISOString()
            });
          }
        }

        const sale: SaleRecord = {
          id: crypto.randomUUID(),
          total,
          paymentMethod: method,
          paymentStatus: method === "cash" || method === "gift" || method === "wallet" ? "successful" : "pending",
          createdAt: new Date().toISOString(),
          lines: state.cart,
          tableId: state.selectedTableId,
          customerId: state.selectedCustomerId,
          cashierId: state.currentCashierId,
          discount: state.discount,
          note: state.cartNote,
          voided: false
        };

        const selected = state.selectedTableId;
        const nextTables = state.tables.map((t) => selected === t.id ? { ...t, bill: 0, occupied: false } : t);

        let nextCustomers = state.selectedCustomerId
          ? state.customers.map((c) => c.id === state.selectedCustomerId
            ? { ...c, totalSpent: c.totalSpent + total, loyaltyPoints: c.loyaltyPoints + Math.floor(total / 10), lastPurchaseDate: new Date().toISOString(), visitCount: c.visitCount + 1 }
            : c)
          : state.customers;

        if (method === "wallet" && state.selectedCustomerId) {
          nextCustomers = nextCustomers.map((c) => c.id === state.selectedCustomerId
            ? { ...c, walletBalance: c.walletBalance - total }
            : c);
        }

        let nextGiftCards = state.giftCards;
        if (method === "gift" && state.selectedGiftCardCode) {
          nextGiftCards = state.giftCards.map((g) => g.code.toUpperCase() === state.selectedGiftCardCode!.toUpperCase()
            ? { ...g, balance: g.balance - total, status: g.balance - total <= 0 ? "redeemed" : "active" }
            : g);
        }

        set({
          products: nextProducts,
          sales: [sale, ...state.sales],
          cart: [],
          cartNote: "",
          discount: 0,
          selectedGiftCardCode: undefined,
          tables: nextTables,
          stockMovements: [...newMovements, ...state.stockMovements],
          customers: nextCustomers,
          giftCards: nextGiftCards
        });

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          enqueueOfflineOperation("cash_sale", {
            saleId: sale.id,
            lines: state.cart,
            paymentMethod: method,
            discount: state.discount,
            total,
            tableId: state.selectedTableId,
            customerId: state.selectedCustomerId
          }, sale.id).catch(() => {});
        }

        return { sale, total };
      },

      selectTable: (id) => set({ selectedTableId: id }),
      toggleTable: (id) => set((state) => ({
        tables: state.tables.map((t) => t.id === id ? { ...t, occupied: !t.occupied, bill: t.occupied ? 0 : t.bill } : t)
      })),
      transferTable: (fromId, toId) => set((state) => {
        const from = state.tables.find((t) => t.id === fromId);
        if (!from) return {};
        return {
          tables: state.tables.map((t) => {
            if (t.id === fromId) return { ...t, occupied: false, bill: 0 };
            if (t.id === toId) return { ...t, occupied: true, bill: from.bill };
            return t;
          })
        };
      }),

      splitBill: (tableId, lineIds) => {
        const state = get();
        const originalSale = state.sales.find(s => s.tableId === tableId && !s.voided);
        if (!originalSale || lineIds.length === 0) return null;

        const newSaleId = crypto.randomUUID();
        const movedLines = originalSale.lines.filter(l => lineIds.includes(l.id));
        const remainingLines = originalSale.lines.filter(l => !lineIds.includes(l.id));
        const newTotal = movedLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
        const remainingTotal = remainingLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) - originalSale.discount;

        const newSale: SaleRecord = {
          id: newSaleId,
          total: newTotal,
          paymentMethod: "cash",
          paymentStatus: "pending",
          createdAt: new Date().toISOString(),
          lines: movedLines,
          tableId: originalSale.tableId,
          customerId: originalSale.customerId,
          cashierId: originalSale.cashierId,
          discount: 0,
          voided: false
        };

        set({
          sales: [newSale, ...state.sales.map(s => s.id === originalSale.id ? {
            ...s,
            lines: remainingLines,
            total: Math.max(0, remainingTotal)
          } : s)]
        });

        return newSaleId;
      },

      addStock: (id, quantity) => set((state) => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return {};
        return {
          products: state.products.map((p) => p.id === id ? { ...p, stock: p.stock + Math.max(0, quantity) } : p),
          stockMovements: [{
            id: crypto.randomUUID(),
            productId: id,
            productName: product.name,
            movementType: "purchase",
            bottleDelta: Math.max(0, quantity),
            shotDelta: 0,
            reason: `Received ${quantity} bottle(s)`,
            createdAt: new Date().toISOString()
          }, ...state.stockMovements]
        };
      }),

      adjustStock: (id, delta, reason) => set((state) => {
        const product = state.products.find((p) => p.id === id);
        if (!product) return {};
        const newStock = Math.max(0, product.stock + delta);
        return {
          products: state.products.map((p) => p.id === id ? { ...p, stock: newStock } : p),
          stockMovements: [{
            id: crypto.randomUUID(),
            productId: id,
            productName: product.name,
            movementType: delta >= 0 ? "adjustment_in" : "adjustment_out",
            bottleDelta: delta,
            shotDelta: 0,
            reason,
            createdAt: new Date().toISOString()
          }, ...state.stockMovements]
        };
      }),

      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: crypto.randomUUID(), active: true }]
      })),
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, ...updates } : p)
      })),
      toggleProductActive: (id) => set((state) => ({
        products: state.products.map((p) => p.id === id ? { ...p, active: !p.active } : p)
      })),

      addCustomer: (name, phone) => set((state) => ({
        customers: [...state.customers, {
          id: crypto.randomUUID(), name, phone, totalSpent: 0, debt: 0, loyaltyPoints: 0, walletBalance: 0, visitCount: 0
        }]
      })),

      addDebt: (customerId, amount, note) => set((state) => {
        const customer = state.customers.find((c) => c.id === customerId);
        if (!customer) return {};
        const debt: Debt = {
          id: crypto.randomUUID(),
          customerId,
          customerName: customer.name,
          originalAmount: amount,
          outstandingAmount: amount,
          note,
          createdAt: new Date().toISOString(),
          payments: []
        };
        return {
          debts: [debt, ...state.debts],
          customers: state.customers.map((c) => c.id === customerId ? { ...c, debt: c.debt + amount } : c)
        };
      }),

      payDebt: (debtId, amount, method) => set((state) => {
        const debt = state.debts.find((d) => d.id === debtId);
        if (!debt) return {};
        const payment = Math.min(amount, debt.outstandingAmount);
        return {
          debts: state.debts.map((d) => d.id === debtId
            ? { ...d, outstandingAmount: d.outstandingAmount - payment, payments: [...d.payments, { id: crypto.randomUUID(), debtId, amount: payment, paymentMethod: method, createdAt: new Date().toISOString() }] }
            : d),
          customers: state.customers.map((c) => c.id === debt.customerId ? { ...c, debt: Math.max(0, c.debt - payment) } : c)
        };
      }),

      createGiftCard: (amount) => {
        const card: GiftCard = {
          id: crypto.randomUUID(),
          code: `EMD-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          balance: amount,
          status: "active",
          createdAt: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 7776000000).toISOString()
        };
        set((state) => ({ giftCards: [card, ...state.giftCards] }));
        return card;
      },

      redeemGiftCard: (code, amount) => {
        const card = get().giftCards.find((g) => g.code.toUpperCase() === code.toUpperCase() && g.status === "active");
        if (!card || card.balance < amount) return false;
        if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
          set((state) => ({
            giftCards: state.giftCards.map((g) => g.id === card.id ? { ...g, status: "expired" } : g)
          }));
          return false;
        }
        set((state) => ({
          giftCards: state.giftCards.map((g) => g.id === card.id
            ? { ...g, balance: g.balance - amount, status: g.balance - amount <= 0 ? "redeemed" : "active" }
            : g)
        }));
        return true;
      },

      addExpense: (title, amount, category) => set((state) => ({
        expenses: [{ id: crypto.randomUUID(), title, amount, category, createdAt: new Date().toISOString() }, ...state.expenses]
      })),

      holdOrder: () => {
        const state = get();
        if (!state.cart.length) return;
        const held: HeldOrder = {
          id: crypto.randomUUID(),
          lines: state.cart,
          tableId: state.selectedTableId,
          customerId: state.selectedCustomerId,
          note: state.cartNote,
          heldAt: new Date().toISOString()
        };
        set({ heldOrders: [held, ...state.heldOrders], cart: [], cartNote: "", discount: 0 });
      },
      resumeHeldOrder: (id) => {
        const held = get().heldOrders.find((h) => h.id === id);
        if (!held) return;
        set((state) => ({
          cart: held.lines,
          selectedTableId: held.tableId,
          selectedCustomerId: held.customerId,
          cartNote: held.note ?? "",
          heldOrders: state.heldOrders.filter((h) => h.id !== id)
        }));
      },

      setCartNote: (note) => set({ cartNote: note }),
      setDiscount: (amount) => set({ discount: Math.max(0, amount) }),
      setRole: (role) => set({ currentRole: role }),
      setCashierId: (id) => set({ currentCashierId: id }),
      selectCustomer: (id) => set({ selectedCustomerId: id }),
      selectGiftCardCode: (code) => set({ selectedGiftCardCode: code }),

      voidSale: (saleId) => set((state) => {
        const sale = state.sales.find((s) => s.id === saleId);
        if (!sale || sale.voided) return {};
        return {
          sales: state.sales.map((s) => s.id === saleId ? { ...s, voided: true } : s),
          products: state.products.map((p) => {
            const bottleLine = sale.lines.find((l) => l.productId === p.id && l.mode === "bottle");
            const shotLine = sale.lines.find((l) => l.productId === p.id && l.mode === "shot");
            let stock = p.stock;
            let remainingShots = p.remainingShots;
            if (bottleLine) stock += bottleLine.quantity;
            if (shotLine && p.shotsPerBottle) {
              remainingShots = (remainingShots ?? 0) + shotLine.quantity;
              while (remainingShots > p.shotsPerBottle) {
                stock += 1;
                remainingShots -= p.shotsPerBottle;
              }
            }
            return { ...p, stock, remainingShots };
          })
        };
      }),

      addMatch: (home, away, startsAt, promotion) => set((state) => {
        const newEvent: BarEvent = {
          id: crypto.randomUUID(),
          title: `${home} vs ${away}`,
          category: "sports",
          homeTeam: home,
          awayTeam: away,
          startsAt,
          promotionText: promotion,
          featured: false,
          active: true,
          reservedTables: []
        };
        return {
          matches: [...state.matches, newEvent],
          events: [...state.events, newEvent]
        };
      }),

      addEvent: (event) => set((state) => {
        const newEvent: BarEvent = {
          ...event,
          id: crypto.randomUUID(),
          featured: false,
          active: true
        };
        return {
          events: [...state.events, newEvent],
          matches: [...state.matches, newEvent]
        };
      }),

      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
        matches: state.matches.map(m => m.id === id ? { ...m, ...updates } : m),
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id),
        matches: state.matches.filter(m => m.id !== id),
      })),

      featureEvent: (id) => set((state) => ({
        events: state.events.map(e => ({ ...e, featured: e.id === id })),
        matches: state.matches.map(m => ({ ...m, featured: m.id === id })),
      })),

      reserveTableForMatch: (matchId, tableId) => set((state) => ({
        events: state.events.map(e => {
          if (e.id !== matchId) return e;
          const reserved = e.reservedTables ?? [];
          if (reserved.includes(tableId)) return e;
          return { ...e, reservedTables: [...reserved, tableId] };
        }),
        matches: state.matches.map(m => {
          if (m.id !== matchId) return m;
          const reserved = m.reservedTables ?? [];
          if (reserved.includes(tableId)) return m;
          return { ...m, reservedTables: [...reserved, tableId] };
        })
      })),

      unreserveTableForMatch: (matchId, tableId) => set((state) => ({
        events: state.events.map(e => {
          if (e.id !== matchId) return e;
          return { ...e, reservedTables: (e.reservedTables ?? []).filter(t => t !== tableId) };
        }),
        matches: state.matches.map(m => {
          if (m.id !== matchId) return m;
          return { ...m, reservedTables: (m.reservedTables ?? []).filter(t => t !== tableId) };
        })
      })),

      topUpWallet: (customerId, amount) => set((state) => ({
        customers: state.customers.map((c) => c.id === customerId ? { ...c, walletBalance: c.walletBalance + amount } : c)
      })),

      spendWallet: (customerId, amount) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer || amount <= 0) return false;
        if (customer.walletBalance < amount) return false;
        set((state) => ({
          customers: state.customers.map((c) => c.id === customerId ? { ...c, walletBalance: c.walletBalance - amount } : c)
        }));
        return true;
      },

      spendLoyaltyPoints: (customerId, points) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer || points <= 0) return false;
        if (customer.loyaltyPoints < points) return false;
        set((state) => ({
          customers: state.customers.map((c) => c.id === customerId ? { ...c, loyaltyPoints: c.loyaltyPoints - points } : c)
        }));
        return true;
      },

      toggleBarOpen: () => set((s) => ({ barOpen: !s.barOpen })),

      /**
       * A portal order is real trade, so it draws stock and opens a tab on the
       * table straight away — the same as a waiter keying it into the POS.
       * Revenue is only recognised later, when the order is paid.
       */
      placeCustomerOrder: (customerId, tableId, lines, note) => {
        const state = get();
        const id = `co${Date.now()}`;
        const order: CustomerOrder = { id, customerId, tableId, lines, status: "pending", createdAt: new Date().toISOString(), note };

        let nextProducts = [...state.products];
        const newMovements: StockMovement[] = [];

        for (const line of lines) {
          const product = nextProducts.find((p) => p.id === line.productId);
          if (!product) continue;
          const updated = applySaleToProduct(product, line.mode, line.quantity);
          nextProducts = nextProducts.map((p) => p.id === product.id ? updated : p);

          if (line.mode === "bottle") {
            newMovements.push({
              id: crypto.randomUUID(),
              productId: product.id,
              productName: product.name,
              movementType: "sale_bottle",
              bottleDelta: -line.quantity,
              shotDelta: 0,
              reason: `Customer portal order - ${line.quantity} bottle(s)`,
              createdAt: new Date().toISOString()
            });
          } else {
            const bottlesOpened = product.stock - updated.stock;
            if (bottlesOpened > 0) {
              newMovements.push({
                id: crypto.randomUUID(),
                productId: product.id,
                productName: product.name,
                movementType: "open_for_shots",
                bottleDelta: -bottlesOpened,
                shotDelta: product.shotsPerBottle ?? 0,
                reason: `Opened ${bottlesOpened} bottle(s) for shot/tot sales`,
                createdAt: new Date().toISOString()
              });
            }
            newMovements.push({
              id: crypto.randomUUID(),
              productId: product.id,
              productName: product.name,
              movementType: "adjustment_out",
              bottleDelta: 0,
              shotDelta: -line.quantity,
              reason: `Shot/tot consumption - ${line.quantity} shot(s)`,
              createdAt: new Date().toISOString()
            });
          }
        }

        const orderTotal = totalOf(lines);
        set({
          customerOrders: [order, ...state.customerOrders],
          products: nextProducts,
          stockMovements: [...newMovements, ...state.stockMovements],
          tables: state.tables.map((t) => t.id === tableId
            ? { ...t, occupied: true, bill: t.bill + orderTotal }
            : t)
        });
        return id;
      },

      /**
       * Moving an order to "paid" recognises the revenue: it writes a real
       * SaleRecord so the money shows up in Today's Sales, reports and payment
       * reconciliation, credits loyalty, and clears the amount off the tab.
       * Stock was already taken when the order was placed.
       */
      updateCustomerOrderStatus: (orderId, status, method: PaymentMethod = "cash") => {
        const state = get();
        const order = state.customerOrders.find((o) => o.id === orderId);
        if (!order) return;

        const alreadyPaid = order.status === "paid";
        const nextOrders = state.customerOrders.map((o) => o.id === orderId ? { ...o, status } : o);

        if (status !== "paid" || alreadyPaid) {
          set({ customerOrders: nextOrders });
          return;
        }

        const total = totalOf(order.lines);
        const sale: SaleRecord = {
          id: crypto.randomUUID(),
          total,
          paymentMethod: method,
          paymentStatus: method === "cash" || method === "gift" || method === "wallet" ? "successful" : "pending",
          createdAt: new Date().toISOString(),
          lines: order.lines,
          tableId: order.tableId,
          customerId: order.customerId,
          cashierId: state.currentCashierId,
          discount: 0,
          note: order.note ? `Portal order: ${order.note}` : "Customer portal order",
          voided: false
        };

        set({
          customerOrders: nextOrders,
          sales: [sale, ...state.sales],
          customers: state.customers.map((c) => c.id === order.customerId
            ? {
                ...c,
                totalSpent: c.totalSpent + total,
                loyaltyPoints: c.loyaltyPoints + Math.floor(total / 10),
                lastPurchaseDate: new Date().toISOString(),
                visitCount: c.visitCount + 1
              }
            : c),
          tables: state.tables.map((t) => {
            if (t.id !== order.tableId) return t;
            const remaining = Math.max(0, t.bill - total);
            return { ...t, bill: remaining, occupied: remaining > 0 };
          })
        });
      },

      callWaiter: (tableId, customerId, message) => {
        const id = `wc${Date.now()}`;
        const call: WaiterCall = { id, tableId, customerId, status: "pending", message, createdAt: new Date().toISOString() };
        set((s) => ({ waiterCalls: [call, ...s.waiterCalls] }));
      },

      updateWaiterCall: (callId, updates) => set((s) => ({
        waiterCalls: s.waiterCalls.map((c) => c.id === callId ? { ...c, ...updates } : c)
      })),

      sendChatMessage: (tableId, sender, text, customerId, waiterId) => {
        const id = `msg${Date.now()}`;
        const msg: ChatMessage = { id, tableId, customerId, waiterId, sender, text, createdAt: new Date().toISOString() };
        set((s) => ({ chatMessages: [...s.chatMessages, msg] }));
      },

      bookEvent: (matchId, customerId, customerName, type, tableId) => {
        const id = `eb${Date.now()}`;
        const booking: EventBooking = { id, matchId, eventId: matchId, customerId, customerName, tableId, type, createdAt: new Date().toISOString() };
        set((s) => ({
          eventBookings: [...s.eventBookings, booking],
          events: type === "attend"
            ? s.events.map(e => e.id === matchId ? { ...e, attendeeCount: (e.attendeeCount ?? 0) + 1 } : e)
            : s.events,
        }));
        if (type === "reserve" && tableId) {
          set((s) => ({
            matches: s.matches.map((m) => m.id === matchId ? { ...m, reservedTables: [...(m.reservedTables ?? []), tableId] } : m),
            events: s.events.map((e) => e.id === matchId ? { ...e, reservedTables: [...(e.reservedTables ?? []), tableId] } : e),
          }));
        }
      },

      dismissEventNotification: (id) => set((state) => ({
        eventNotifications: state.eventNotifications.filter(n => n.id !== id),
      })),
    }),
    {
      name: PERSIST_KEY,
      version: 4,
      migrate: () => undefined,
      merge: (persistedState, currentState) => mergePersistedState(persistedState, currentState as AppState)
    }
  )
);

/**
 * Cross-tab sync. The staff app and the customer portal are separate tabs
 * sharing one localStorage key, so adopt whatever the other tab wrote. Seeds
 * are deliberately NOT re-applied here — that would discard live sales, stock
 * movements and table state from the writing tab.
 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== PERSIST_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue);
      if (!parsed?.state || parsed.state.seedVersion !== SEED_VERSION) return;
      const incoming = parsed.state as Partial<AppState>;
      // Keep this tab's own in-progress cart/selection so a cashier mid-sale
      // isn't disturbed by activity in another tab.
      const localOnly = {
        cart: useAppStore.getState().cart,
        cartNote: useAppStore.getState().cartNote,
        discount: useAppStore.getState().discount,
        selectedTableId: useAppStore.getState().selectedTableId,
        selectedCustomerId: useAppStore.getState().selectedCustomerId,
      };
      useAppStore.setState({ ...incoming, ...localOnly });
    } catch { /* ignore parse errors */ }
  });
}
