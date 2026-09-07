import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function MonthlyTrendChart({ data, loading }) {
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
        <span>📈</span>
        <p>No historical data available</p>
        <small>Track income and expenses over time</small>
      </div>
    );
  }

  const labels = data.map((d) => d.month);
  const incomes = data.map((d) => d.income);
  const expenses = data.map((d) => d.expense);
  const savings = data.map((d) => d.savings);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: incomes,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      },
      {
        label: "Expenses",
        data: expenses,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#ef4444",
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      },
      {
        label: "Savings",
        data: savings,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.05)",
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "#6366f1",
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
        borderDash: [5, 3],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30,41,59,0.97)",
        titleColor: "#f8fafc",
        bodyColor: "#94a3b8",
        borderColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        padding: 14,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148,163,184,0.06)" },
        ticks: { color: "#94a3b8", font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
      },
      y: {
        grid: { color: "rgba(148,163,184,0.06)" },
        ticks: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          callback: (v) => `₹${(v / 1000).toFixed(0)}K`,
        },
      },
    },
  };

  return (
    <div style={{ height: 280 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
