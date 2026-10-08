"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { formatINR } from "@/lib/utils";

/** Categorical palette — distinguishable in both themes. */
export const CHART_COLORS = [
  "hsl(231 62% 55%)",
  "hsl(174 58% 39%)",
  "hsl(33 88% 52%)",
  "hsl(280 50% 55%)",
  "hsl(199 78% 46%)",
  "hsl(342 60% 55%)",
  "hsl(152 48% 40%)",
  "hsl(258 62% 62%)",
  "hsl(20 74% 52%)",
  "hsl(196 52% 38%)",
  "hsl(96 42% 42%)",
  "hsl(312 42% 52%)",
];

const AXIS_STYLE = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
} as const;

function TooltipBox({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  formatter?: (value: number | string, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lift">
      {label !== undefined && (
        <p className="text-xs font-semibold text-foreground">{label}</p>
      )}
      <ul className="mt-1 space-y-0.5">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium text-foreground">
              {formatter && entry.value !== undefined
                ? formatter(entry.value, entry.name)
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegistrationsChart({
  data,
  title = "Registrations over time",
  description = "Weekly registrations across all domains",
}: {
  data: { label: string; registrations: number }[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<TooltipBox />} cursor={{ stroke: "hsl(var(--border))" }} />
            <Line
              type="monotone"
              dataKey="registrations"
              name="Registrations"
              stroke={CHART_COLORS[0]}
              strokeWidth={2.2}
              dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS[0] }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function RevenueChart({
  data,
  title = "Revenue over time",
  description = "Weekly collected programme fees",
}: {
  data: { label: string; revenue: number }[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -6 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={62}
              tickFormatter={(value: number) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={
                <TooltipBox formatter={(value) => formatINR(Number(value))} />
              }
              cursor={{ stroke: "hsl(var(--border))" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={CHART_COLORS[1]}
              strokeWidth={2.2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function DomainBarChart({
  data,
  dataKey = "registrations",
  title = "Domain-wise registrations",
  description = "Active registrations per domain",
  money = false,
}: {
  data: { shortName: string; registrations: number; revenue: number }[];
  dataKey?: "registrations" | "revenue";
  title?: string;
  description?: string;
  money?: boolean;
}) {
  return (
    <ChartCard title={title} description={description}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(value: number) =>
                money ? `₹${(value / 1000).toFixed(0)}k` : String(value)
              }
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              content={
                <TooltipBox
                  formatter={(value) =>
                    money ? formatINR(Number(value)) : String(value)
                  }
                />
              }
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar dataKey={dataKey} name={money ? "Revenue" : "Registrations"} radius={[0, 5, 5, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.shortName}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function SplitDonut({
  data,
  title,
  description,
}: {
  data: { name: string; value: number }[];
  title: string;
  description?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <ChartCard title={title} description={description}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={
                <TooltipBox
                  formatter={(value) =>
                    `${value} (${total ? Math.round((Number(value) / total) * 100) : 0}%)`
                  }
                />
              }
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function CompletionBarChart({
  data,
  title = "Completion status",
  description = "Registrations by internship stage",
}: {
  data: { name: string; value: number }[];
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<TooltipBox />} cursor={{ fill: "hsl(var(--muted))" }} />
            <Bar dataKey="value" name="Registrations" radius={[5, 5, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
