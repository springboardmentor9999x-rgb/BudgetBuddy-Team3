import { formatDate } from "../../utils/formatDate";

export default function IncomeList({
  incomes,
  onEdit,
  onDelete,
}) {

  return (

    <div className="bg-white rounded-xl shadow mt-6 overflow-hidden">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="p-6 border-b">

        <h2 className="text-2xl font-bold">
          Income
        </h2>

        <p className="text-gray-600 mt-1">
          Your income records
        </p>

      </div>


      {/* ==========================================
          TABLE
      ========================================== */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="text-left p-4">
                Date
              </th>

              <th className="text-left p-4">
                Source
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

            {incomes.length === 0 ? (

              <tr>

                <td
                  colSpan="4"
                  className="
                    text-center
                    text-gray-500
                    p-8
                  "
                >
                  No income available
                </td>

              </tr>

            ) : (

              incomes.map((income) => (

                <tr
                  key={income.id}
                  className="border-t"
                >

                  {/* DATE */}

                  <td className="p-4">

                    {formatDate(
                      income.date
                    )}

                  </td>


                  {/* SOURCE */}

                  <td className="p-4">

                    {income.source}

                  </td>


                  {/* AMOUNT */}

                  <td
                    className="
                      p-4
                      font-semibold
                      text-green-600
                    "
                  >

                    ₹
                    {Number(
                      income.amount || 0
                    ).toFixed(2)}

                  </td>


                  {/* ACTIONS */}

                  <td className="p-4">

                    <div className="flex gap-2">

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          onEdit(income)
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


                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(income)
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