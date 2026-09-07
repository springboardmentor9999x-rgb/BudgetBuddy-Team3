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

const PALETTE = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6",
  "#f97316", "#84cc16",
];

export default function CategoryOverTimeChart({ data, loading }) {
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
        <span>🗂️</span>
        <p>No category data available</p>
        <small>Add expenses with categories to see trends</small>
      </div>
    );
  }

  // Collect all unique category names
  const allCats = new Set();
  data.forEach((month) => {
    Object.keys(month).forEach((k) => {
      if (k !== "month") allCats.add(k);
    });
  });

  const categories = Array.from(allCats);
  const labels = data.map((d) => d.month);

  const datasets = categories.map((cat, i) => ({
    label: cat,
    data: data.map((d) => d[cat] || 0),
    backgroundColor: PALETTE[i % PALETTE.length] + "cc",
    borderColor: PALETTE[i % PALETTE.length],
    borderWidth: 1,
    borderRadius: 4,
    stack: "categories",
  }));

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          usePointStyle: true,
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30,41,59,0.97)",
        titleColor: "#f8fafc",
        bodyColor: "#94a3b8",
        borderColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: "rgba(148,163,184,0.06)" },
        ticks: { color: "#94a3b8", font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
      },
      y: {
        stacked: true,
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
      <Bar data={chartData} options={options} />
    </div>
  );
}
