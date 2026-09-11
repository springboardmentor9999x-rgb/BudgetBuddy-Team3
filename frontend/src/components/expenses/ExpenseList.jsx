import { useState } from "react";
import { toast } from "react-toastify";
import { deleteExpense } from "../../api/transactions";
import { formatDate } from "../../utils/formatDate";

export default function ExpenseList({
  expenses,
  onEdit,
  onRefresh,
}) {
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================================
  // OPEN DELETE CONFIRMATION
  // ==========================================================

  const handleDeleteClick = (id) => {
    if (!id) {
      toast.error("Unable to delete expense: missing expense ID.");
      return;
    }

    setDeleteId(id);
  };

  // ==========================================================
  // CANCEL DELETE
  // ==========================================================

  const handleCancelDelete = () => {
    if (deleting) return;

    setDeleteId(null);
  };

  // ==========================================================
  // CONFIRM DELETE
  // ==========================================================

  const handleConfirmDelete = async () => {
    if (!deleteId) {
      toast.error("Unable to delete expense: missing expense ID.");
      return;
    }

    try {
      setDeleting(true);

      await deleteExpense(deleteId);

      toast.success("Expense deleted successfully");

      setDeleteId(null);

      await onRefresh();
    } catch (error) {
      console.error("Delete expense error:", error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to delete expense"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ======================================================
          EXPENSE LIST
      ====================================================== */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        {/* HEADER */}

        <div className="p-6 border-b">

          <h2 className="text-2xl font-bold">
            Expenses
          </h2>

          <p className="text-gray-600 mt-1">
            Manage your expenses
          </p>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left p-4">
                  Date
                </th>

                <th className="text-left p-4">
                  Category
                </th>

                <th className="text-left p-4">
                  Description
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

              {expenses.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="text-center text-gray-500 p-8"
                  >
                    No expenses available
                  </td>

                </tr>

              ) : (

                expenses.map((expense) => (

                  <tr
                    key={expense.id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-4">
                      {formatDate(expense.date)}
                    </td>

                    <td className="p-4">
                      {expense.category}
                    </td>

                    <td className="p-4">
                      {expense.description || "-"}
                    </td>

                    <td className="p-4 font-semibold text-red-600">
                      ₹
                      {Number(
                        expense.amount || 0
                      ).toFixed(2)}
                    </td>

                    {/* ACTION */}

                    <td className="p-4">

                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(expense)
                          }
                          className="
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            px-3
                            py-2
                            rounded-lg
                          "
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteClick(expense.id)
                          }
                          className="
                            bg-red-500
                            hover:bg-red-600
                            text-white
                            px-3
                            py-2
                            rounded-lg
                          "
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

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {deleteId !== null && (

        <div className="
          fixed
          inset-0
          bg-black/50
          flex
          items-center
          justify-center
          z-50
          p-4
        ">

          <div className="
            bg-white
            rounded-xl
            shadow-2xl
            w-full
            max-w-md
            p-6
          ">

            <h2 className="
              text-xl
              font-bold
              text-gray-800
              mb-3
            ">
              Delete Expense?
            </h2>

            <p className="
              text-gray-600
              mb-6
            ">
              Are you sure you want to delete this expense?
              The expense amount will be refunded to the
              associated bank account.
            </p>

            <div className="
              flex
              justify-end
              gap-3
            ">

              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-gray-200
                  hover:bg-gray-300
                  text-gray-800
                  font-medium
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-red-600
                  hover:bg-red-700
                  text-white
                  font-medium
                  disabled:bg-red-300
                "
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Expense"}
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}