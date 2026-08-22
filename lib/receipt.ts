import type { SaleRecord } from "@/lib/types";

export interface ReceiptLine {
  name: string;
  mode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptData {
  businessName: string;
  address: string;
  phone: string;
  receiptNumber: string;
  date: string;
  items: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  cashier: string;
  footer: string;
}

export function buildReceipt(sale: SaleRecord, settings: { businessName: string; location: string; receiptFooter: string }): ReceiptData {
  return {
    businessName: settings.businessName,
    address: settings.location,
    phone: "",
    receiptNumber: sale.id.slice(0, 8).toUpperCase(),
    date: new Date(sale.createdAt).toLocaleString(),
    items: sale.lines.map((l) => ({
      name: l.name,
      mode: l.mode === "shot" ? "Shot/Tot" : "Bottle",
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.unitPrice * l.quantity
    })),
    subtotal: sale.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    discount: sale.discount,
    total: sale.total,
    paymentMethod: sale.paymentMethod.toUpperCase(),
    paymentStatus: sale.paymentStatus.toUpperCase(),
    cashier: sale.cashierId ?? "—",
    footer: settings.receiptFooter
  };
}

export function printReceiptBrowser(data: ReceiptData): void {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;

  const html = `
<!DOCTYPE html>
<html><head><title>Receipt ${data.receiptNumber}</title>
<style>
  *{font-family:monospace;box-sizing:border-box}
  body{padding:20px;color:#000;background:#fff;font-size:12px}
  .center{text-align:center}
  .bold{font-weight:bold}
  .line{border-top:1px dashed #000;margin:8px 0}
  .item{display:flex;justify-content:space-between;margin:3px 0}
  .total{font-size:16px;font-weight:bold;margin-top:10px}
  .footer{margin-top:15px;text-align:center;color:#555}
</style></head><body>
  <div class="center bold">${data.businessName}</div>
  <div class="center">${data.address}</div>
  <div class="line"></div>
  <div>Receipt: ${data.receiptNumber}</div>
  <div>Date: ${data.date}</div>
  <div>Cashier: ${data.cashier}</div>
  <div class="line"></div>
  ${data.items.map((item) => `
  <div class="item"><span>${item.quantity}x ${item.name} (${item.mode})</span><span>${item.lineTotal.toFixed(2)}</span></div>
  `).join("")}
  <div class="line"></div>
  <div class="item"><span>Subtotal</span><span>${data.subtotal.toFixed(2)}</span></div>
  ${data.discount > 0 ? `<div class="item"><span>Discount</span><span>-${data.discount.toFixed(2)}</span></div>` : ""}
  <div class="item total"><span>TOTAL</span><span>${data.total.toFixed(2)}</span></div>
  <div class="center">Paid via ${data.paymentMethod} - ${data.paymentStatus}</div>
  <div class="line"></div>
  <div class="footer">${data.footer}</div>
  <script>window.print()</script>
</body></html>`;

  win.document.write(html);
  win.document.close();
}

export type PrinterAdapter = {
  print: (data: ReceiptData) => void;
};

export const browserPrinter: PrinterAdapter = {
  print: printReceiptBrowser
};
