import { useEffect, useState } from "react";

export default function BudgetForm({
  onSubmit,
  editingBudget,
  onCancel,
  loading,
}) {
  const getCurrentMonth = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
  };

  const [form, setForm] = useState({
    category: "Food & dining",
    monthly_limit: "",
    month_year: getCurrentMonth(),
  });

  // ======================================================
  // LOAD EDITING DATA
  // ======================================================

  useEffect(() => {
    if (editingBudget) {
      setForm({
        category:
          editingBudget.category || "Food & dining",

        monthly_limit:
          editingBudget.monthly_limit ?? "",

        month_year:
          editingBudget.month_year || getCurrentMonth(),
      });
    } else {
      setForm({
        category: "Food & dining",
        monthly_limit: "",
        month_year: getCurrentMonth(),
      });
    }
  }, [editingBudget]);

  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    const monthlyLimit = Number(form.monthly_limit);

    if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      alert("Please enter a valid monthly budget greater than 0.");
      return;
    }

    if (!form.category) {
      alert("Please select a category.");
      return;
    }

    if (!form.month_year) {
      alert("Please select a month.");
      return;
    }

    onSubmit({
      category: form.category,
      monthly_limit: monthlyLimit,
      month_year: form.month_year,
    });
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">

      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {editingBudget
              ? "Edit Budget"
              : "Create a Category Limit"}
          </h2>

          <p className="text-gray-500 mt-1">
            Choose a category and the maximum amount you want
            to spend for the selected month.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="
            text-gray-400
            hover:text-gray-700
            text-2xl
            leading-none
            disabled:opacity-50
          "
          title="Close"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4"
      >

        {/* CATEGORY */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-lg
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            required
            disabled={loading}
          >
            <option value="Food & dining">
              Food & dining
            </option>

            <option value="Food">
              Food
            </option>

            <option value="Transport">
              Transport
            </option>

            <option value="Travel">
              Travel
            </option>

            <option value="Shopping">
              Shopping
            </option>

            <option value="Education">
              Education
            </option>

            <option value="Entertainment">
              Entertainment
            </option>

            <option value="Miscellaneous">
              Miscellaneous
            </option>
          </select>
        </div>

        {/* MONTHLY LIMIT */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Limit
          </label>

          <input
            type="number"
            name="monthly_limit"
            min="0.01"
            step="0.01"
            placeholder="Enter budget amount"
            value={form.monthly_limit}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-lg
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            required
            disabled={loading}
          />
        </div>

        {/* MONTH */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>

          <input
            type="month"
            name="month_year"
            value={form.month_year}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-lg
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            required
            disabled={loading}
          />
        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 mt-2">

          <button
            type="submit"
            disabled={loading}
            className="
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-gray-400
              disabled:cursor-not-allowed
              text-white
              px-6
              py-3
              rounded-lg
              font-medium
            "
          >
            {loading
              ? "Saving..."
              : editingBudget
              ? "Update Budget"
              : "Add Budget"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              bg-gray-500
              hover:bg-gray-600
              disabled:bg-gray-400
              disabled:cursor-not-allowed
              text-white
              px-6
              py-3
              rounded-lg
              font-medium
            "
          >
            Cancel
          </button>

        </div>

      </form>
    </div>
  );
}