import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function IncomeExpenseBarChart({ summary, loading }) {
  if (loading) {
    return (
      <div className="chart-loading-box">
        <div className="analytics-skeleton chart-skeleton" />
      </div>
    );
  }

  const income = summary?.total_income ?? 0;
  const expense = summary?.total_expenses ?? 0;
  const net = summary?.net_balance ?? 0;

  const chartData = {
    labels: ["Income", "Expenses", "Net Balance"],
    datasets: [
      {
        label: "Amount (₹)",
        data: [income, expense, Math.abs(net)],
        backgroundColor: [
          "rgba(16, 185, 129, 0.75)",
          "rgba(239, 68, 68, 0.75)",
          net >= 0 ? "rgba(99, 102, 241, 0.75)" : "rgba(239, 68, 68, 0.75)",
        ],
        borderColor: [
          "#10b981",
          "#ef4444",
          net >= 0 ? "#6366f1" : "#ef4444",
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(30,41,59,0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#94a3b8",
        borderColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148,163,184,0.06)" },
        ticks: { color: "#94a3b8", font: { family: "'Plus Jakarta Sans', sans-serif" } },
      },
      y: {
        grid: { color: "rgba(148,163,184,0.06)" },
        ticks: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif" },
          callback: (v) => `₹${(v / 1000).toFixed(0)}K`,
        },
      },
    },
  };

  if (income === 0 && expense === 0) {
    return (
      <div className="chart-empty">
        <span>📊</span>
        <p>No data for this period</p>
        <small>Add income and expenses to see comparisons</small>
      </div>
    );
  }

  return (
    <div style={{ height: 220 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
