import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";

import BudgetForm from "../components/budget/BudgetForm";
import BudgetList from "../components/budget/BudgetList";


export default function Budget() {

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [editingBudget, setEditingBudget] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  // ======================================================
  // GET CURRENT MONTH
  // ======================================================

  const getCurrentMonth = () => {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
  };


  // ======================================================
  // FETCH BUDGETS
  // ======================================================

  const fetchBudgets = async () => {

    try {

      const response = await api.get("/budgets/");

      setBudgets(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch budgets error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load budgets"
      );

    }

  };


  // ======================================================
  // FETCH EXPENSES
  // ======================================================

  const fetchExpenses = async () => {

    try {

      const response = await api.get(
        "/expenses/?skip=0&limit=100"
      );

      setExpenses(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch expenses error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load expenses"
      );

    }

  };


  // ======================================================
  // FETCH EVERYTHING
  // ======================================================

  const fetchData = async () => {

    await Promise.all([
      fetchBudgets(),
      fetchExpenses(),
    ]);

  };


  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {

    fetchData();

  }, []);


  // ======================================================
  // CALCULATE BUDGET DATA
  // ======================================================

  const calculateBudgetData = () => {

    const currentMonth = getCurrentMonth();

    return budgets.map((budget) => {

      const monthlyLimit = Number(
        budget.monthly_limit || 0
      );


      const budgetMonth =
        budget.month_year ||
        currentMonth;


      const spent = expenses
        .filter((expense) => {

          if (
            expense.category !==
            budget.category
          ) {
            return false;
          }


          if (!expense.date) {
            return false;
          }


          const expenseDate =
            new Date(expense.date);


          if (
            Number.isNaN(
              expenseDate.getTime()
            )
          ) {
            return false;
          }


          const year =
            expenseDate.getFullYear();


          const month =
            String(
              expenseDate.getMonth() + 1
            ).padStart(2, "0");


          const expenseMonth =
            `${year}-${month}`;


          return (
            expenseMonth ===
            budgetMonth
          );

        })
        .reduce(
          (total, expense) =>
            total +
            Number(
              expense.amount || 0
            ),
          0
        );


      const percentage =
        monthlyLimit > 0
          ? (spent / monthlyLimit) * 100
          : 0;


      const remaining =
        Math.max(
          monthlyLimit - spent,
          0
        );


      const overAmount =
        Math.max(
          spent - monthlyLimit,
          0
        );


      return {
        ...budget,
        spent,
        percentage,
        remaining,
        overAmount,
        isOverBudget:
          spent > monthlyLimit,
      };

    });

  };


  const budgetData =
    calculateBudgetData();


  // ======================================================
  // SUMMARY
  // ======================================================

  const currentMonth =
    getCurrentMonth();


  const currentMonthBudgets =
    budgetData.filter(
      (budget) =>
        budget.month_year ===
        currentMonth
    );


  const totalPlanned =
    currentMonthBudgets.reduce(
      (total, budget) =>
        total +
        Number(
          budget.monthly_limit || 0
        ),
      0
    );


  const totalSpent =
    currentMonthBudgets.reduce(
      (total, budget) =>
        total +
        Number(
          budget.spent || 0
        ),
      0
    );


  const totalRemaining =
    Math.max(
      totalPlanned - totalSpent,
      0
    );


  const exceededBudgets =
    currentMonthBudgets.filter(
      (budget) =>
        budget.isOverBudget
    );


  // ======================================================
  // CREATE / UPDATE
  // ======================================================

  const handleSubmit = async (data) => {

    setLoading(true);

    try {

      if (editingBudget) {

        await api.put(
          `/budgets/${editingBudget.id}`,
          data
        );

        toast.success(
          "Budget updated successfully"
        );

      } else {

        await api.post(
          "/budgets/",
          data
        );

        toast.success(
          "Budget added successfully"
        );

      }


      setEditingBudget(null);
      setShowForm(false);

      await fetchData();

    } catch (error) {

      console.error(
        "Budget operation error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Budget operation failed"
      );

    } finally {

      setLoading(false);

    }

  };


  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit = (budget) => {

    if (!budget?.id) {
      toast.error(
        "Unable to edit budget: missing budget ID."
      );
      return;
    }

    setEditingBudget(budget);
    setShowForm(true);

  };


  // ======================================================
  // OPEN DELETE MODAL
  // ======================================================

  const handleDelete = (budget) => {

    if (!budget?.id) {

      toast.error(
        "Unable to delete budget: missing budget ID."
      );

      return;
    }


    setBudgetToDelete(budget);

  };


  // ======================================================
  // CONFIRM DELETE
  // ======================================================

  const confirmDelete = async () => {

    if (!budgetToDelete?.id) {

      toast.error(
        "Unable to delete budget: missing budget ID."
      );

      return;
    }


    setDeleting(true);


    try {

      console.log(
        "Deleting budget ID:",
        budgetToDelete.id
      );


      await api.delete(
        `/budgets/${budgetToDelete.id}`
      );


      toast.success(
        "Budget deleted successfully"
      );


      setBudgetToDelete(null);


      await fetchData();

    } catch (error) {

      console.error(
        "Delete budget error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete budget"
      );

    } finally {

      setDeleting(false);

    }

  };


  // ======================================================
  // CANCEL DELETE
  // ======================================================

  const cancelDelete = () => {

    if (deleting) {
      return;
    }

    setBudgetToDelete(null);

  };


  // ======================================================
  // CANCEL FORM
  // ======================================================

  const handleCancel = () => {

    if (loading) {
      return;
    }

    setEditingBudget(null);
    setShowForm(false);

  };


  // ======================================================
  // OPEN CREATE FORM
  // ======================================================

  const handleCreateBudget = () => {

    setEditingBudget(null);
    setShowForm(true);

  };


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="p-6">

      {/* PAGE HEADER */}

      <div className="
        flex
        justify-between
        items-start
        mb-6
      ">

        <div>

          <p className="
            text-sm
            font-semibold
            text-purple-600
            uppercase
            tracking-wide
          ">
            Monthly Planning
          </p>


          <h1 className="
            text-3xl
            font-bold
            mt-1
          ">
            Budget
          </h1>


          <p className="
            text-gray-600
            mt-1
          ">
            Manage your monthly spending limits.
          </p>

        </div>


        <button
          type="button"
          onClick={handleCreateBudget}
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

      </div>


      {/* SUMMARY */}

      <div className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-4
        mb-6
      ">

        <div className="
          bg-white
          rounded-xl
          shadow
          p-5
        ">

          <p className="
            text-sm
            text-gray-500
          ">
            Total planned
          </p>


          <p className="
            text-2xl
            font-bold
            mt-2
            text-purple-600
          ">
            ₹{totalPlanned.toFixed(2)}
          </p>

        </div>


        <div className="
          bg-white
          rounded-xl
          shadow
          p-5
        ">

          <p className="
            text-sm
            text-gray-500
          ">
            Spent this month
          </p>


          <p className="
            text-2xl
            font-bold
            mt-2
            text-orange-500
          ">
            ₹{totalSpent.toFixed(2)}
          </p>

        </div>


        <div className="
          bg-white
          rounded-xl
          shadow
          p-5
        ">

          <p className="
            text-sm
            text-gray-500
          ">
            Remaining
          </p>


          <p className="
            text-2xl
            font-bold
            mt-2
            text-green-600
          ">
            ₹{totalRemaining.toFixed(2)}
          </p>

        </div>

      </div>


      {/* OVER BUDGET WARNING */}

      {exceededBudgets.length > 0 && (

        <div className="
          bg-red-50
          border
          border-red-200
          rounded-xl
          p-4
          mb-6
        ">

          <div className="
            flex
            items-start
            gap-3
          ">

            <span className="
              text-red-500
              text-xl
            ">
              ⚠
            </span>


            <div>

              <p className="
                font-semibold
                text-red-700
              ">
                Budget needs attention
              </p>


              <p className="
                text-sm
                text-red-600
                mt-1
              ">

                {exceededBudgets
                  .map(
                    (budget) =>
                      budget.category
                  )
                  .join(", ")}

                {" "}has exceeded its limit.

              </p>

            </div>

          </div>

        </div>

      )}


      {/* CREATE / EDIT FORM */}

      {showForm && (

        <BudgetForm
          onSubmit={handleSubmit}
          editingBudget={editingBudget}
          onCancel={handleCancel}
          loading={loading}
        />

      )}


      {/* BUDGET LIST */}

      <BudgetList
        budgets={budgetData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />


      {/* DELETE MODAL */}

      {budgetToDelete && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            px-4
          "
          onClick={cancelDelete}
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-2xl
              w-full
              max-w-md
              p-6
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ICON */}

            <div className="
              w-12
              h-12
              rounded-full
              bg-red-100
              flex
              items-center
              justify-center
              text-2xl
              mb-4
            ">
              ⚠️
            </div>


            {/* TITLE */}

            <h2 className="
              text-xl
              font-bold
              text-gray-900
            ">
              Delete Budget?
            </h2>


            {/* MESSAGE */}

            <p className="
              text-gray-600
              mt-2
              leading-relaxed
            ">

              Are you sure you want to delete the{" "}

              <span className="
                font-semibold
                text-gray-900
              ">
                {budgetToDelete.category}
              </span>

              {" "}budget?

            </p>


            <p className="
              text-sm
              text-gray-500
              mt-2
            ">
              This action cannot be undone.
            </p>


            {/* BUTTONS */}

            <div className="
              flex
              justify-end
              gap-3
              mt-6
            ">

              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  border
                  border-gray-300
                  text-gray-700
                  hover:bg-gray-100
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-red-600
                  hover:bg-red-700
                  text-white
                  disabled:bg-red-400
                  disabled:cursor-not-allowed
                "
              >

                {deleting
                  ? "Deleting..."
                  : "Delete Budget"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}