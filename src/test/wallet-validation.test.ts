import { describe, expect, it } from "vitest";
import { validateWithdrawalAmount } from "@/lib/wallet-validation";

describe("withdrawal amount validation", () => {
  it("rejects amounts below the ₹500 minimum", () => {
    expect(validateWithdrawalAmount("499", 1000)).toEqual({
      valid: false,
      message: "Enter a whole amount of at least ₹500.",
    });
  });

  it("accepts the ₹500 minimum", () => {
    expect(validateWithdrawalAmount("500", 500)).toEqual({ valid: true, amount: 500 });
  });

  it("rejects decimal amounts", () => {
    expect(validateWithdrawalAmount("500.5", 1000)).toEqual({
      valid: false,
      message: "Enter a whole amount.",
    });
  });

  it("rejects a request above the available balance", () => {
    expect(validateWithdrawalAmount("501", 500)).toEqual({
      valid: false,
      message: "The requested amount is higher than your available balance.",
    });
  });
});