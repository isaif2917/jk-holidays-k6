// Referral actions, ported from src/lib/admin.functions.ts (settleReferral, rejectReferral,
// createCustomReward). Behaviour and user-facing messages are intentionally identical to the
// old server functions.
//
// KNOWN LIMIT (carried over): settleReferral and createCustomReward write two rows without a
// transaction, so a failure between the two writes can leave a wallet credit with no matching
// status/history row. The proper fix is a Postgres function; out of scope for this port.
import { HttpError } from "../_shared/http.ts";
import type { Ctx } from "../_shared/auth.ts";
import type {
  CreateCustomRewardInput,
  RejectReferralInput,
  SettleReferralInput,
} from "../_shared/validate.ts";

export async function settleReferral(input: SettleReferralInput, { svc }: Ctx) {
  const { data: ref, error } = await svc.from("referrals").select("*").eq("id", input.referralId).maybeSingle();
  if (error || !ref) throw new HttpError(404, "Could not find this referral");
  if (ref.status === "Rewarded") throw new HttpError(409, "This referral is already settled");
  if (ref.status === "Rejected") throw new HttpError(409, "This referral was rejected");

  const { error: walletError } = await svc.from("wallet_transactions").insert({
    user_id: ref.user_id,
    type: "credit",
    amount: input.amount,
    description: "Referral settlement: " + (ref.friend_name || "referred member"),
  });
  if (walletError) throw new HttpError(500, walletError.message);

  const { error: updateError } = await svc
    .from("referrals")
    .update({ status: "Rewarded", reward_amount: input.amount })
    .eq("id", input.referralId);
  if (updateError) throw new HttpError(500, updateError.message);
  return { ok: true };
}

export async function rejectReferral(input: RejectReferralInput, { svc }: Ctx) {
  const { data: ref, error } = await svc.from("referrals").select("status").eq("id", input.referralId).maybeSingle();
  if (error || !ref) throw new HttpError(404, "Could not find this referral");
  if (ref.status === "Rewarded") throw new HttpError(409, "This referral is already settled and can't be rejected");

  const { error: updateError } = await svc.from("referrals").update({ status: "Rejected" }).eq("id", input.referralId);
  if (updateError) throw new HttpError(500, updateError.message);
  return { ok: true };
}

// Manually credit a reward to a member chosen by the admin, and record it in the
// custom-reward history shown on the referral settings page.
export async function createCustomReward(input: CreateCustomRewardInput, { svc, actorId }: Ctx) {
  const { data: profile, error } = await svc
    .from("profiles")
    .select("full_name, member_code")
    .eq("id", input.userId)
    .maybeSingle();
  if (error || !profile) throw new HttpError(404, "Could not find this member");

  const { error: walletError } = await svc.from("wallet_transactions").insert({
    user_id: input.userId,
    type: "credit",
    amount: input.amount,
    description: `Custom referral reward${input.note ? ": " + input.note.trim() : ""}`,
  });
  if (walletError) throw new HttpError(500, walletError.message);

  const { error: historyError } = await svc.from("custom_referral_rewards").insert({
    user_id: input.userId,
    amount: input.amount,
    note: input.note?.trim() ?? "",
    created_by: actorId, // from the verified JWT, never from the request body
  });
  if (historyError) throw new HttpError(500, historyError.message);
  return { ok: true, name: profile.full_name };
}
