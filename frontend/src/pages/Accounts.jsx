import React, { useEffect, useState } from "react";
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  DollarSign
} from "lucide-react";
import API, { notifyDataChanged } from "../services/api";
import "./Accounts.css";

const ACCOUNT_TYPES = [
  { label: "Bank Account", icon: Landmark, emoji: "🏦" },
  { label: "Cash", icon: Banknote, emoji: "💵" },
  { label: "Credit Card", icon: CreditCard, emoji: "💳" },
  { label: "Digital Wallet", icon: Smartphone, emoji: "📱" },
];

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("Bank Account");
  const [balance, setBalance] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/accounts/");
      setAccounts(res.data || []);
    } catch (err) {
      console.error("Accounts fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!accountName.trim()) {
      setError("Please enter an account name");
      return;
    }

    if (balance === "" || isNaN(Number(balance))) {
      setError("Please enter a valid balance");
      return;
    }

    try {
      const payload = {
        account_name: accountName.trim(),
        account_type: accountType,
        balance: Number(balance),
        account_number: accountNumber.trim() || null,
      };

      if (isEditing) {
        await API.put(`/accounts/${editId}`, payload);
        setSuccess("Account updated successfully!");
      } else {
        await API.post("/accounts/", payload);
        setSuccess("Account added successfully!");
      }

      setAccountName("");
      setAccountType("Bank Account");
      setBalance("");
      setAccountNumber("");
      setIsEditing(false);
      setEditId(null);

      await fetchAccounts();
      notifyDataChanged({ type: "account_updated" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save account error:", err);
      setError(err.response?.data?.detail || "Failed to save account");
    }
  };

  const handleEdit = (acc) => {
    setIsEditing(true);
    setEditId(acc.account_id);
    setAccountName(acc.account_name);
    setAccountType(acc.account_type);
    setBalance(acc.balance);
    setAccountNumber(acc.account_number || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setAccountName("");
    setAccountType("Bank Account");
    setBalance("");
    setAccountNumber("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      await API.delete(`/accounts/${id}`);
      setSuccess("Account deleted successfully!");
      await fetchAccounts();
      notifyDataChanged({ type: "account_deleted" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete account error:", err);
      setError("Failed to delete account");
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const bankBalance = accounts
    .filter((a) => a.account_type === "Bank Account")
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const cashBalance = accounts
    .filter((a) => a.account_type === "Cash")
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  return (
    <div className="accounts-page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header-banner accounts-theme glass-card">
        <div>
          <h1>Accounts Management 🏦</h1>
          <p>Organize your bank balances, physical cash, cards, and digital wallets</p>
        </div>
        <div className="header-stat-box">
          <span className="stat-label">Net Account Balance</span>
          <h2 className="stat-value balance-color">
            ₹{totalBalance.toLocaleString("en-IN")}
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

      {/* KPI Cards */}
      <div className="accounts-kpi-grid">
        <div className="kpi-card glass-card">
          <span className="kpi-label">Total Balance</span>
          <h3 className="kpi-val balance-color">
            ₹{totalBalance.toLocaleString("en-IN")}
          </h3>
        </div>
        <div className="kpi-card glass-card">
          <span className="kpi-label">Bank Accounts</span>
          <h3 className="kpi-val">₹{bankBalance.toLocaleString("en-IN")}</h3>
        </div>
        <div className="kpi-card glass-card">
          <span className="kpi-label">Physical Cash</span>
          <h3 className="kpi-val income-color">
            ₹{cashBalance.toLocaleString("en-IN")}
          </h3>
        </div>
        <div className="kpi-card glass-card">
          <span className="kpi-label">Total Accounts</span>
          <h3 className="kpi-val">{accounts.length}</h3>
        </div>
      </div>

      <div className="accounts-content-grid">
        {/* Add / Edit Form */}
        <div className="form-card glass-card">
          <div className="card-title">
            <Landmark size={20} color="#3b82f6" />
            <h3>{isEditing ? "Edit Account" : "Add New Account"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="custom-form">
            <div className="form-group">
              <label>Account Name</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India, Pocket Cash"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                required
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <DollarSign size={14} /> Current Balance (₹ INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label>Account / Card Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. XXXX XXXX 4589"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                }}
              >
                {isEditing ? "Update Account" : "+ Add Account"}
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

        {/* Accounts Cards List */}
        <div className="accounts-list-card glass-card">
          <div className="list-header-bar">
            <h3>Registered Accounts ({accounts.length})</h3>
          </div>

          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="table-empty">
              <span className="empty-emoji">🏦</span>
              <h4>No accounts added yet</h4>
              <p>Add your bank accounts, wallets, or cash stash to monitor total assets.</p>
            </div>
          ) : (
            <div className="accounts-grid-display">
              {accounts.map((acc) => {
                const typeObj =
                  ACCOUNT_TYPES.find((t) => t.label === acc.account_type) ||
                  ACCOUNT_TYPES[0];
                return (
                  <div key={acc.account_id} className="account-item-box">
                    <div className="account-box-top">
                      <span className="acc-type-icon">{typeObj.emoji}</span>
                      <div className="acc-meta">
                        <h4>{acc.account_name}</h4>
                        <span className="badge badge-category">
                          {acc.account_type}
                        </span>
                        {acc.account_number && (
                          <small className="acc-masked-num">
                            **** {acc.account_number.slice(-4)}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="account-box-bottom">
                      <div className="acc-balance-group">
                        <span className="acc-balance-label">Balance</span>
                        <strong className="acc-balance-num">
                          ₹{Number(acc.balance).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <div className="action-buttons">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleEdit(acc)}
                          title="Edit Account"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(acc.account_id)}
                          title="Delete Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Accounts;