import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Segmented, Stat } from "@/routes/play.tic-tac-toe";
import {
  GAME_LABEL,
  achievements,
  summarize,
  useHistory,
  type GameKey,
} from "@/lib/stats";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Profile — BoardMaster AI" },
      {
        name: "description",
        content:
          "Track win rates, engine search effort, decision times and achievements across every BoardMaster AI match you play.",
      },
      { property: "og:title", content: "Analytics & Profile — BoardMaster AI" },
      {
        property: "og:description",
        content: "Win rates, search effort and achievements across all three engines.",
      },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { history, clear } = useHistory();
  const [filter, setFilter] = useState<"all" | GameKey>("all");
  const filtered = useMemo(
    () => (filter === "all" ? history : history.filter((h) => h.game === filter)),
    [history, filter],
  );
  const stats = summarize(filtered);
  const unlocked = achievements(history);

  const trend = useMemo(
    () =>
      [...filtered]
        .reverse()
        .map((h, i) => ({ n: i + 1, ms: h.decisionMs, nodes: h.nodes })),
    [filtered],
  );

  return (
    <AppShell
      eyebrow="Command center"
      title="Analytics"
      description="Every match is stored on this device and scored against the engine that played it."
      aside={
        <button
          onClick={clear}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          Reset history
        </button>
      }
    >
      <div className="space-y-6">
        <div className="glass rounded-3xl p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-edge)] text-lg font-bold text-background">
                {stats.level}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">Strategist · Level {stats.level}</p>
                <p className="text-sm text-muted-foreground">
                  Favourite: {stats.favorite?.label ?? "—"} · {stats.total} matches recorded
                </p>
              </div>
            </div>
            <Segmented
              label="Filter"
              value={filter}
              onChange={(v) => setFilter(v as "all" | GameKey)}
              options={[
                ["all", "All"],
                ["tic-tac-toe", "TTT"],
                ["connect-4", "C4"],
                ["checkers", "Checkers"],
              ]}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Games played" value={String(stats.total)} />
          <Stat label="Win rate" value={`${stats.winRate}%`} />
          <Stat label="Nodes searched" value={stats.nodes.toLocaleString()} />
          <Stat label="Avg decision time" value={`${stats.avgDecision} ms`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Win rate by module
            </h2>
            <div className="mt-5 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byGame}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
                    {stats.byGame.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "var(--violet)" : i === 1 ? "var(--cyan)" : "var(--success)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Engine decision time
            </h2>
            <div className="mt-5 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Line type="monotone" dataKey="ms" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!trend.length && (
              <p className="text-sm text-muted-foreground">Play a match to populate this chart.</p>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Recent activity
            </h2>
            <ul className="mt-4 divide-y divide-border/60">
              {filtered.slice(0, 8).map((h) => (
                <li key={h.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{GAME_LABEL[h.game]}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.difficulty} · {h.moves} moves · {h.nodes.toLocaleString()} nodes
                    </p>
                  </div>
                  <span
                    className={`self-center rounded-full px-3 py-1 text-xs font-semibold ${
                      h.outcome === "win"
                        ? "bg-success/20 text-success"
                        : h.outcome === "loss"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {h.outcome}
                  </span>
                </li>
              ))}
              {!filtered.length && (
                <li className="py-4 text-sm text-muted-foreground">No matches recorded yet.</li>
              )}
            </ul>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Achievements
            </h2>
            <ul className="mt-4 space-y-3">
              {unlocked.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl p-3 ${a.unlocked ? "bg-secondary/60 glow-ring" : "bg-secondary/25 opacity-60"}`}
                >
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </motion.li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}