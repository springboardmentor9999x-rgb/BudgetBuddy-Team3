import React from "react";
import { TrendingUp, TrendingDown, Wallet, Percent } from "lucide-react";

function fmt(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

const cards = [
  {
    key: "total_income",
    label: "Total Income",
    icon: TrendingUp,
    color: "var(--success)",
    bg: "var(--success-light)",
    border: "rgba(16,185,129,0.25)",
    formatter: fmt,
  },
  {
    key: "total_expenses",
    label: "Total Expenses",
    icon: TrendingDown,
    color: "var(--danger)",
    bg: "var(--danger-light)",
    border: "rgba(239,68,68,0.25)",
    formatter: fmt,
  },
  {
    key: "net_balance",
    label: "Net Balance",
    icon: Wallet,
    color: "var(--primary)",
    bg: "var(--primary-light)",
    border: "rgba(99,102,241,0.25)",
    formatter: fmt,
    dynamic: true, // color changes based on positive/negative
  },
  {
    key: "savings_rate",
    label: "Savings Rate",
    icon: Percent,
    color: "var(--accent)",
    bg: "var(--accent-light)",
    border: "rgba(139,92,246,0.25)",
    formatter: (v) => `${v ?? 0}%`,
  },
];

export default function AnalyticsSummaryCards({ summary, loading }) {
  return (
    <div className="analytics-summary-grid">
      {cards.map(({ key, label, icon: Icon, color, bg, border, formatter, dynamic }) => {
        const value = summary?.[key] ?? 0;
        const isNeg = dynamic && value < 0;
        const activeColor = isNeg ? "var(--danger)" : color;
        const activeBg = isNeg ? "var(--danger-light)" : bg;
        const activeBorder = isNeg ? "rgba(239,68,68,0.25)" : border;

        return (
          <div
            key={key}
            className="analytics-card"
            style={{
              background: activeBg,
              border: `1px solid ${activeBorder}`,
            }}
          >
            <div
              className="analytics-card-icon"
              style={{ background: activeBg, color: activeColor, border: `1px solid ${activeBorder}` }}
            >
              <Icon size={20} />
            </div>
            <div className="analytics-card-body">
              <p className="analytics-card-label">{label}</p>
              {loading ? (
                <div className="analytics-skeleton" style={{ width: 100, height: 28 }} />
              ) : (
                <h3 className="analytics-card-value" style={{ color: activeColor }}>
                  {formatter(value)}
                </h3>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
