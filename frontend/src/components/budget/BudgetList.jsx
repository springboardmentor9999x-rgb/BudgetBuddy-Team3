export default function BudgetList({
  budgets,
  onEdit,
  onDelete,
}) {

  const formatMonth = (monthYear) => {

    if (!monthYear) {
      return "-";
    }

    const [year, month] = monthYear.split("-");

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthIndex = Number(month) - 1;

    if (
      !year ||
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      return monthYear;
    }

    return `${monthNames[monthIndex]} ${year}`;
  };


  if (!Array.isArray(budgets)) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-center text-gray-500">
          Unable to load budgets.
        </p>
      </div>
    );
  }


  return (

    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* HEADER */}

      <div className="p-6 border-b">

        <h2 className="text-2xl font-bold">
          Your Category Budgets
        </h2>

        <p className="text-gray-600 mt-1">
          Track your spending against each monthly limit.
        </p>

      </div>


      {/* LIST */}

      <div className="p-6">

        {budgets.length === 0 ? (

          <div className="text-center p-8">

            <p className="text-gray-500">
              No budgets available.
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Click "+ Set Budget" to create your first budget.
            </p>

          </div>

        ) : (

          <div className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-5
          ">

            {budgets.map((budget) => {

              const limit =
                Number(
                  budget.monthly_limit || 0
                );

              const spent =
                Number(
                  budget.spent || 0
                );

              const percentage =
                limit > 0
                  ? (spent / limit) * 100
                  : 0;

              const displayPercentage =
                Math.min(
                  Math.max(
                    percentage,
                    0
                  ),
                  100
                );

              const remaining =
                Math.max(
                  limit - spent,
                  0
                );

              const overAmount =
                Math.max(
                  spent - limit,
                  0
                );

              const isOverBudget =
                spent > limit;

              const isBudgetReached =
                limit > 0 &&
                spent === limit;

              const isNearLimit =
                !isOverBudget &&
                percentage >= 80 &&
                percentage < 100;


              return (

                <div
                  key={budget.id}
                  className="
                    border
                    rounded-xl
                    p-5
                    hover:shadow-md
                    transition
                  "
                >

                  {/* STATUS + ACTIONS */}

                  <div className="flex justify-between items-start">

                    <div>

                      <span
                        className={`
                          inline-block
                          px-2
                          py-1
                          rounded-full
                          text-xs
                          font-semibold
                          ${
                            isOverBudget
                              ? "bg-red-100 text-red-600"
                              : isBudgetReached
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-600"
                          }
                        `}
                      >

                        {isOverBudget
                          ? "OVER BUDGET"
                          : isBudgetReached
                          ? "BUDGET REACHED"
                          : "ON TRACK"}

                      </span>


                      <h3 className="text-xl font-bold mt-3">
                        {budget.category}
                      </h3>

                    </div>


                    {/* ACTION BUTTONS */}

                    <div className="flex gap-2">

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() => onEdit(budget)}
                        className="
                          text-blue-600
                          hover:text-blue-800
                          px-2
                        "
                        title="Edit budget"
                      >
                        ✏️
                      </button>


                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() => onDelete(budget)}
                        className="
                          text-red-500
                          hover:text-red-700
                          px-2
                        "
                        title="Delete budget"
                      >
                        🗑️
                      </button>

                    </div>

                  </div>


                  {/* AMOUNTS */}

                  <div className="flex justify-between items-end mt-5">

                    <div>

                      <p
                        className={`
                          text-2xl
                          font-bold
                          ${
                            isOverBudget
                              ? "text-red-600"
                              : "text-gray-900"
                          }
                        `}
                      >

                        ₹{spent.toFixed(2)}

                      </p>


                      <p className="text-sm text-gray-500 mt-1">

                        spent of ₹{limit.toFixed(2)}

                      </p>

                    </div>


                    <div className="text-right">

                      <p className="text-sm text-gray-500">

                        {formatMonth(
                          budget.month_year
                        )}

                      </p>

                    </div>

                  </div>


                  {/* PROGRESS BAR */}

                  <div className="mt-4">

                    <div className="
                      w-full
                      bg-gray-200
                      rounded-full
                      h-4
                      overflow-hidden
                    ">

                      <div
                        className={`
                          h-4
                          rounded-full
                          transition-all
                          duration-500
                          ${
                            isOverBudget
                              ? "bg-red-500"
                              : isNearLimit
                              ? "bg-yellow-500"
                              : isBudgetReached
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }
                        `}
                        style={{
                          width: `${displayPercentage}%`,
                        }}
                      />

                    </div>


                    {/* STATUS */}

                    <div className="mt-2">

                      {isOverBudget ? (

                        <div className="
                          flex
                          justify-between
                          items-center
                        ">

                          <span className="
                            text-sm
                            font-semibold
                            text-red-600
                          ">
                            ⚠️ Over Budget
                          </span>


                          <span className="
                            text-sm
                            font-semibold
                            text-red-600
                          ">
                            ₹{overAmount.toFixed(2)} over
                          </span>

                        </div>

                      ) : isBudgetReached ? (

                        <div className="
                          flex
                          justify-between
                          items-center
                        ">

                          <span className="
                            text-sm
                            font-semibold
                            text-yellow-700
                          ">
                            ⚠️ Budget reached
                          </span>


                          <span className="
                            text-sm
                            font-semibold
                            text-yellow-700
                          ">
                            ₹0.00 remaining
                          </span>

                        </div>

                      ) : (

                        <div className="
                          flex
                          justify-between
                          items-center
                        ">

                          <span className="
                            text-sm
                            font-medium
                            text-gray-600
                          ">
                            {percentage.toFixed(0)}% used
                          </span>


                          <span className="
                            text-sm
                            text-gray-600
                          ">
                            ₹{remaining.toFixed(2)} remaining
                          </span>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>

  );
}