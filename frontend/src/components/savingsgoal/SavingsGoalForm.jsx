import { useEffect, useState } from "react";

export default function SavingsGoalForm({
  onSubmit,
  editingGoal,
  onCancel,
  loading,
}) {
  const [form, setForm] = useState({
    title: "",
    target_amount: "",
    current_amount: 0,
    target_date: "",
  });

  useEffect(() => {
    if (editingGoal) {
      setForm({
        title: editingGoal.title || "",
        target_amount: editingGoal.target_amount || "",
        current_amount: editingGoal.current_amount || 0,
        target_date: editingGoal.target_date || "",
      });
    } else {
      setForm({
        title: "",
        target_amount: "",
        current_amount: 0,
        target_date: "",
      });
    }
  }, [editingGoal]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const targetAmount = Number(form.target_amount);
    const currentAmount = Number(form.current_amount);

    if (!form.title.trim()) {
      return;
    }

    if (targetAmount <= 0) {
      return;
    }

    if (currentAmount < 0) {
      return;
    }

    onSubmit({
      title: form.title.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      target_date: form.target_date || null,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">

      <h2 className="text-xl font-bold mb-4">
        {editingGoal
          ? "Edit Savings Goal"
          : "Create Savings Goal"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4"
      >

        {/* TITLE */}

        <input
          type="text"
          placeholder="Goal Title"
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
          className="border rounded-lg p-3"
          required
        />

        {/* TARGET AMOUNT */}

        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Target Amount"
          value={form.target_amount}
          onChange={(e) =>
            setForm({
              ...form,
              target_amount: e.target.value,
            })
          }
          className="border rounded-lg p-3"
          required
        />

        {/* CURRENT AMOUNT */}

        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Current Amount"
          value={form.current_amount}
          onChange={(e) =>
            setForm({
              ...form,
              current_amount: e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* TARGET DATE */}

        <input
          type="date"
          value={form.target_date}
          onChange={(e) =>
            setForm({
              ...form,
              target_date: e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* BUTTONS */}

        <div className="flex gap-3">

          <button
            type="submit"
            disabled={loading}
            className="
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-gray-400
              text-white
              px-6
              py-3
              rounded-lg
            "
          >
            {loading
              ? "Saving..."
              : editingGoal
              ? "Update Goal"
              : "Save Goal"}
          </button>

          {editingGoal && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="
                bg-gray-500
                hover:bg-gray-600
                disabled:bg-gray-400
                text-white
                px-6
                py-3
                rounded-lg
              "
            >
              Cancel
            </button>
          )}

        </div>

      </form>
    </div>
  );
}