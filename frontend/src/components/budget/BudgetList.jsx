export default function BudgetList({
  budgets,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">
          Budgets
        </h2>

        <p className="text-gray-600 mt-1">
          Manage your monthly budgets
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
              budgets.map((budget) => (
                <tr
                  key={budget.id}
                  className="border-t"
                >

                  <td className="p-4">
                    {budget.category}
                  </td>

                  <td className="p-4 font-semibold text-purple-600">
                    ₹{Number(
                      budget.monthly_limit || 0
                    ).toFixed(2)}
                  </td>

                  <td className="p-4">
                    {budget.month_year}
                  </td>

                  <td className="p-4">

                    <div className="flex gap-2">

                      <button
                        onClick={() => onEdit(budget)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(budget.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
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