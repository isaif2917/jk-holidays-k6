type WalletTransaction = { type: string; amount: number | string };
type Withdrawal = { status: string; amount: number | string };

export function calculateAvailableWalletBalance(transactions: WalletTransaction[], withdrawals: Withdrawal[]) {
  const ledgerBalance = transactions.reduce(
    (total, transaction) => total + (String(transaction.type).toLowerCase() === "credit" ? 1 : -1) * Number(transaction.amount ?? 0),
    0,
  );
  const reserved = withdrawals
    .filter((withdrawal) => ["pending", "approved", "paid"].includes(withdrawal.status.toLowerCase()))
    .reduce((total, withdrawal) => total + Number(withdrawal.amount ?? 0), 0);
  return Math.max(0, ledgerBalance - reserved);
}