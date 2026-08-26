import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  DollarSign
} from "lucide-react";
import API, { notifyDataChanged } from "../services/api";
import "./Income.css";

const INCOME_SOURCES = [
  "Pocket Money",
  "Scholarship",
  "Freelance Income",
  "Part-time Job",
  "Internship Stipend",
  "Gift / Allowance",
  "Salary",
  "Other"
];

function Income() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Pocket Money");
  const [bankName, setBankName] = useState("");
  const [description, setDescription] = useState("");
  const [incomeDate, setIncomeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/income/");
      setIncomes(res.data || []);
    } catch (err) {
      console.error("Income fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load income data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      const payload = {
        amount: Number(amount),
        source: source.trim(),
        bank_name: bankName.trim() || null,
        description: description.trim() || null,
        income_date: incomeDate,
      };

      if (isEditing) {
        await API.put(`/income/${editId}`, payload);
        setSuccess("Income updated successfully!");
      } else {
        await API.post("/income/", payload);
        setSuccess("Income added successfully!");
      }

      // Reset
      setAmount("");
      setSource("Pocket Money");
      setBankName("");
      setDescription("");
      setIncomeDate(new Date().toISOString().split("T")[0]);
      setIsEditing(false);
      setEditId(null);

      await fetchIncomes();
      notifyDataChanged({ type: "income_added" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save income error:", err);
      setError(err.response?.data?.detail || "Failed to save income");
    }
  };

  const handleEdit = (inc) => {
    setIsEditing(true);
    setEditId(inc.income_id);
    setAmount(inc.amount);
    setSource(inc.source);
    setBankName(inc.bank_name || "");
    setDescription(inc.description || "");
    setIncomeDate(inc.income_date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setAmount("");
    setSource("Pocket Money");
    setBankName("");
    setDescription("");
    setIncomeDate(new Date().toISOString().split("T")[0]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income record?")) {
      return;
    }

    try {
      await API.delete(`/income/${id}`);
      setSuccess("Income deleted successfully!");
      await fetchIncomes();
      notifyDataChanged({ type: "income_deleted" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete income error:", err);
      setError("Failed to delete income");
    }
  };

  const filteredIncomes = incomes.filter(
    (inc) =>
      inc.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.description &&
        inc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inc.bank_name &&
        inc.bank_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalIncome = filteredIncomes.reduce(
    (sum, inc) => sum + Number(inc.amount),
    0
  );

  return (
    <div className="income-page-container animate-fade-in">
      {/* Page Header Banner */}
      <div className="page-header-banner income-theme glass-card">
        <div>
          <h1>Income Tracking 💵</h1>
          <p>Record your student allowances, scholarships, gifts, and earnings</p>
        </div>
        <div className="header-stat-box">
          <span className="stat-label">Total Filtered Income</span>
          <h2 className="stat-value income-color">
            ₹{totalIncome.toLocaleString("en-IN")}
          </h2>
        </div>
      </div>

      {success && (
        <div className="alert-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-error animate-fade-in">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="income-content-grid">
        {/* Form Card */}
        <div className="form-card glass-card">
          <div className="card-title">
            <TrendingUp size={20} color="#10b981" />
            <h3>{isEditing ? "Edit Income Record" : "Record New Income"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="custom-form">
            <div className="form-group">
              <label>
                <DollarSign size={14} /> Amount (₹ INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label>Income Source / Category</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <Building2 size={14} /> Bank / Wallet Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SBI, HDFC Bank, Paytm, Cash"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description / Note</label>
              <input
                type="text"
                placeholder="e.g. Monthly allowance from parents"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={14} /> Income Date
              </label>
              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                {isEditing ? "Update Income" : "+ Add Income"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* History Table Card */}
        <div className="list-card glass-card">
          <div className="list-header-bar">
            <h3>Income Records ({filteredIncomes.length})</h3>

            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search source or bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Loading income records...</p>
            </div>
          ) : filteredIncomes.length === 0 ? (
            <div className="table-empty">
              <span className="empty-emoji">💰</span>
              <h4>No income records found</h4>
              <p>Add your first income record to begin tracking.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Bank / Mode</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((inc) => (
                    <tr key={inc.income_id}>
                      <td>
                        <span className="badge badge-income">{inc.source}</span>
                      </td>
                      <td>{inc.bank_name || "-"}</td>
                      <td>
                        <strong className="desc-text">
                          {inc.description || "-"}
                        </strong>
                      </td>
                      <td className="date-text">{inc.income_date}</td>
                      <td>
                        <span className="table-amount-income">
                          + ₹{Number(inc.amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEdit(inc)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(inc.income_id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Income;