import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndianRupee, Percent, Save, Users } from "lucide-react";
import { db, inr, useRefresh, useRows } from "@/lib/data";
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
    </div>
  );
}
