import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ==================================================
  // DATA
  // ==================================================

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);

  const [loading, setLoading] = useState(true);

  // ==================================================
  // FETCH DASHBOARD DATA
  // ==================================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/incomes/"),
        api.get("/expenses/"),
        api.get("/budgets/"),
        api.get("/bank-accounts/"),
        api.get("/goals/"),
      ]);

      // ==================================================
      // INCOME
      // ==================================================

      if (results[0].status === "fulfilled") {
        setIncomes(
          Array.isArray(results[0].value.data)
            ? results[0].value.data
            : []
        );
      } else {
        console.error(
          "Income fetch error:",
          results[0].reason
        );
        setIncomes([]);
      }

      // ==================================================
      // EXPENSE
      // ==================================================

      if (results[1].status === "fulfilled") {
        setExpenses(
          Array.isArray(results[1].value.data)
            ? results[1].value.data
            : []
        );
      } else {
        console.error(
          "Expense fetch error:",
          results[1].reason
        );
        setExpenses([]);
      }

      // ==================================================
      // BUDGET
      // ==================================================

      if (results[2].status === "fulfilled") {
        setBudgets(
          Array.isArray(results[2].value.data)
            ? results[2].value.data
            : []
        );
      } else {
        console.error(
          "Budget fetch error:",
          results[2].reason
        );
        setBudgets([]);
      }

      // ==================================================
      // BANK ACCOUNTS
      // ==================================================

      if (results[3].status === "fulfilled") {
        setBankAccounts(
          Array.isArray(results[3].value.data)
            ? results[3].value.data
            : []
        );
      } else {
        console.error(
          "Bank account fetch error:",
          results[3].reason
        );
        setBankAccounts([]);
      }

      // ==================================================
      // SAVINGS GOALS
      // ==================================================

      if (results[4].status === "fulfilled") {
        setSavingsGoals(
          Array.isArray(results[4].value.data)
            ? results[4].value.data
            : []
        );
      } else {
        console.error(
          "Savings goals fetch error:",
          results[4].reason
        );
        setSavingsGoals([]);
      }

      // ==================================================
      // CHECK AUTH ERROR
      // ==================================================

      const unauthorized = results.some(
        (result) =>
          result.status === "rejected" &&
          result.reason?.response?.status === 401
      );

      if (unauthorized) {
        toast.error(
          "Session expired. Please login again."
        );

        logout();
        return;
      }

      // ==================================================
      // CHECK OTHER API ERRORS
      // ==================================================

      const failedRequests = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedRequests.length > 0) {
        console.warn(
          `${failedRequests.length} dashboard API request(s) failed.`
        );
      }

    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      toast.error(
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // REFRESH DASHBOARD
  // ==================================================

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      fetchData();
    }
  }, [location.pathname]);

  // ==================================================
  // CALCULATIONS
  // ==================================================

  const totalIncome = incomes.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const totalBudget = budgets.reduce(
    (sum, item) =>
      sum + Number(item.monthly_limit || 0),
    0
  );

  const totalBankBalance = bankAccounts.reduce(
    (sum, account) =>
      sum + Number(account.balance || 0),
    0
  );

  const totalSavingsGoals = savingsGoals.reduce(
    (sum, goal) =>
      sum + Number(goal.target_amount || 0),
    0
  );

  const totalSavedAmount = savingsGoals.reduce(
    (sum, goal) =>
      sum + Number(goal.current_amount || 0),
    0
  );

  // ==================================================
  // IMPORTANT
  //
  // Actual available balance comes from bank accounts.
  //
  // Expenses and savings contributions are already
  // reflected in the bank account balance by the backend.
  //
  // Creating a budget does NOT deduct money.
  // ==================================================

  const balance = totalBankBalance;

  // ==================================================
  // RECENT TRANSACTIONS
  // ==================================================

  const transactions = [
    ...incomes.map((item) => ({
      id: "income-" + item.id,
      date: item.date,
      name: item.source,
      type: "Income",
      amount: Number(item.amount || 0),
    })),

    ...expenses.map((item) => ({
      id: "expense-" + item.id,
      date: item.date,
      name: item.category,
      type: "Expense",
      amount: Number(item.amount || 0),
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    )
    .slice(0, 5);

  // ==================================================
  // DATE FORMAT
  // ==================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==================================================
  // NAVIGATION
  // ==================================================

  const goTo = (path) => {
    navigate(path);
  };

  // ==================================================
  // SAVINGS GOAL PROGRESS
  // ==================================================

  const calculateProgress = (goal) => {
    const target = Number(
      goal.target_amount || 0
    );

    const current = Number(
      goal.current_amount || 0
    );

    if (target <= 0) {
      return 0;
    }

    return Math.min(
      (current / target) * 100,
      100
    );
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="p-8">

      {/* PAGE TITLE */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="text-gray-600 mt-2">
          Welcome back, {user?.full_name || "User"}
        </p>

      </div>

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-5
          gap-5
        "
      >

        {/* INCOME */}

        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-gray-500">
            Total Income
          </h3>

          <p className="text-3xl font-bold text-green-600 mt-3">
            ₹{totalIncome.toFixed(2)}
          </p>

        </div>

        {/* EXPENSE */}

        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-gray-500">
            Total Expenses
          </h3>

          <p className="text-3xl font-bold text-red-600 mt-3">
            ₹{totalExpenses.toFixed(2)}
          </p>

        </div>

        {/* BALANCE */}

        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-gray-500">
            Balance
          </h3>

          <p
            className={
              "text-3xl font-bold mt-3 " +
              (
                balance >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              )
            }
          >
            ₹{balance.toFixed(2)}
          </p>

        </div>

        {/* BUDGET */}

        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-gray-500">
            Total Budget
          </h3>

          <p className="text-3xl font-bold text-purple-600 mt-3">
            ₹{totalBudget.toFixed(2)}
          </p>

        </div>

        {/* SAVINGS */}

        <div className="bg-white rounded-xl shadow p-6">

          <h3 className="text-gray-500">
            Savings Goals
          </h3>

          <p className="text-3xl font-bold text-yellow-600 mt-3">
            ₹{totalSavingsGoals.toFixed(2)}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Saved: ₹{totalSavedAmount.toFixed(2)}
          </p>

        </div>

      </div>

      {/* ==================================================
          BANK ACCOUNT BALANCE
      ================================================== */}

      <div className="bg-white rounded-xl shadow p-6 mt-8">

        <div className="flex justify-between items-center">

          <div>

            <h2 className="text-2xl font-bold">
              Bank Account Balance
            </h2>

            <p className="text-gray-600 mt-1">
              Total balance across your bank accounts
            </p>

          </div>

          <p className="text-3xl font-bold text-green-600">
            ₹{totalBankBalance.toFixed(2)}
          </p>

        </div>

      </div>

      {/* ==================================================
          QUICK ACTIONS
      ================================================== */}

      <div className="mt-10">

        <h2 className="text-2xl font-semibold mb-4">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">

          <button
            onClick={() => goTo("/income")}
            className="
              bg-green-600
              hover:bg-green-700
              text-white
              px-6
              py-3
              rounded-lg
            "
          >
            + Add Income
          </button>

          <button
            onClick={() => goTo("/expense")}
            className="
              bg-red-600
              hover:bg-red-700
              text-white
              px-6
              py-3
              rounded-lg
            "
          >
            + Add Expense
          </button>

          <button
            onClick={() => goTo("/budget")}
            className="
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-6
              py-3
              rounded-lg
            "
          >
            + Set Budget
          </button>

          <button
            onClick={() => goTo("/savings-goals")}
            className="
              bg-yellow-500
              hover:bg-yellow-600
              text-white
              px-6
              py-3
              rounded-lg
            "
          >
            + Savings Goal
          </button>

        </div>

      </div>

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (
        <div className="text-center py-10 text-gray-500">
          Loading dashboard...
        </div>
      )}

      {/* ==================================================
          RECENT TRANSACTIONS
      ================================================== */}

      {!loading && (
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

            <table className="w-full">

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

                </tr>

              </thead>

              <tbody>

                {transactions.length === 0 ? (

                  <tr>

                    <td
                      colSpan="4"
                      className="text-center text-gray-500 p-8"
                    >
                      No transactions available
                    </td>

                  </tr>

                ) : (

                  transactions.map(
                    (transaction) => (

                      <tr
                        key={transaction.id}
                        className="border-t"
                      >

                        <td className="p-4">
                          {formatDate(
                            transaction.date
                          )}
                        </td>

                        <td className="p-4">
                          {transaction.name}
                        </td>

                        <td className="p-4">

                          <span
                            className={
                              "px-3 py-1 rounded-full text-sm " +
                              (
                                transaction.type === "Income"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              )
                            }
                          >
                            {transaction.type}
                          </span>

                        </td>

                        <td
                          className={
                            "p-4 font-semibold " +
                            (
                              transaction.type === "Income"
                                ? "text-green-600"
                                : "text-red-600"
                            )
                          }
                        >
                          {transaction.type === "Income"
                            ? "+"
                            : "-"}
                          ₹
                          {transaction.amount.toFixed(2)}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ==================================================
          BUDGET SUMMARY
      ================================================== */}

      {!loading && (
        <div className="bg-white rounded-xl shadow mt-10 overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-2xl font-bold">
              Budgets
            </h2>

            <p className="text-gray-600 mt-1">
              Your current monthly budgets
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

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

                </tr>

              </thead>

              <tbody>

                {budgets.length === 0 ? (

                  <tr>

                    <td
                      colSpan="3"
                      className="text-center text-gray-500 p-8"
                    >
                      No budgets available
                    </td>

                  </tr>

                ) : (

                  budgets.map(
                    (budget) => (

                      <tr
                        key={budget.id}
                        className="border-t"
                      >

                        <td className="p-4">
                          {budget.category}
                        </td>

                        <td className="p-4 font-semibold text-purple-600">
                          ₹
                          {Number(
                            budget.monthly_limit || 0
                          ).toFixed(2)}
                        </td>

                        <td className="p-4">
                          {budget.month_year}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ==================================================
          SAVINGS GOALS
      ================================================== */}

      {!loading && (
        <div className="bg-white rounded-xl shadow mt-10 overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-2xl font-bold">
              Savings Goals
            </h2>

            <p className="text-gray-600 mt-1">
              Track your progress toward each savings target
            </p>

          </div>

          <div className="p-6">

            {savingsGoals.length === 0 ? (

              <div className="text-center text-gray-500 py-8">
                No savings goals available
              </div>

            ) : (

              <div className="grid gap-6">

                {savingsGoals.map(
                  (goal) => {

                    const targetAmount =
                      Number(
                        goal.target_amount || 0
                      );

                    const savedAmount =
                      Number(
                        goal.current_amount || 0
                      );

                    const remainingAmount =
                      Math.max(
                        targetAmount -
                        savedAmount,
                        0
                      );

                    const progress =
                      calculateProgress(goal);

                    return (
                      <div
                        key={goal.id}
                        className="
                          border
                          rounded-xl
                          p-5
                          hover:shadow-md
                          transition
                        "
                      >

                        <div className="flex justify-between items-start mb-4">

                          <div>

                            <h3 className="text-xl font-bold text-gray-800">
                              {goal.title || "-"}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                              Target: ₹
                              {targetAmount.toFixed(2)}
                            </p>

                          </div>

                          <span
                            className={
                              "px-3 py-1 rounded-full text-sm " +
                              (
                                goal.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              )
                            }
                          >
                            {goal.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </span>

                        </div>

                        <div className="flex justify-between mb-2">

                          <span className="font-semibold text-green-600">
                            Saved: ₹
                            {savedAmount.toFixed(2)}
                          </span>

                          <span className="text-gray-600">
                            Remaining: ₹
                            {remainingAmount.toFixed(2)}
                          </span>

                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                          <div
                            className={
                              "h-4 rounded-full transition-all duration-500 " +
                              (
                                progress >= 100
                                  ? "bg-green-500"
                                  : "bg-blue-600"
                              )
                            }
                            style={{
                              width: `${progress}%`,
                            }}
                          />

                        </div>

                        <div className="flex justify-between items-center mt-2">

                          <span className="text-sm text-gray-600">
                            {progress.toFixed(1)}% completed
                          </span>

                          {progress >= 100 && (
                            <span className="text-sm font-semibold text-green-600">
                              Goal completed 🎉
                            </span>
                          )}

                        </div>

                        {goal.target_date && (
                          <p className="text-sm text-gray-500 mt-3">
                            Target date:{" "}
                            {formatDate(
                              goal.target_date
                            )}
                          </p>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>
      )}

    </main>
  );
}