import { useState } from "react";

export default function BudgetForm({ onSubmit, editingBudget, onCancel }) {
  const [form, setForm] = useState({
    category: editingBudget?.category || "Food",
    monthly_limit: editingBudget?.monthly_limit || "",
    month_year: editingBudget?.month_year || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      category: form.category,
      monthly_limit: Number(form.monthly_limit),
      month_year: form.month_year,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">

      <h2 className="text-xl font-bold mb-4">
        {editingBudget ? "Edit Budget" : "Set Budget"}
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-4">

        <select
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value,
            })
          }
          className="border rounded-lg p-3"
        >
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Shopping">Shopping</option>
          <option value="Education">Education</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>

        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Monthly Limit"
          value={form.monthly_limit}
          onChange={(e) =>
            setForm({
              ...form,
              monthly_limit: e.target.value,
            })
          }
          className="border rounded-lg p-3"
          required
        />

        <input
          type="month"
          value={form.month_year}
          onChange={(e) =>
            setForm({
              ...form,
              month_year: e.target.value,
            })
          }
          className="border rounded-lg p-3"
          required
        />

        <div className="flex gap-3">

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            {editingBudget ? "Update Budget" : "Save Budget"}
          </button>

          {editingBudget && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              Cancel
            </button>
          )}

        </div>

      </form>
    </div>
  );
}