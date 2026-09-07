import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  "#6366f1", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#3b82f6", "#ec4899", "#14b8a6",
  "#f97316", "#84cc16", "#06b6d4", "#a855f7",
];

export default function SpendingPieChart({ data, loading }) {
  if (loading) {
    return (
      <div className="chart-loading-box">
        <div className="analytics-skeleton chart-skeleton" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <span>🍕</span>
        <p>No spending data for this period</p>
        <small>Add some expenses to see your spending breakdown</small>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.amount),
        backgroundColor: PALETTE.slice(0, data.length),
        borderColor: "rgba(15,23,42,0.5)",
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30,41,59,0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#94a3b8",
        borderColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const item = data[ctx.dataIndex];
            return ` ₹${ctx.parsed.toLocaleString("en-IN")} (${item.percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="pie-chart-wrapper">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
