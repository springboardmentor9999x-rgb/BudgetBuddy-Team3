import React, { useEffect, useState } from "react";
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Filter
} from "lucide-react";
import API from "../services/api";
import "./Reports.css";

function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/reports/summary?month=${month}`);
      setReportData(res.data);
    } catch (err) {
      console.error("Report fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load financial report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  const handleExportCSV = async () => {
    try {
      const response = await API.get(`/reports/export/csv?month=${month}`, {
        responseType: "blob",
      });

      // Backend now returns a proper .xlsx file
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BudgetBuddy_Report_${month || "All_Time"}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Excel error:", err);
      alert("Failed to download Excel export. Please try again.");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const summary = reportData?.summary || {
    total_income: 0,
    total_expenses: 0,
    net_savings: 0,
    savings_rate: 0,
    budget_amount: 0,
    budget_utilization: 0,
  };

  const categories = reportData?.category_summary || [];
  const expenses = reportData?.expenses || [];
  const incomes = reportData?.incomes || [];
  const accounts = reportData?.accounts || [];

  // Combine Income and Expense records into chronological transaction history (newest first)
  const transactions =
    reportData?.transactions && Array.isArray(reportData.transactions)
      ? reportData.transactions
      : [
          ...expenses.map((e) => ({
            id: `exp-${e.expense_id}`,
            date: String(e.expense_date),
            type: "Expense",
            categoryOrSource: e.category_name || "General",
            bankOrAccount: "-",
            description: e.description ? String(e.description).trim() || "-" : "-",
            amount: Number(e.amount || 0),
          })),
          ...incomes.map((i) => ({
            id: `inc-${i.income_id}`,
            date: String(i.income_date),
            type: "Income",
            categoryOrSource: i.source ? String(i.source).trim() || "Income" : "Income",
            bankOrAccount: i.bank_name ? String(i.bank_name).trim() || "-" : "-",
            description: i.description ? String(i.description).trim() || "-" : "-",
            amount: Number(i.amount || 0),
          })),
        ].sort((a, b) => {
          const diff = String(b.date).localeCompare(String(a.date));
          if (diff !== 0) return diff;
          return a.type.localeCompare(b.type);
        });

  return (
    <div className="reports-page-container animate-fade-in">
      {/* Printable Report Header */}
      <div className="report-screen-header glass-card no-print">
        <div className="header-info">
          <h1>Financial Reports &amp; Export 📈</h1>
          <p>
            Generate comprehensive financial statements for audits, personal records, and budget analysis
          </p>
        </div>

        <div className="report-action-controls">
          <div className="month-select-wrapper">
            <Calendar size={14} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="report-month-input"
            />
          </div>

          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={15} /> Export CSV / Excel
          </button>

          <button onClick={handlePrintPDF} className="btn-primary">
            <Printer size={15} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {loading && !reportData ? (
        <div className="table-loading">
          <div className="spinner"></div>
          <p>Generating financial report...</p>
        </div>
      ) : error ? (
        <div className="alert-error">
          <span>{error}</span>
        </div>
      ) : (
        /* Printable Document Container */
        <div className="printable-report-sheet glass-card">
          {/* Official Document Banner */}
          <div className="doc-banner">
            <div className="doc-brand">
              <h2>💰 BudgetBuddy</h2>
              <span className="doc-tagline">
                Personal Budget Planning &amp; Expense Management Platform
              </span>
            </div>
            <div className="doc-meta">
              <div className="doc-meta-item">
                <span>Statement Period:</span>
                <strong>
                  {month
                    ? new Date(`${month}-01`).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })
                    : "All Time"}
                </strong>
              </div>
              <div className="doc-meta-item">
                <span>Account Holder:</span>
                <strong>{reportData?.user?.name || "Student User"}</strong>
              </div>
              <div className="doc-meta-item">
                <span>Generated Date:</span>
                <strong>{new Date().toLocaleDateString("en-IN")}</strong>
              </div>
            </div>
          </div>

          <div className="doc-divider" />

          {/* Section 1: Financial Executive Summary */}
          <div className="doc-section">
            <h3 className="section-title">1. Executive Summary</h3>
            <div className="doc-summary-grid">
              <div className="summary-stat-box">
                <span className="stat-name">Total Income</span>
                <h4 className="stat-digit income-color">
                  ₹{summary.total_income.toLocaleString("en-IN")}
                </h4>
              </div>
              <div className="summary-stat-box">
                <span className="stat-name">Total Expenses</span>
                <h4 className="stat-digit expense-color">
                  ₹{summary.total_expenses.toLocaleString("en-IN")}
                </h4>
              </div>
              <div className="summary-stat-box">
                <span className="stat-name">Net Savings</span>
                <h4
                  className={`stat-digit ${
                    summary.net_savings >= 0 ? "savings-color" : "expense-color"
                  }`}
                >
                  ₹{summary.net_savings.toLocaleString("en-IN")}
                </h4>
              </div>
              <div className="summary-stat-box">
                <span className="stat-name">Savings Rate</span>
                <h4 className="stat-digit">{summary.savings_rate}%</h4>
              </div>
            </div>
          </div>

          {/* Section 2: Category Breakdown */}
          <div className="doc-section">
            <h3 className="section-title">2. Category-wise Spending Breakdown</h3>
            {categories.length === 0 ? (
              <p className="doc-empty-text">No category expenses recorded for this period.</p>
            ) : (
              <div className="category-bars-list">
                {categories.map((c) => (
                  <div key={c.category_name} className="cat-report-row">
                    <div className="cat-row-info">
                      <span className="cat-name">{c.category_name}</span>
                      <strong className="cat-amount">
                        ₹{c.amount.toLocaleString("en-IN")} ({c.percentage}%)
                      </strong>
                    </div>
                    <div className="cat-bar-track">
                      <div
                        className="cat-bar-fill"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Expense Log */}
          <div className="doc-section">
            <h3 className="section-title">3. Detailed Expense Itemization</h3>
            {expenses.length === 0 ? (
              <p className="doc-empty-text">No individual expense transactions recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table doc-table doc-table-expense">
                  <colgroup>
                    <col className="col-date" />
                    <col className="col-cat" />
                    <col className="col-desc" />
                    <col className="col-amount" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.expense_id}>
                        <td className="col-date">{e.expense_date}</td>
                        <td>
                          <span className="badge badge-category">
                            {e.category_name}
                          </span>
                        </td>
                        <td>{e.description || "-"}</td>
                        <td className="col-amount">
                          <span className="table-amount-expense">
                            ₹{Number(e.amount).toLocaleString("en-IN")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Income Log */}
          <div className="doc-section">
            <h3 className="section-title">4. Income Sources Log</h3>
            {incomes.length === 0 ? (
              <p className="doc-empty-text">No income records registered for this period.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table doc-table doc-table-income">
                  <colgroup>
                    <col className="col-date" />
                    <col className="col-source" />
                    <col className="col-bank" />
                    <col className="col-desc" />
                    <col className="col-amount" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Source</th>
                      <th>Bank / Account</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map((i) => (
                      <tr key={i.income_id}>
                        <td className="col-date">{i.income_date}</td>
                        <td>
                          <span className="badge badge-income">{i.source}</span>
                        </td>
                        <td>{i.bank_name || "-"}</td>
                        <td>{i.description || "-"}</td>
                        <td className="col-amount">
                          <span className="table-amount-income">
                            + ₹{Number(i.amount).toLocaleString("en-IN")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Complete Transaction History — starts on a fresh page in print */}
          <div className="doc-section doc-section-history">
            <h3 className="section-title">5. Complete Transaction History</h3>
            {transactions.length === 0 ? (
              <p className="doc-empty-text">No transactions available for this statement period.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table doc-table doc-table-history">
                  <colgroup>
                    <col className="col-date" />
                    <col className="col-type" />
                    <col className="col-cat" />
                    <col className="col-bank" />
                    <col className="col-desc" />
                    <col className="col-amount" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Type</th>
                      <th>Category / Source</th>
                      <th>Bank / Account</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="col-date">{t.date}</td>
                        <td>
                          <span
                            className={`badge ${
                              t.type === "Income" ? "badge-income" : "badge-expense"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              t.type === "Income" ? "badge-income" : "badge-category"
                            }`}
                          >
                            {t.categoryOrSource}
                          </span>
                        </td>
                        <td>{t.bankOrAccount}</td>
                        <td>{t.description}</td>
                        <td className="col-amount">
                          <span
                            className={
                              t.type === "Income"
                                ? "table-amount-income"
                                : "table-amount-expense"
                            }
                          >
                            {t.type === "Income" ? "+ " : "- "}₹
                            {Number(t.amount || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Document Footer */}
          <div className="doc-footer">
            <p>
              BudgetBuddy Platform • Automated Student Financial Planning Report • End of Statement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;