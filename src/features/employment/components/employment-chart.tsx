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
import { formatCompact, formatEuros, formatInteger } from "@/shared/lib/format";
import {
  INDICATOR_LABELS,
  type Indicator,
  type QuarterPoint,
} from "../model/employment";
import styles from "./employment-chart.module.css";

const YEARS_BETWEEN_TICKS = 5;
const QUARTERS_PER_YEAR = 4;
const CHART_HEIGHT = 340;

const formatValue = (indicator: Indicator, value: number): string =>
  indicator === "payroll" ? formatEuros(value) : formatInteger(value);

const formatAxisValue = (indicator: Indicator, value: number): string =>
  indicator === "payroll" ? `${formatCompact(value)} €` : formatCompact(value);

type EmploymentChartProps = {
  points: readonly QuarterPoint[];
  indicator: Indicator;
};

// Le graphique est décoratif pour les lecteurs d'écran : le résumé chiffré et le
// tableau de données (dans EmploymentExplorer) portent le même contenu.
export const EmploymentChart = ({
  points,
  indicator,
}: EmploymentChartProps) => (
  <div className={styles.chart} aria-hidden="true">
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart
        data={[...points]}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="employment-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-text)" stopOpacity={0.4} />
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
          interval={YEARS_BETWEEN_TICKS * QUARTERS_PER_YEAR - 1}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          width={64}
          domain={["auto", "auto"]}
          tickFormatter={(value: number) => formatAxisValue(indicator, value)}
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
          labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
          formatter={(value) =>
            typeof value === "number"
              ? [formatValue(indicator, value), INDICATOR_LABELS[indicator]]
              : [String(value), INDICATOR_LABELS[indicator]]
          }
        />
        <Area
          type="monotone"
          dataKey={indicator}
          stroke="var(--brand-text)"
          strokeWidth={2.5}
          fill="url(#employment-fill)"
          dot={false}
          activeDot={{
            r: 5,
            fill: "var(--brand-text)",
            stroke: "var(--surface)",
          }}
          isAnimationActive
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
