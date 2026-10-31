import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { plans, planSlug } from "@/data/mock";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/membership")({
  head: () => createRouteHead("Holiday Membership Plans — JK Holidays", "Compare Silver, Gold and Platinum JK Holidays memberships and choose the travel benefits that suit you."),
  component: () => (
    <PublicLayout>
      <section className="bg-navy-gradient py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <motion.h1
            className="text-center font-serif text-4xl font-bold"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            Our Membership Plans
          </motion.h1>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                className={`overflow-hidden rounded-xl bg-white text-navy-deep shadow-xl ${p.highlight ? "ring-4 ring-gold" : ""}`}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ type: "spring", stiffness: 240, damping: 26, delay: i * 0.12 }}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 320, damping: 20 } }}
              >
                <motion.div
                  className={`px-6 py-4 text-center font-serif text-xl font-bold ${p.highlight ? "bg-gold-gradient text-navy-deep" : "bg-slate-100"}`}
                  initial={{ opacity: 0, y: -12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 260, damping: 20 }}
                >
                  {p.name.toUpperCase()}
                </motion.div>
                <div className="p-6 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.28 + i * 0.12, type: "spring", stiffness: 300, damping: 18 }}
                  >
                    <div className="text-sm text-muted-foreground line-through">₹{p.original.toLocaleString()}</div>
                    <div className="mt-1 font-serif text-4xl font-bold">₹ {p.price.toLocaleString()}</div>
                  </motion.div>
                  <div className="mt-2 text-xs font-semibold text-muted-foreground">{p.nights} · {p.validity}</div>
                  <motion.ul
                    className="mt-5 space-y-2 text-left text-sm"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 + i * 0.12 } } }}
                  >
                    {p.features.map((f) => (
                      <motion.li
                        key={f}
                        className="flex gap-2"
                        variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 340, damping: 26 } } }}
                      >
                        <Check className="h-4 w-4 text-gold" />{f}
                      </motion.li>
                    ))}
                  </motion.ul>
                  <motion.div
                    className="mt-6 flex gap-2"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.45 + i * 0.12, type: "spring", stiffness: 260, damping: 22 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button asChild className="flex-1 bg-gold-gradient font-bold text-navy-deep hover:opacity-90">
                      <Link to="/packages/$slug" params={{ slug: planSlug[p.name] }} search={{ request: 1 }}>JOIN NOW</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 font-bold">
                      <Link to="/packages/$slug" params={{ slug: planSlug[p.name] }} search={{}}>KNOW MORE <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
});
