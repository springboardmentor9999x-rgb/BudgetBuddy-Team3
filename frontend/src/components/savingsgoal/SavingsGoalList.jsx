import { formatDate } from "../../utils/formatDate";

export default function SavingsGoalList({
  goals,
  onEdit,
  onDelete,
  onContribute,
}) {

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


  return (

    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="p-6 border-b">

        <h2 className="text-2xl font-bold">
          Your Progress
        </h2>

        <p className="text-gray-600 mt-1">
          Contributions update your progress automatically.
        </p>

      </div>


      {/* ==================================================
          GOALS
      ================================================== */}

      <div className="p-6">

        {goals.length === 0 ? (

          <div className="text-center text-gray-500 p-8">

            <p className="text-lg">
              No savings goals available
            </p>

            <p className="text-sm mt-1">
              Create your first savings goal to start tracking progress.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {goals.map((goal) => {

              const targetAmount =
                Number(
                  goal.target_amount || 0
                );

              const currentAmount =
                Number(
                  goal.current_amount || 0
                );

              const progress =
                calculateProgress(goal);

              const remainingAmount =
                Math.max(
                  targetAmount -
                    currentAmount,
                  0
                );

              const isCompleted =
                goal.status === "completed" ||
                progress >= 100;

              const isAbove70 =
                progress >= 70;

              const isOver70AndNotCompleted =
                isAbove70 &&
                !isCompleted;


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

                  {/* ==================================================
                      TITLE + DELETE
                  ================================================== */}

                  <div className="flex justify-between items-start">

                    <div>

                      <h3 className="text-xl font-bold">
                        {goal.title}
                      </h3>

                      <p className="text-gray-500 mt-1">

                        Target:{" "}

                        {goal.target_date
                          ? formatDate(
                              goal.target_date
                            )
                          : "Not specified"}

                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        onDelete(goal)
                      }
                      className="
                        text-red-500
                        hover:text-red-700
                        px-2
                        py-1
                      "
                      title="Delete goal"
                    >
                      🗑
                    </button>

                  </div>


                  {/* ==================================================
                      AMOUNTS
                  ================================================== */}

                  <div className="flex justify-between items-end mt-5">

                    <div>

                      <p className="text-2xl font-bold text-green-600">

                        ₹
                        {currentAmount.toFixed(2)}

                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        saved
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-gray-500 text-sm">
                        Target
                      </p>

                      <p className="font-semibold">

                        ₹
                        {targetAmount.toFixed(2)}

                      </p>

                    </div>

                  </div>


                  {/* ==================================================
                      PROGRESS BAR
                  ================================================== */}

                  <div className="mt-4">

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className={`
                          h-4
                          rounded-full
                          transition-all
                          duration-500
                          ${
                            isCompleted
                              ? "bg-green-500"
                              : isAbove70
                              ? "bg-green-500"
                              : "bg-blue-600"
                          }
                        `}
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>


                    <div className="flex justify-between mt-2">

                      <span
                        className={`
                          text-sm
                          font-medium
                          ${
                            isCompleted
                              ? "text-green-600"
                              : isAbove70
                              ? "text-green-600"
                              : "text-gray-600"
                          }
                        `}
                      >
                        {progress.toFixed(1)}% complete
                      </span>


                      {isCompleted ? (

                        <span className="text-sm font-semibold text-green-600">
                          🎉 Completed
                        </span>

                      ) : (

                        <span className="text-sm text-gray-600">

                          ₹
                          {remainingAmount.toFixed(2)}
                          {" "}remaining

                        </span>

                      )}

                    </div>

                  </div>


                  {/* ==================================================
                      MILESTONE MESSAGE
                  ================================================== */}

                  {isOver70AndNotCompleted && (

                    <div className="
                      mt-4
                      bg-green-50
                      border
                      border-green-200
                      rounded-lg
                      px-4
                      py-3
                      text-sm
                      text-green-700
                    ">

                      🎯 Great progress! You have crossed
                      70% of this savings goal.

                    </div>

                  )}


                  {isCompleted && (

                    <div className="
                      mt-4
                      bg-green-50
                      border
                      border-green-200
                      rounded-lg
                      px-4
                      py-3
                      text-sm
                      font-medium
                      text-green-700
                    ">

                      🎉 Congratulations! You completed
                      this savings goal.

                    </div>

                  )}


                  {/* ==================================================
                      ACTION BUTTONS
                  ================================================== */}

                  <div className="flex gap-2 mt-5">

                    {/* CONTRIBUTE */}

                    <button
                      type="button"
                      onClick={() =>
                        onContribute(goal)
                      }
                      disabled={isCompleted}
                      className="
                        flex-1
                        bg-green-600
                        hover:bg-green-700
                        disabled:bg-gray-400
                        disabled:cursor-not-allowed
                        text-white
                        px-3
                        py-2
                        rounded-lg
                      "
                    >
                      {isCompleted
                        ? "Completed"
                        : "Contribute"}
                    </button>


                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(goal)
                      }
                      className="
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        px-4
                        py-2
                        rounded-lg
                      "
                    >
                      Edit
                    </button>

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
