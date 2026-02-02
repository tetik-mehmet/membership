"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const CHART_COLORS = [
  "#22c55e",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#ec4899",
];

function getChartColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export default function MembershipDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <p className="text-sm text-muted-foreground">Henüz üyelik verisi yok</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chartData = data.map((d, i) => ({
    ...d,
    color: getChartColor(i),
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
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            {chartData.map((_, index) => (
              <filter
                key={index}
                id={`shadow-${index}`}
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
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="88%"
            paddingAngle={2}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                filter={`url(#shadow-${index})`}
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
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.value} üyelik (%{pct})
                  </p>
                </div>
              );
            }}
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            formatter={(value, entry) => (
              <span className="text-foreground text-sm">
                {value}
                <span className="ml-1.5 text-muted-foreground">
                  ({entry.payload.value})
                </span>
              </span>
            )}
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
