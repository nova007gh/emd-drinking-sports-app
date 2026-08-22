export function ghanaCedisToPesewas(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error("Money value must be finite and non-negative.");
  return Math.round(value * 100);
}

export function pesewasToGhanaCedis(value: number): number {
  if (!Number.isSafeInteger(value)) throw new Error("Pesewa value must be a safe integer.");
  return value / 100;
}
