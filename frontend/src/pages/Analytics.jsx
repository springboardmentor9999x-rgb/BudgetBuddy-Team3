import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart2,
  TrendingUp,
  Lock,
  Star,
  Shield,
  Download,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import API from "../services/api";
import { useRole } from "../context/RoleContext";
import AnalyticsSummaryCards from "../components/AnalyticsSummaryCards";
import SpendingPieChart from "../components/SpendingPieChart";
import IncomeExpenseBarChart from "../components/IncomeExpenseBarChart";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import CategoryOverTimeChart from "../components/CategoryOverTimeChart";
import GoalsProgressSection from "../components/GoalsProgressSection";
import DateRangePicker from "../components/DateRangePicker";
import "./Analytics.css";

// ==========================================
// HELPERS
// ==========================================

function getDefaultDateRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    startDate: first.toISOString().split("T")[0],
    endDate: last.toISOString().split("T")[0],
  };
}

function fmt(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function ChangeIndicator({ pct }) {
  if (pct === null || pct === undefined)
    return <span className="change-neutral"><Minus size={12} /> N/A</span>;
  if (pct > 0)
    return (
      <span className="change-positive">
        <ArrowUpRight size={13} /> +{pct}%
      </span>
    );
  if (pct < 0)
    return (
      <span className="change-negative">
        <ArrowDownRight size={13} /> {pct}%
      </span>
    );
  return <span className="change-neutral"><Minus size={12} /> 0%</span>;
}

// ==========================================
// PREMIUM LOCK OVERLAY
// ==========================================

function PremiumLock({ feature }) {
  return (
    <div className="premium-lock-overlay">
      <div className="premium-lock-icon">
        <Lock size={28} />
      </div>
      <h4>Premium Feature</h4>
      <p>{feature} is available for Premium and Admin users.</p>
      <span className="premium-badge-pill">
        <Star size={12} /> Upgrade to Premium
      </span>
    </div>
  );
}

// ==========================================
// ANALYTICS PAGE
// ==========================================

export default function Analytics() {
  const { role, isPremiumOrAdmin, isAdmin, isUser, userName, loading: roleLoading } = useRole();

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [trend, setTrend] = useState([]);
  const [categoryTime, setCategoryTime] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [loading, setLoading] = useState({
    summary: true,
    categories: true,
    goals: true,
    trend: true,
    categoryTime: true,
    comparison: true,
  });
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);

  // Build query params (only for premium/admin)
  const buildParams = useCallback(() => {
    if (!isPremiumOrAdmin) return "";
    return `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
  }, [isPremiumOrAdmin, dateRange]);

  // Fetch summary + categories + goals (all roles)
  const loadBasic = useCallback(async () => {
    setLoading((p) => ({ ...p, summary: true, categories: true, goals: true }));
    setError(null);
    const params = buildParams();
    try {
      const [sumRes, catRes, goalsRes] = await Promise.all([
        API.get(`/analytics/summary${params}`),
        API.get(`/analytics/spending-by-category${params}`),
        API.get("/analytics/goals-progress"),
      ]);
      setSummary(sumRes.data);
      setCategories(catRes.data);
      setGoals(goalsRes.data);
    } catch (err) {
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading((p) => ({ ...p, summary: false, categories: false, goals: false }));
    }
  }, [buildParams]);

  // Fetch premium-only analytics
  const loadPremium = useCallback(async () => {
    if (!isPremiumOrAdmin) return;
    setLoading((p) => ({ ...p, trend: true, categoryTime: true, comparison: true }));
    try {
      const [trendRes, catTimeRes, compRes] = await Promise.all([
        API.get("/analytics/monthly-trend?months=12"),
        API.get("/analytics/category-over-time?months=6"),
        API.get("/analytics/comparison"),
      ]);
      setTrend(trendRes.data);
      setCategoryTime(catTimeRes.data);
      setComparison(compRes.data);
    } catch (err) {
      console.error("Premium analytics load error:", err);
    } finally {
      setLoading((p) => ({ ...p, trend: false, categoryTime: false, comparison: false }));
    }
  }, [isPremiumOrAdmin]);

  useEffect(() => {
    loadBasic();
  }, [loadBasic]);

  useEffect(() => {
    loadPremium();
  }, [loadPremium]);

  // Export handlers
  const handleExportExcel = async () => {
    setExporting("excel");
    try {
      const params = buildParams();
      const res = await API.get(`/analytics/export/excel${params}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BudgetBuddy_Analytics_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      const params = buildParams();
      const res = await API.get(`/analytics/export/pdf${params}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BudgetBuddy_Analytics_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  // Role badge config
  const roleBadge = isAdmin
    ? { icon: Shield, label: "Admin Analytics", color: "#ef4444" }
    : isPremiumOrAdmin
    ? { icon: Star, label: "Premium Analytics", color: "#f59e0b" }
    : { icon: BarChart2, label: "My Analytics", color: "#6366f1" };

  const RoleBadgeIcon = roleBadge.icon;

  return (
    <div className="analytics-page animate-fade-in">
      {/* ── PAGE HEADER ── */}
      <div className="analytics-header">
        <div className="analytics-header-left">
          <div
            className="analytics-role-badge"
            style={{ background: `${roleBadge.color}22`, border: `1px solid ${roleBadge.color}44` }}
          >
            <RoleBadgeIcon size={14} style={{ color: roleBadge.color }} />
            <span style={{ color: roleBadge.color }}>{roleBadge.label}</span>
          </div>
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">
            {isUser
              ? `Your financial snapshot for ${summary?.period_label || "this month"}`
              : isPremiumOrAdmin
              ? `Advanced analytics for ${summary?.period_label || "selected period"}`
              : ""}
          </p>
        </div>

        <div className="analytics-header-right">
          <button
            className="analytics-refresh-btn"
            onClick={() => { loadBasic(); loadPremium(); }}
            title="Refresh analytics"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          {isPremiumOrAdmin && (
            <>
              <button
                className="export-btn excel-btn"
                onClick={handleExportExcel}
                disabled={!!exporting}
                id="btn-export-excel"
              >
                <Download size={15} />
                {exporting === "excel" ? "Exporting..." : "Excel"}
              </button>
              <button
                className="export-btn pdf-btn"
                onClick={handleExportPDF}
                disabled={!!exporting}
                id="btn-export-pdf"
              >
                <FileText size={15} />
                {exporting === "pdf" ? "Generating..." : "PDF"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="alert-error" style={{ marginBottom: 24 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── PREMIUM: DATE RANGE PICKER ── */}
      {isPremiumOrAdmin && (
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={(range) => setDateRange(range)}
        />
      )}

      {/* ── SECTION 1: SUMMARY CARDS ── */}
      <section className="analytics-section">
        <h2 className="section-title">
          <TrendingUp size={16} />
          Financial Summary
          {isUser && (
            <span className="section-period-badge">{summary?.period_label || "Current Month"}</span>
          )}
        </h2>
        <AnalyticsSummaryCards summary={summary} loading={loading.summary} />
      </section>

      {/* ── SECTION 2: CHARTS ROW ── */}
      <div className="analytics-charts-row">
        {/* Spending by Category */}
        <div className="analytics-chart-card glass-card">
          <div className="chart-card-header">
            <h3>Spending by Category</h3>
            {isUser && <span className="chart-period-tag">This Month</span>}
          </div>
          <SpendingPieChart data={categories} loading={loading.categories} />
        </div>

        {/* Income vs Expense */}
        <div className="analytics-chart-card glass-card">
          <div className="chart-card-header">
            <h3>Income vs Expenses</h3>
            {isUser && <span className="chart-period-tag">This Month</span>}
          </div>
          <IncomeExpenseBarChart summary={summary} loading={loading.summary} />
        </div>
      </div>

      {/* ── SECTION 3: SAVINGS GOALS ── */}
      <section className="analytics-section">
        <div className="analytics-chart-card glass-card" style={{ maxWidth: "100%" }}>
          <div className="chart-card-header">
            <h3>💰 Savings Goals Progress</h3>
            <span className="chart-period-tag">{goals.length} goal{goals.length !== 1 ? "s" : ""}</span>
          </div>
          <GoalsProgressSection goals={goals} loading={loading.goals} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          PREMIUM SECTIONS (locked for USER)
          ════════════════════════════════════════ */}

      {/* ── PREMIUM: MONTHLY TREND ── */}
      <section className="analytics-section premium-section">
        <div className="section-title-row">
          <h2 className="section-title">
            <Star size={16} className="premium-icon" />
            Monthly Income vs Expense Trend
          </h2>
          {!isPremiumOrAdmin && <span className="premium-pill">⭐ Premium</span>}
        </div>
        <div className={`analytics-chart-card glass-card ${!isPremiumOrAdmin ? "locked-card" : ""}`}>
          {isPremiumOrAdmin ? (
            <>
              <div className="chart-card-header">
                <h3>Last 12 Months</h3>
              </div>
              <MonthlyTrendChart data={trend} loading={loading.trend} />
            </>
          ) : (
            <div className="lock-container" style={{ minHeight: 200 }}>
              <PremiumLock feature="Monthly trend chart" />
            </div>
          )}
        </div>
      </section>

      {/* ── PREMIUM: CATEGORY OVER TIME ── */}
      <section className="analytics-section premium-section">
        <div className="section-title-row">
          <h2 className="section-title">
            <Star size={16} className="premium-icon" />
            Category Breakdown Over Time
          </h2>
          {!isPremiumOrAdmin && <span className="premium-pill">⭐ Premium</span>}
        </div>
        <div className={`analytics-chart-card glass-card ${!isPremiumOrAdmin ? "locked-card" : ""}`}>
          {isPremiumOrAdmin ? (
            <>
              <div className="chart-card-header">
                <h3>Last 6 Months — Stacked by Category</h3>
              </div>
              <CategoryOverTimeChart data={categoryTime} loading={loading.categoryTime} />
            </>
          ) : (
            <div className="lock-container" style={{ minHeight: 200 }}>
              <PremiumLock feature="Category breakdown over time" />
            </div>
          )}
        </div>
      </section>

      {/* ── PREMIUM: MONTH COMPARISON ── */}
      <section className="analytics-section premium-section">
        <div className="section-title-row">
          <h2 className="section-title">
            <Star size={16} className="premium-icon" />
            Month-over-Month Comparison
          </h2>
          {!isPremiumOrAdmin && <span className="premium-pill">⭐ Premium</span>}
        </div>

        {isPremiumOrAdmin ? (
          <div className="comparison-grid">
            {loading.comparison ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="analytics-skeleton" style={{ height: 100, borderRadius: 14 }} />
              ))
            ) : comparison ? (
              <>
                {/* Income Comparison */}
                <div className="comparison-card glass-card">
                  <div className="comparison-card-header">
                    <span className="comparison-label">Income</span>
                    <ChangeIndicator pct={comparison.income_change_pct} />
                  </div>
                  <div className="comparison-values">
                    <div>
                      <p className="comp-period">{comparison.current_month_label}</p>
                      <p className="comp-amount income">{fmt(comparison.current_income)}</p>
                    </div>
                    <div className="comp-divider" />
                    <div>
                      <p className="comp-period">{comparison.previous_month_label}</p>
                      <p className="comp-amount muted">{fmt(comparison.previous_income)}</p>
                    </div>
                  </div>
                </div>

                {/* Expense Comparison */}
                <div className="comparison-card glass-card">
                  <div className="comparison-card-header">
                    <span className="comparison-label">Expenses</span>
                    <ChangeIndicator pct={comparison.expense_change_pct} />
                  </div>
                  <div className="comparison-values">
                    <div>
                      <p className="comp-period">{comparison.current_month_label}</p>
                      <p className="comp-amount expense">{fmt(comparison.current_expense)}</p>
                    </div>
                    <div className="comp-divider" />
                    <div>
                      <p className="comp-period">{comparison.previous_month_label}</p>
                      <p className="comp-amount muted">{fmt(comparison.previous_expense)}</p>
                    </div>
                  </div>
                </div>

                {/* Savings Comparison */}
                <div className="comparison-card glass-card">
                  <div className="comparison-card-header">
                    <span className="comparison-label">Net Savings</span>
                    <ChangeIndicator
                      pct={
                        comparison.previous_savings !== 0
                          ? Math.round(
                              ((comparison.current_savings - comparison.previous_savings) /
                                Math.abs(comparison.previous_savings)) *
                                100 *
                                10
                            ) / 10
                          : null
                      }
                    />
                  </div>
                  <div className="comparison-values">
                    <div>
                      <p className="comp-period">{comparison.current_month_label}</p>
                      <p
                        className="comp-amount"
                        style={{
                          color:
                            comparison.current_savings >= 0
                              ? "var(--success)"
                              : "var(--danger)",
                        }}
                      >
                        {fmt(comparison.current_savings)}
                      </p>
                    </div>
                    <div className="comp-divider" />
                    <div>
                      <p className="comp-period">{comparison.previous_month_label}</p>
                      <p className="comp-amount muted">{fmt(comparison.previous_savings)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="chart-empty" style={{ gridColumn: "1/-1" }}>
                <span>📊</span>
                <p>No comparison data available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="analytics-chart-card glass-card locked-card">
            <div className="lock-container" style={{ minHeight: 120 }}>
              <PremiumLock feature="Month-over-month comparison" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
