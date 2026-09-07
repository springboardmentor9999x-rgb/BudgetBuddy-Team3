import { useMemo } from "react";

// ==========================================================
// SHARED LAST-12-MONTH SELECTOR
// ==========================================================
// Shows:
// - Current month
// - Previous 11 months
//
// Value format:
// YYYY-MM
// ==========================================================

export default function MonthSelector({
  value,
  onChange,
  label = "Month",
}) {

  const months = useMemo(() => {

    const result = [];
    const now = new Date();

    for (let index = 0; index < 12; index += 1) {

      const date = new Date(
        now.getFullYear(),
        now.getMonth() - index,
        1
      );

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const monthValue = `${year}-${month}`;

      result.push({
        value: monthValue,

        label: date.toLocaleDateString(
          "en-US",
          {
            month: "long",
            year: "numeric",
          }
        ),
      });
    }

    return result;

  }, []);

  // ========================================================
  // HANDLE CHANGE
  // ========================================================

  const handleChange = (event) => {

    const newValue = event.target.value;

    onChange(newValue);
  };

  // ========================================================
  // UI
  // ========================================================

  return (
    <div className="w-full">

      {/* ================================================
          HEADER
      ================================================= */}

      <div className="
        flex
        flex-col
        sm:flex-row
        sm:items-center
        sm:justify-between
        gap-4
      ">

        {/* ==============================================
            LABEL + DESCRIPTION
        =============================================== */}

        <div className="flex items-center gap-3">

          {/* Calendar Icon */}

          <div className="
            flex
            items-center
            justify-center
            w-11
            h-11
            rounded-xl
            bg-blue-50
            text-blue-600
            text-xl
            flex-shrink-0
          ">
            📅
          </div>

          <div>

            <label
              htmlFor="month-selector"
              className="
                block
                text-base
                font-bold
                text-gray-800
                cursor-pointer
              "
            >
              {label}
            </label>

            <p className="
              text-sm
              text-gray-500
              mt-0.5
            ">
              View transactions for a selected month
            </p>

          </div>

        </div>


        {/* ==============================================
            MONTH SELECTOR
        =============================================== */}

        <div className="relative w-full sm:w-auto">

          <select
            id="month-selector"
            value={value}
            onChange={handleChange}
            className="
              appearance-none
              w-full
              sm:w-52
              bg-white
              border
              border-gray-300
              hover:border-blue-400
              rounded-xl
              pl-4
              pr-11
              py-3
              text-sm
              font-semibold
              text-gray-800
              shadow-sm
              transition-all
              duration-200
              cursor-pointer
              focus:outline-none
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
            "
          >

            {months.map((month) => (

              <option
                key={month.value}
                value={month.value}
              >
                {month.label}
              </option>

            ))}

          </select>


          {/* Custom Dropdown Arrow */}

          <div className="
            pointer-events-none
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-4
            text-gray-500
          ">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>

          </div>

        </div>

      </div>

    </div>
  );
}