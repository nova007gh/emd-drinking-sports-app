import { describe, expect, it } from "vitest";
import { ghanaCedisToPesewas, pesewasToGhanaCedis } from "@/lib/domain/money";

describe("money accounting", () => {
  it("stores GHS as integer pesewas", () => {
    expect(ghanaCedisToPesewas(15.75)).toBe(1575);
  });

  it("converts pesewas back to GHS", () => {
    expect(pesewasToGhanaCedis(22000)).toBe(220);
  });
});
