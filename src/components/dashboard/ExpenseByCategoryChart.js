"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Zap, Droplets, Wallet } from "lucide-react";

const CATEGORY_LABELS = {
  electricity: "Elektrik Faturası",
  water: "Su Faturası",
  extra: "Ekstra Masraflar",
};

const CATEGORY_COLORS = {
  electricity: "#f97316", // orange
  water: "#06b6d4", // cyan
  extra: "#8b5cf6", // purple
};

const CATEGORY_ICONS = {
  electricity: Zap,
  water: Droplets,
  extra: Wallet,
};

export default function ExpenseByCategoryChart({ expenses = [] }) {
  // Kategoriye göre grupla ve toplam tutarı hesapla
  const categoryData = expenses.reduce((acc, expense) => {
    const cat = expense.category || "extra";
    if (!acc[cat]) {
      acc[cat] = { name: CATEGORY_LABELS[cat] || cat, value: 0, category: cat };
    }
    acc[cat].value += expense.amount || 0;
    return acc;
  }, {});

  const chartData = Object.values(categoryData).filter((d) => d.value > 0);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Henüz harcama verisi yok
        </p>
      </div>
    );
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const chartDataWithColors = chartData.map((d) => ({
    ...d,
    color: CATEGORY_COLORS[d.category] || CATEGORY_COLORS.extra,
  }));

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium drop-shadow-sm"
      >
        {`%${(percent * 100).toFixed(0)}`}
      </text>
    );
  };

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            {chartDataWithColors.map((_, index) => (
              <filter
                key={index}
                id={`expense-shadow-${index}`}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="1"
                  stdDeviation="1"
                  floodOpacity="0.15"
                />
              </filter>
            ))}
          </defs>
          <Pie
            data={chartDataWithColors}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="88%"
            paddingAngle={2}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {chartDataWithColors.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={entry.color}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                filter={`url(#expense-shadow-${index})`}
                className="outline-none"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              const pct =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              const Icon = CATEGORY_ICONS[item.category] || Wallet;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" style={{ color: item.color }} />
                    <p className="font-medium text-foreground">{item.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.value.toLocaleString("tr-TR")} ₺ (%{pct})
                  </p>
                </div>
              );
            }}
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            formatter={(value, entry) => {
              const Icon = CATEGORY_ICONS[entry.payload.category] || Wallet;
              return (
                <span className="flex items-center gap-1.5 text-foreground text-sm">
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: entry.payload.color }}
                  />
                  {value}
                  <span className="ml-1.5 text-muted-foreground">
                    ({entry.payload.value.toLocaleString("tr-TR")} ₺)
                  </span>
                </span>
              );
            }}
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
