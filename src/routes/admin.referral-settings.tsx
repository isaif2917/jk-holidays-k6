import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { IndianRupee, Percent, Save, Users } from "lucide-react";
import { db, fmtDate, inr, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { rejectReferral, settleReferral } from "@/lib/admin.functions";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/referral-settings")({ head: () => createRouteHead("Referral Settings — JK Holidays Admin", "Configure referral cashback rules and per-membership reward values."), component: ReferralSettings });

function ReferralSettings() {
  const refresh = useRefresh();
  const settings = useRows("admin_settings", () => db.from("admin_settings").select("*"));
  const plans = useRows("membership_plans", () => db.from("membership_plans").select("*").order("sort"));
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<"fixed" | "percent">("fixed");
  const [value, setValue] = useState("2000");
  const [busy, setBusy] = useState(false);
  const [planRewards, setPlanRewards] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    (settings.data ?? []).forEach((r: any) => (map[r.key] = r.value));
    if (map.referral_active) setActive(map.referral_active !== "false");
    if (map.referral_mode === "percent" || map.referral_mode === "fixed") setMode(map.referral_mode);
    if (map.referral_value) setValue(map.referral_value);
  }, [settings.data]);

  useEffect(() => {
    const rewards: Record<string, string> = {};
    (plans.data ?? []).forEach((p: any) => (rewards[p.id] = String(p.referral_amount ?? 0)));
    setPlanRewards(rewards);
  }, [plans.data]);

  const saveSettings = async () => {
    const v = value.trim();
    if (!/^\d+(\.\d+)?$/.test(v) || Number(v) <= 0) return toast.error("Enter a valid reward value");
    setBusy(true);
    const rows = [
      { key: "referral_active", value: active ? "true" : "false" },
      { key: "referral_mode", value: mode },
      { key: "referral_value", value: v },
    ];
    for (const r of rows) {
      const { error } = await db.from("admin_settings").upsert({ ...r, updated_at: new Date().toISOString() });
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    setBusy(false);
    toast.success(active ? "Referral program saved — rewards credit automatically when a referred membership is approved." : "Referral program paused. No new rewards will be credited until you turn it back on.");
    refresh("admin_settings", "membership_plans");
  };

  const savePlanReward = async (p: any) => {
    const raw = (planRewards[p.id] ?? "0").trim();
    if (!/^\d+$/.test(raw)) return toast.error(`${p.name}: enter a whole rupee amount`);
    const { error } = await db.from("membership_plans").update({ referral_amount: Number(raw) }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(`${p.name} reward set to ${inr(Number(raw))}`);
    refresh("membership_plans");
  };

  const pendingRewards = (settings.data ?? []).length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Referral Settings</h1>
        <div className="text-sm text-muted-foreground">Tune what referrers earn when a referred member's membership is approved.</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="p-6">
          <div className="text-xs font-bold tracking-widest text-gold">REWARD ENGINE</div>
          <h2 className="mt-1 font-serif text-xl font-bold text-navy">Cashback rules</h2>

          <div className="mt-5 flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-semibold text-navy">Program active</div>
              <div className="text-xs text-muted-foreground">Pause anytime without losing history</div>
            </div>
            <label className="cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>
          </div>

          <div className="mt-4 text-sm font-semibold text-navy">Cashback type</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode("fixed")} className={`rounded-xl border p-3 text-left ${mode === "fixed" ? "border-gold bg-gold-soft/40" : "bg-card"}`}>
              <IndianRupee className="h-5 w-5 text-navy" />
              <div className="mt-1 text-sm font-bold text-navy">Fixed amount</div>
              <div className="text-xs text-muted-foreground">Flat INR per referral</div>
            </button>
            <button type="button" onClick={() => setMode("percent")} className={`rounded-xl border p-3 text-left ${mode === "percent" ? "border-gold bg-gold-soft/40" : "bg-card"}`}>
              <Percent className="h-5 w-5 text-navy" />
              <div className="mt-1 text-sm font-bold text-navy">Percentage</div>
              <div className="text-xs text-muted-foreground">Of the membership payment</div>
            </button>
          </div>

          <div className="mt-4 text-sm font-semibold text-navy">{mode === "fixed" ? "Default reward value (₹)" : "Reward percentage (%)"}</div>
          <Input className="mt-1" type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} />
          <p className="mt-2 text-xs text-muted-foreground">
            {mode === "fixed"
              ? "Used as the default reward. Set a different fixed reward per membership on the right."
              : "Percentage of the approved membership payment, for every membership."}
          </p>

          <div className="mt-4 rounded-lg border border-dashed border-gold/50 bg-gold-soft/20 p-3">
            <div className="text-xs font-semibold text-muted-foreground">PREVIEW PAYOUT</div>
            <div className="font-serif text-2xl font-bold text-navy">
              {mode === "fixed" ? inr(Number(value) || 0) : `${value || 0}% of plan price`}
            </div>
          </div>

          <Button disabled={busy || pendingRewards} onClick={saveSettings} className="mt-4 w-full bg-navy-deep font-bold text-white"><Save className="mr-2 h-4 w-4" />{busy ? "SAVING…" : "SAVE REFERRAL SETTINGS"}</Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <h2 className="font-serif text-xl font-bold text-navy">Reward per membership</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">In fixed mode, each membership can carry its own reward. A reward of ₹0 means that membership earns no referral reward.</p>
          <div className="mt-4 space-y-2">
            {(plans.data ?? []).map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-bold text-navy">{p.name}{!p.active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}</div>
                  <div className="text-xs text-muted-foreground">Price {inr(p.price)} · {p.nights} nights</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input className="w-28 pl-7" type="number" min="0" value={planRewards[p.id] ?? "0"} onChange={(e) => setPlanRewards({ ...planRewards, [p.id]: e.target.value })} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => savePlanReward(p)}>Save</Button>
                </div>
              </div>
            ))}
            {!(plans.data ?? []).length && <div className="py-6 text-center text-sm text-muted-foreground">{plans.isLoading ? "Loading plans…" : "No membership plans yet."}</div>}
          </div>
          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            How it works: when a member signs up through a friend's referral code and their membership payment is approved, the referrer's wallet is credited automatically with the reward above and the referral is marked Rewarded.
          </div>
        </Card>
      </div>

      <ReferralSettlements />
    </div>
  );
}

function ReferralSettlements() {
  const settle = useServerFn(settleReferral);
  const reject = useServerFn(rejectReferral);
  const refresh = useRefresh();
  const { map: profilesById } = useProfilesMap();
  const settings = useRows("admin_settings", () => db.from("admin_settings").select("*"));
  const rows = useRows("referrals-all", () => db.from("referrals").select("*").order("created_at", { ascending: false }));
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const defaultValue = String((settings.data ?? []).find((r: any) => r.key === "referral_value")?.value ?? "0");

  useEffect(() => {
    const next: Record<string, string> = {};
    (rows.data ?? []).forEach((r: any) => {
      if (r.status === "Pending" || r.status === "Approved") next[r.id] = r.reward_amount != null ? String(r.reward_amount) : defaultValue;
    });
    setAmounts(next);
  }, [rows.data, defaultValue]);

  const doSettle = async (r: any) => {
    const amount = Number(amounts[r.id]);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter the reward amount to settle");
    setBusyId(r.id);
    try {
      await settle({ data: { referralId: r.id, amount } });
      toast.success(`Settled — ₹${amount} credited to ${profilesById[r.user_id]?.full_name || "the referrer"}'s wallet`);
      refresh("referrals", "referrals-all", "member-referrals", "member-referral-summary", "wallet_transactions", "member-wallet-summary", "profiles");
    } catch (e: any) { toast.error(e.message); }
    setBusyId(null);
  };

  const doReject = async (r: any) => {
    setBusyId(r.id);
    try {
      await reject({ data: { referralId: r.id } });
      toast.success("Referral rejected — no reward will be credited");
      refresh("referrals", "referrals-all", "member-referrals", "member-referral-summary", "profiles");
    } catch (e: any) { toast.error(e.message); }
    setBusyId(null);
  };

  const label = (id: string) => {
    const p = profilesById[id];
    return p ? `${p.full_name || p.email || "Member"} (${p.member_code ?? ""})` : id.slice(0, 8);
  };

  const pending = (rows.data ?? []).filter((r: any) => r.status === "Pending" || r.status === "Approved");
  const settled = (rows.data ?? []).filter((r: any) => r.status === "Rewarded" || r.status === "Rejected");

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gold" />
        <h2 className="font-serif text-xl font-bold text-navy">Referral settlements</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Decide each referral reward: settle to credit the referrer's wallet, or reject it. Rewards from approved membership payments are credited automatically.</p>

      <div className="mt-4 space-y-2">
        {rows.isLoading && <div className="py-4 text-center text-sm text-muted-foreground">Loading referrals…</div>}
        {!rows.isLoading && !pending.length && <div className="py-4 text-center text-sm text-muted-foreground">No referrals waiting for settlement.</div>}
        {pending.map((r: any) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <div className="text-sm font-bold text-navy">{r.friend_name} <span className="font-normal text-muted-foreground">· {r.friend_phone}</span></div>
              <div className="text-xs text-muted-foreground">Referred by {label(r.user_id)} · {fmtDate(r.created_at)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge s={r.status} />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input className="w-28 pl-7" type="number" min="0" value={amounts[r.id] ?? ""} onChange={(e) => setAmounts({ ...amounts, [r.id]: e.target.value })} />
              </div>
              <Button size="sm" disabled={busyId === r.id} className="bg-navy text-white" onClick={() => doSettle(r)}>{busyId === r.id ? "Settling…" : "Settle"}</Button>
              <Button size="sm" variant="outline" disabled={busyId === r.id} className="text-destructive" onClick={() => doReject(r)}>Reject</Button>
            </div>
          </div>
        ))}
      </div>

      {settled.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-semibold text-muted-foreground">HISTORY</div>
          <div className="mt-2 space-y-2">
            {settled.map((r: any) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
                <div>
                  <div className="text-sm text-navy">{r.friend_name}</div>
                  <div className="text-xs text-muted-foreground">Referred by {label(r.user_id)} · {fmtDate(r.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge s={r.status} />
                  <span className="text-sm font-semibold text-navy">{r.reward_amount != null ? inr(r.reward_amount) : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
