"use client";

import type { Product, ProductCategory } from "@/lib/types";

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
        {/* Arbitrary user-supplied remote URL + onError swap to an SVG fallback.
            next/image cannot optimize an unenumerable host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
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

export { ProductVisual, ProductSvg };
