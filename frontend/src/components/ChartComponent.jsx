import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

// Register ChartJS modules
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

const CATEGORY_COLORS = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
  "#64748b", // Slate
];

export function ExpenseCategoryChart({ categoryBreakdown = [] }) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
        <p style={{ fontSize: "14px", fontWeight: "600" }}>No expense data to display</p>
        <small>Add expenses to see category breakdown</small>
      </div>
    );
  }

  const labels = categoryBreakdown.map((c) => c.category_name);
  const dataValues = categoryBreakdown.map((c) => c.amount);
  const backgroundColors = labels.map(
    (_, index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  );

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: "#1e293b",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          padding: 14,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ₹${val.toLocaleString("en-IN")} (${pct}%)`;
          },
        },
      },
    },
    cutout: "68%",
  };

  return (
    <div style={{ height: "260px", position: "relative" }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export function MonthlyComparisonChart({ monthlyTrends = [] }) {
  if (!monthlyTrends || monthlyTrends.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
        <p style={{ fontSize: "14px", fontWeight: "600" }}>No monthly trends available</p>
        <small>Records will populate monthly comparison</small>
      </div>
    );
  }

  const labels = monthlyTrends.map((t) => t.month);
  const incomeData = monthlyTrends.map((t) => t.income);
  const expenseData = monthlyTrends.map((t) => t.expense);

  const data = {
    labels,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Expenses",
        data: expenseData,
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
        },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.08)" },
        ticks: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          callback: function (val) {
            return `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`;
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.dataset.label}: ₹${context.parsed.y.toLocaleString("en-IN")}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: "260px" }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default {
  ExpenseCategoryChart,
  MonthlyComparisonChart,
};
