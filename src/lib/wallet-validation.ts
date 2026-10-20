export type WithdrawalAmountResult =
  | { valid: true; amount: number }
  | { valid: false; message: string };

/** Client feedback only; the database trigger independently enforces the same rules. */
export function validateWithdrawalAmount(rawAmount: string, availableBalance: number): WithdrawalAmountResult {
  const value = rawAmount.trim();
  if (!/^\d+$/.test(value)) return { valid: false, message: "Enter a whole amount." };

  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) return { valid: false, message: "Enter a valid amount." };
  if (amount < 500) return { valid: false, message: "Enter a whole amount of at least ₹500." };
  if (amount > availableBalance) return { valid: false, message: "The requested amount is higher than your available balance." };
  return { valid: true, amount };
}