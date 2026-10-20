import { describe, expect, it } from "vitest";
import { calculateAvailableWalletBalance } from "@/lib/wallet-balance";

describe("available wallet balance", () => {
  it("subtracts debits, paid withdrawals, and pending or approved reservations", () => {
    expect(calculateAvailableWalletBalance(
      [{ type: "credit", amount: "1000" }, { type: "Debit", amount: 250 }],
      [
        { status: "Pending", amount: 200 },
        { status: "Approved", amount: 100 },
        { status: "Paid", amount: 100 },
        { status: "Rejected", amount: 300 },
      ],
    )).toBe(350);
  });

  it("never reports a negative available balance", () => {
    expect(calculateAvailableWalletBalance(
      [{ type: "Credit", amount: 500 }],
      [{ status: "Paid", amount: 700 }],
    )).toBe(0);
  });
});