import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] = useState({
    total_income: 0,
    total_expenses: 0,
    balance: 0,
    top_3_categories: [],
    recent_transactions: [],
  });

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [incomeForm, setIncomeForm] = useState({
    source: "",
    amount: "",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    description: "",
  });

  const [budgetForm, setBudgetForm] = useState({
    category: "",
    monthly_limit: "",
    month_year: "",
  });

  // --------------------------------------------------
  // FETCH DASHBOARD + ALL CRUD DATA
  // --------------------------------------------------

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        incomeResponse,
        expenseResponse,
        budgetResponse,
      ] = await Promise.all([
        api.get("/dashboard"),
        api.get("/incomes/"),
        api.get("/expenses/"),
        api.get("/budgets/"),
      ]);

      setDashboard({
        total_income: Number(
          dashboardResponse.data.total_income || 0
        ),
        total_expenses: Number(
          dashboardResponse.data.total_expenses || 0
        ),
        balance: Number(
          dashboardResponse.data.balance || 0
        ),
        top_3_categories:
          dashboardResponse.data.top_3_categories || [],
        recent_transactions:
          dashboardResponse.data.recent_transactions || [],
      });

      setIncomes(
        Array.isArray(incomeResponse.data)
          ? incomeResponse.data
          : []
      );

      setExpenses(
        Array.isArray(expenseResponse.data)
          ? expenseResponse.data
          : []
      );

      setBudgets(
        Array.isArray(budgetResponse.data)
          ? budgetResponse.data
          : []
      );
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        return;
      }

      toast.error(
        error.response?.data?.detail ||
          "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // ADD / UPDATE INCOME
  // --------------------------------------------------

  const saveIncome = async (e) => {
    e.preventDefault();

    if (Number(incomeForm.amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    try {
      if (editingItem) {
        await api.put(`/incomes/${editingItem.id}`, {
          source: incomeForm.source,
          amount: Number(incomeForm.amount),
          notes: incomeForm.notes,
        });

        toast.success("Income updated successfully.");
      } else {
        await api.post("/incomes/", {
          source: incomeForm.source,
          amount: Number(incomeForm.amount),
          notes: incomeForm.notes,
        });

        toast.success("Income added successfully.");
      }

      closeModal();
      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Income operation failed."
      );
    }
  };

  // --------------------------------------------------
  // ADD / UPDATE EXPENSE
  // --------------------------------------------------

  const saveExpense = async (e) => {
    e.preventDefault();

    if (Number(expenseForm.amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    try {
      if (editingItem) {
        await api.put(`/expenses/${editingItem.id}`, {
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          description: expenseForm.description,
        });

        toast.success("Expense updated successfully.");
      } else {
        await api.post("/expenses/", {
          category: expenseForm.category,
          amount: Number(expenseForm.amount),
          description: expenseForm.description,
        });

        toast.success("Expense added successfully.");
      }

      closeModal();
      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Expense operation failed."
      );
    }
  };

  // --------------------------------------------------
  // ADD / UPDATE BUDGET
  // --------------------------------------------------

  const saveBudget = async (e) => {
    e.preventDefault();

    if (Number(budgetForm.monthly_limit) <= 0) {
      toast.error(
        "Monthly limit must be greater than zero."
      );
      return;
    }

    if (!budgetForm.month_year) {
      toast.error("Please select a month.");
      return;
    }

    try {
      if (editingItem) {
        await api.put(`/budgets/${editingItem.id}`, {
          category: budgetForm.category,
          monthly_limit: Number(
            budgetForm.monthly_limit
          ),
          month_year: budgetForm.month_year,
        });

        toast.success("Budget updated successfully.");
      } else {
        await api.post("/budgets/", {
          category: budgetForm.category,
          monthly_limit: Number(
            budgetForm.monthly_limit
          ),
          month_year: budgetForm.month_year,
        });

        toast.success("Budget added successfully.");
      }

      closeModal();
      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Budget operation failed."
      );
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const deleteItem = async (type, id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/${type}/${id}`);

      toast.success(
        `${
          type === "incomes"
            ? "Income"
            : type === "expenses"
            ? "Expense"
            : "Budget"
        } deleted successfully.`
      );

      await fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.detail ||
          "Delete operation failed."
      );
    }
  };

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const editIncome = (item) => {
    setEditingItem(item);

    setIncomeForm({
      source: item.source || "",
      amount: item.amount ?? "",
      notes: item.notes || "",
    });

    setModal("income");
  };

  const editExpense = (item) => {
    setEditingItem(item);

    setExpenseForm({
      category: item.category || "",
      amount: item.amount ?? "",
      description: item.description || "",
    });

    setModal("expense");
  };

  const editBudget = (item) => {
    setEditingItem(item);

    setBudgetForm({
      category: item.category || "",
      monthly_limit: item.monthly_limit ?? "",
      month_year: item.month_year || "",
    });

    setModal("budget");
  };

  // --------------------------------------------------
  // OPEN ADD MODAL
  // --------------------------------------------------

  const openAddModal = (type) => {
    setEditingItem(null);

    if (type === "income") {
      setIncomeForm({
        source: "",
        amount: "",
        notes: "",
      });
    }

    if (type === "expense") {
      setExpenseForm({
        category: "",
        amount: "",
        description: "",
      });
    }

    if (type === "budget") {
      setBudgetForm({
        category: "",
        monthly_limit: "",
        month_year: "",
      });
    }

    setModal(type);
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const closeModal = () => {
    setModal(null);
    setEditingItem(null);
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg font-semibold text-gray-600">
          Loading dashboard...
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <nav className="bg-blue-700 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl sm:text-2xl font-bold">
          BudgetBuddy
        </h1>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm">
            {user?.email}
          </span>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h2>

          <p className="text-gray-600 mt-1">
            Welcome back, {user?.email}
          </p>
        </div>

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 font-medium">
              Total Income
            </h3>

            <p className="text-3xl font-bold text-green-600 mt-3">
              ₹{dashboard.total_income.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 font-medium">
              Total Expenses
            </h3>

            <p className="text-3xl font-bold text-red-600 mt-3">
              ₹{dashboard.total_expenses.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 font-medium">
              Balance
            </h3>

            <p
              className={`text-3xl font-bold mt-3 ${
                dashboard.balance >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              ₹{dashboard.balance.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-500 font-medium">
              Total Budget
            </h3>

            <p className="text-3xl font-bold text-purple-600 mt-3">
              ₹
              {budgets
                .reduce(
                  (sum, item) =>
                    sum +
                    Number(item.monthly_limit || 0),
                  0
                )
                .toFixed(2)}
            </p>
          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="mt-10">

          <h2 className="text-2xl font-semibold mb-4">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() => openAddModal("income")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
            >
              Add Income
            </button>

            <button
              onClick={() => openAddModal("expense")}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition"
            >
              Add Expense
            </button>

            <button
              onClick={() => openAddModal("budget")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
            >
              Set Budget
            </button>

          </div>
        </div>

        {/* TOP SPENDING CATEGORIES */}

        <div className="bg-white rounded-xl shadow mt-10 overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">
              Top Spending Categories
            </h2>

            <p className="text-gray-600 mt-1">
              Your highest expense categories this month
            </p>
          </div>

          <div className="p-6">

            {dashboard.top_3_categories.length === 0 ? (
              <p className="text-gray-500">
                No expense categories available.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {dashboard.top_3_categories.map(
                  (item, index) => (
                    <div
                      key={`${item.category}-${index}`}
                      className="border rounded-lg p-5"
                    >
                      <p className="text-gray-500">
                        {item.category}
                      </p>

                      <p className="text-xl font-bold text-red-600 mt-2">
                        ₹
                        {Number(item.total || 0).toFixed(
                          2
                        )}
                      </p>
                    </div>
                  )
                )}

              </div>
            )}

          </div>
        </div>

        {/* RECENT TRANSACTIONS */}

        <div className="bg-white rounded-xl shadow mt-10 overflow-hidden">

          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">
              Recent Transactions
            </h2>

            <p className="text-gray-600 mt-1">
              Your latest income and expenses
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px]">

              <thead className="bg-gray-50">

                <tr>
                  <th className="text-left p-4">
                    Date
                  </th>

                  <th className="text-left p-4">
                    Description
                  </th>

                  <th className="text-left p-4">
                    Type
                  </th>

                  <th className="text-left p-4">
                    Amount
                  </th>

                  <th className="text-left p-4">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {dashboard.recent_transactions.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center text-gray-500 p-8"
                    >
                      No transactions available
                    </td>
                  </tr>
                ) : (
                  dashboard.recent_transactions.map(
                    (item, index) => {

                      const isIncome =
                        item.type === "income";

                      return (
                        <tr
                          key={`${item.type}-${item.id}-${index}`}
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-4">
                            {formatDate(item.date)}
                          </td>

                          <td className="p-4">
                            {isIncome
                              ? item.source
                              : item.category}
                          </td>

                          <td className="p-4">

                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                isIncome
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isIncome
                                ? "Income"
                                : "Expense"}
                            </span>

                          </td>

                          <td
                            className={`p-4 font-semibold ${
                              isIncome
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"}₹
                            {Number(
                              item.amount || 0
                            ).toFixed(2)}
                          </td>

                          <td className="p-4">

                            <div className="flex gap-2">

                              {isIncome ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const income =
                                        incomes.find(
                                          (x) =>
                                            x.id ===
                                            item.id
                                        );

                                      if (income) {
                                        editIncome(
                                          income
                                        );
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteItem(
                                        "incomes",
                                        item.id
                                      )
                                    }
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      const expense =
                                        expenses.find(
                                          (x) =>
                                            x.id ===
                                            item.id
                                        );

                                      if (expense) {
                                        editExpense(
                                          expense
                                        );
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteItem(
                                        "expenses",
                                        item.id
                                      )
                                    }
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>
        </div>

        {/* BUDGETS */}

        <div className="bg-white rounded-xl shadow mt-10 overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-2xl font-bold">
              Budgets
            </h2>

            <p className="text-gray-600 mt-1">
              Manage your monthly budgets
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead className="bg-gray-50">

                <tr>
                  <th className="text-left p-4">
                    Category
                  </th>

                  <th className="text-left p-4">
                    Monthly Limit
                  </th>

                  <th className="text-left p-4">
                    Month
                  </th>

                  <th className="text-left p-4">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {budgets.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center text-gray-500 p-8"
                    >
                      No budgets available
                    </td>
                  </tr>
                ) : (
                  budgets.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-4">
                        {item.category}
                      </td>

                      <td className="p-4 font-semibold text-purple-600">
                        ₹
                        {Number(
                          item.monthly_limit || 0
                        ).toFixed(2)}
                      </td>

                      <td className="p-4">
                        {item.month_year}
                      </td>

                      <td className="p-4">

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              editBudget(item)
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteItem(
                                "budgets",
                                item.id
                              )
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>
        </div>

      </main>

      {/* ==================================================
          INCOME MODAL
      ================================================== */}

      {modal === "income" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-2xl font-bold mb-5">
              {editingItem
                ? "Edit Income"
                : "Add Income"}
            </h2>

            <form
              onSubmit={saveIncome}
              className="space-y-4"
            >

              <input
                type="text"
                placeholder="Source"
                value={incomeForm.source}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    source: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={incomeForm.amount}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    amount: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="text"
                placeholder="Notes"
                value={incomeForm.notes}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    notes: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-4 py-3"
              />

              <div className="flex gap-3">

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
                >
                  {editingItem ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================================================
          EXPENSE MODAL
      ================================================== */}

      {modal === "expense" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-2xl font-bold mb-5">
              {editingItem
                ? "Edit Expense"
                : "Add Expense"}
            </h2>

            <form
              onSubmit={saveExpense}
              className="space-y-4"
            >

              <input
                type="text"
                placeholder="Category"
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    category: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    amount: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="text"
                placeholder="Description"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
                className="w-full border rounded-lg px-4 py-3"
              />

              <div className="flex gap-3">

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
                >
                  {editingItem ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================================================
          BUDGET MODAL
      ================================================== */}

      {modal === "budget" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-2xl font-bold mb-5">
              {editingItem
                ? "Edit Budget"
                : "Set Budget"}
            </h2>

            <form
              onSubmit={saveBudget}
              className="space-y-4"
            >

              <input
                type="text"
                placeholder="Category"
                value={budgetForm.category}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    category: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Monthly Limit"
                value={budgetForm.monthly_limit}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    monthly_limit: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="month"
                value={budgetForm.month_year}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    month_year: e.target.value,
                  })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <div className="flex gap-3">

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  {editingItem ? "Update" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}