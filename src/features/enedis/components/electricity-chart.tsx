"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "@/shared/lib/format";
import { formatEnergy, type YearPoint } from "../model/electricity";
import styles from "./electricity-chart.module.css";

const CHART_HEIGHT = 320;
const SERIES_LABELS = { total: "Total commune", residential: "Résidentiel" };

type ElectricityChartProps = {
  points: readonly YearPoint[];
};

// Le graphique est décoratif pour les lecteurs d'écran : le résumé chiffré et le
// tableau de données (dans ElectricityExplorer) portent le même contenu.
export const ElectricityChart = ({ points }: ElectricityChartProps) => (
  <div className={styles.chart} aria-hidden="true">
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart
        data={[...points]}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="electricity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--brand-text)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--brand-text)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" />
        <XAxis
          dataKey="year"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          width={64}
          domain={[0, "auto"]}
          tickFormatter={(value: number) => formatCompact(value)}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: "var(--text-muted)", strokeDasharray: "3 4" }}
          contentStyle={{
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            boxShadow: "var(--shadow-md)",
          }}
          formatter={(value, name) => [
            typeof value === "number" ? formatEnergy(value) : String(value),
            name === "total" || name === "residential"
              ? SERIES_LABELS[name]
              : String(name),
          ]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--brand-text)"
          strokeWidth={2.5}
          fill="url(#electricity-fill)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "var(--brand-text)",
            stroke: "var(--surface)",
          }}
          isAnimationActive
          animationDuration={900}
        />
        <Area
          type="monotone"
          dataKey="residential"
          stroke="var(--ev-1)"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
          dot={false}
          activeDot={{ r: 4, fill: "var(--ev-1)", stroke: "var(--surface)" }}
          isAnimationActive
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
