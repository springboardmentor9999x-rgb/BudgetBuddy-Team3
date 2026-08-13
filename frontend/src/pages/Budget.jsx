import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";
import BudgetForm from "../components/budget/BudgetForm";
import BudgetList from "../components/budget/BudgetList";

export default function Budget() {

  const [budgets, setBudgets] = useState([]);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBudgets = async () => {
    try {
      const response = await api.get("/budgets/");

      setBudgets(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {
      console.error("Fetch budgets error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Failed to load budgets"
      );
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (data) => {

    setLoading(true);

    try {

      if (editingBudget) {

        await api.put(
          `/budgets/${editingBudget.id}`,
          data
        );

        toast.success(
          "Budget updated successfully"
        );

      } else {

        await api.post(
          "/budgets/",
          data
        );

        toast.success(
          "Budget added successfully"
        );
      }

      setEditingBudget(null);
      setShowForm(false);

      await fetchBudgets();

    } catch (error) {

      console.error("Budget operation error:", error);

      toast.error(
        error.response?.data?.detail ||
        "Budget operation failed"
      );

    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    try {

      await api.delete(
        `/budgets/${id}`
      );

      toast.success(
        "Budget deleted successfully"
      );

      await fetchBudgets();

    } catch (error) {

      console.error(
        "Delete budget error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete budget"
      );
    }
  };

  const handleCancel = () => {
    setEditingBudget(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">

      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          Budget
        </h1>

        <p className="text-gray-600 mt-1">
          Manage your monthly budgets
        </p>

      </div>

      <button
        onClick={() => {
          setEditingBudget(null);
          setShowForm(true);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mb-6"
      >
        + Set Budget
      </button>

      {showForm && (
        <BudgetForm
          onSubmit={handleSubmit}
          editingBudget={editingBudget}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      <BudgetList
        budgets={budgets}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

    </div>
  );
}