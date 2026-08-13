import { toast } from "react-toastify";
import { deleteExpense } from "../../api/transactions";

export default function ExpenseList({
  expenses,
  onEdit,
  onRefresh,
}) {

  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {

      await deleteExpense(id);

      toast.success(
        "Expense deleted successfully"
      );

      await onRefresh();

    } catch (error) {

      console.error(
        "Delete expense error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete expense"
      );
    }
  };


  const formatDate = (date) => {

    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  return (

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
                ID
              </th>

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
                  colSpan="6"
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
                    {expense.id}
                  </td>


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
                    ₹{Number(
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
                          handleDelete(expense.id)
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
  );
}