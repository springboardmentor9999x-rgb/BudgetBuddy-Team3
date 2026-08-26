import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Tag,
  DollarSign
} from "lucide-react";
import API, { notifyDataChanged } from "../services/api";
import "./Expenses.css";

const CATEGORY_ICONS = {
  Food: "🍔",
  Travel: "✈️",
  Shopping: "🛍️",
  Education: "📚",
  Entertainment: "🎬",
  "Bills & Utilities": "⚡",
  Healthcare: "💊",
  Miscellaneous: "📦",
};

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories/");
      setCategories(res.data || []);
      if (res.data && res.data.length > 0 && !categoryId) {
        setCategoryId(res.data[0].category_id);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/expenses/");
      setExpenses(res.data || []);
    } catch (err) {
      console.error("Expenses fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    try {
      const payload = {
        category_id: Number(categoryId),
        amount: Number(amount),
        description: description.trim(),
        expense_date: expenseDate,
      };

      if (isEditing) {
        await API.put(`/expenses/${editId}`, payload);
        setSuccess("Expense updated successfully!");
      } else {
        await API.post("/expenses/", payload);
        setSuccess("Expense added successfully!");
      }

      // Reset form
      setAmount("");
      setDescription("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setIsEditing(false);
      setEditId(null);

      // Refresh list & dispatch data changed event (NOTIFY NAVBAR + DASHBOARD)
      await fetchExpenses();
      notifyDataChanged({ type: "expense_added" });

      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save expense error:", err);
      setError(err.response?.data?.detail || "Failed to save expense");
    }
  };

  const handleEdit = (exp) => {
    setIsEditing(true);
    setEditId(exp.expense_id);
    setCategoryId(exp.category_id);
    setAmount(exp.amount);
    setDescription(exp.description || "");
    setExpenseDate(exp.expense_date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setAmount("");
    setDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) {
      return;
    }

    try {
      await API.delete(`/expenses/${id}`);
      setSuccess("Expense deleted successfully!");
      await fetchExpenses();
      notifyDataChanged({ type: "expense_deleted" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete expense error:", err);
      setError("Failed to delete expense");
    }
  };

  // Filtered List
  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory = selectedCategoryFilter
      ? exp.category_id === Number(selectedCategoryFilter)
      : true;
    const matchesSearch =
      (exp.description &&
        exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.category_name &&
        exp.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="expenses-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner glass-card">
        <div>
          <h1>Expense Management 💸</h1>
          <p>Track, categorize, and control your daily personal spending</p>
        </div>
        <div className="header-stat-box">
          <span className="stat-label">Total Filtered Spent</span>
          <h2 className="stat-value">₹{totalSpent.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      {/* Alert Notifications */}
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

      <div className="expenses-content-grid">
        {/* Left / Top: Add / Edit Form Card */}
        <div className="form-card glass-card">
          <div className="card-title">
            <Plus size={20} color="#6366f1" />
            <h3>{isEditing ? "Edit Expense" : "Record New Expense"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="custom-form">
            {/* Category Select */}
            <div className="form-group">
              <label>
                <Tag size={14} /> Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {CATEGORY_ICONS[cat.name] || "🏷️"} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label>
                <DollarSign size={14} /> Amount (₹ INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description / Note</label>
              <input
                type="text"
                placeholder="e.g. Lunch with friends, Books, Bus fare"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="form-group">
              <label>
                <Calendar size={14} /> Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                {isEditing ? "Update Expense" : "+ Add Expense"}
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

        {/* Right: History & Filter Card */}
        <div className="list-card glass-card">
          <div className="list-header-bar">
            <h3>Expense History ({filteredExpenses.length})</h3>

            {/* Filters */}
            <div className="filter-controls">
              <div className="search-input-wrapper">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="category-filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="table-empty">
              <span className="empty-emoji">🧾</span>
              <h4>No expenses found</h4>
              <p>Add a new expense using the form to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.expense_id}>
                      <td>
                        <span className="badge badge-category">
                          {CATEGORY_ICONS[exp.category_name] || "🏷️"}{" "}
                          {exp.category_name}
                        </span>
                      </td>
                      <td>
                        <strong className="desc-text">
                          {exp.description || "-"}
                        </strong>
                      </td>
                      <td className="date-text">{exp.expense_date}</td>
                      <td>
                        <span className="table-amount-expense">
                          - ₹{Number(exp.amount).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEdit(exp)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(exp.expense_id)}
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

export default Expenses;