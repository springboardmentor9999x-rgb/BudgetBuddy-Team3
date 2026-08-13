import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeToSavingsGoal,
} from "../api/savingsGoals";

import SavingsGoalForm from "../components/savingsgoal/SavingsGoalForm";
import SavingsGoalList from "../components/savingsgoal/SavingsGoalList";

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchGoals = async () => {
    try {
      const data = await getSavingsGoals();

      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch savings goals error:", error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to load savings goals"
      );
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (data) => {
    setLoading(true);

    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, data);

        toast.success(
          "Savings goal updated successfully"
        );
      } else {
        await addSavingsGoal(data);

        toast.success(
          "Savings goal created successfully"
        );
      }

      setEditingGoal(null);
      setShowForm(false);

      await fetchGoals();
    } catch (error) {
      console.error(
        "Savings goal operation error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Savings goal operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this savings goal?"
    );

    if (!confirmed) return;

    try {
      await deleteSavingsGoal(id);

      toast.success(
        "Savings goal deleted successfully"
      );

      await fetchGoals();
    } catch (error) {
      console.error(
        "Delete savings goal error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to delete savings goal"
      );
    }
  };

  const handleContribute = async (goal) => {
    const amount = window.prompt(
      `Enter contribution amount for "${goal.title}":`
    );

    if (amount === null) return;

    const contribution = Number(amount);

    if (!Number.isFinite(contribution) || contribution <= 0) {
      toast.error("Enter a valid contribution amount");
      return;
    }

    try {
      await contributeToSavingsGoal(
        goal.id,
        contribution
      );

      toast.success(
        "Contribution added successfully"
      );

      await fetchGoals();
    } catch (error) {
      console.error(
        "Contribution error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to add contribution"
      );
    }
  };

  const handleCancel = () => {
    setEditingGoal(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Savings Goals
        </h1>

        <p className="text-gray-600 mt-1">
          Set targets and track your savings progress
        </p>
      </div>

      <button
        onClick={() => {
          setEditingGoal(null);
          setShowForm(true);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mb-6"
      >
        + Create Savings Goal
      </button>

      {showForm && (
        <SavingsGoalForm
          onSubmit={handleSubmit}
          editingGoal={editingGoal}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      <SavingsGoalList
        goals={goals}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onContribute={handleContribute}
      />
    </div>
  );
}