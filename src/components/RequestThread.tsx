import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { db, fmtDateTime, useRefresh, useRows } from "@/lib/data";

/** Two-way message thread on a holiday request. `sender` is the side viewing it; messages are private to the request. */
export function RequestThread({ requestId, sender, className }: { requestId: string; sender: "admin" | "member"; className?: string }) {
  const thread = useRows<any>(["request_messages", requestId], () =>
    db.from("request_messages").select("*").eq("request_id", requestId).order("created_at", { ascending: true }), !!requestId);
  const refresh = useRefresh();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reply.trim()) return toast.error("Please enter a message.");
    setBusy(true);
    const { error } = await db.from("request_messages").insert({ request_id: requestId, sender, body: reply.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    setReply("");
    refresh("request_messages");
    toast.success(sender === "admin" ? "Message sent to member" : "Message sent to our team");
  };

  const messages = thread.data ?? [];
  return (
    <div className={className}>
      <div className="font-semibold text-navy">Messages</div>
      <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
        {!messages.length && <div className="text-xs text-muted-foreground">No messages yet.</div>}
        {messages.map((msg: any) => (
          <div key={msg.id} className={msg.sender === sender ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.sender === sender ? "bg-navy text-white" : "bg-muted"}`}>
              <div className="opacity-70">{msg.sender === sender ? "You" : msg.sender === "admin" ? "JK Holidays team" : "Member"} · {fmtDateTime(msg.created_at)}</div>
              <div className="mt-1 whitespace-pre-wrap">{msg.body}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-start gap-2">
        <Textarea rows={2} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <Button disabled={busy} className="shrink-0 bg-navy text-primary-foreground" onClick={send}>Send</Button>
      </div>
    </div>
  );
}
