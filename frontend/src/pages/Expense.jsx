import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpenseList from "../components/expenses/ExpenseList";
import MonthSelector from "../components/MonthSelector";

import { getExpenses } from "../api/transactions";


export default function Expense() {

  // ==========================================================
  // SELECTED MONTH
  // ==========================================================

  const getCurrentMonth = () => {

    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

  };


  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());


  // ==========================================================
  // DATA
  // ==========================================================

  const [expenses, setExpenses] = useState([]);

  const [editingExpense, setEditingExpense] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);


  // ==========================================================
  // FETCH EXPENSES
  // ==========================================================

  const fetchExpenses = async () => {

    try {

      setLoading(true);

      const data = await getExpenses(
        selectedMonth
      );

      setExpenses(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch expenses error:",
        error
      );

      if (
        error.response?.status === 401
      ) {

        toast.error(
          "Session expired. Please login again."
        );

      } else {

        toast.error(
          error.response?.data?.detail ||
          "Failed to load expenses"
        );

      }

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // LOAD EXPENSES WHEN MONTH CHANGES
  // ==========================================================

  useEffect(() => {

    fetchExpenses();

  }, [selectedMonth]);


  // ==========================================================
  // ADD
  // ==========================================================

  const handleAdd = () => {

    setEditingExpense(null);

    setShowForm(true);

  };


  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (expense) => {

    setEditingExpense(expense);

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // ==========================================================
  // SUCCESS
  // ==========================================================

  const handleSuccess = async () => {

    setShowForm(false);

    setEditingExpense(null);

    await fetchExpenses();

  };


  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {

    setShowForm(false);

    setEditingExpense(null);

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-gray-100">

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:justify-between
          sm:items-center
          gap-4
          mb-8
        ">

          <div>

            <h1 className="text-3xl font-bold">
              Expenses
            </h1>

            <p className="text-gray-600 mt-2">
              Track and manage your expenses
            </p>

          </div>


          <button
            onClick={handleAdd}
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

        </div>


        {/* ==================================================
            FORM
        ================================================== */}

        {showForm && (

          <div className="mb-8">

            <ExpenseForm
              editingExpense={editingExpense}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />

          </div>

        )}


        {/* ==================================================
            MONTH SELECTOR
        ================================================== */}

        <div className="
          bg-white
          rounded-xl
          shadow
          p-5
          mb-6
        ">

          <MonthSelector
            value={selectedMonth}
            onChange={setSelectedMonth}
            label="Expense History"
          />

        </div>


        {/* ==================================================
            LIST
        ================================================== */}

        {loading ? (

          <div className="
            bg-white
            rounded-xl
            shadow
            p-10
            text-center
          ">
            Loading expenses...
          </div>

        ) : (

          <ExpenseList
            expenses={expenses}
            onEdit={handleEdit}
            onRefresh={fetchExpenses}
          />

        )}

      </main>

    </div>

  );

}