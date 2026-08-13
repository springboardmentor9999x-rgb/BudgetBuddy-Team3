import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  addExpense,
  updateExpense,
} from "../../api/transactions";

import api from "../../api/axios";


export default function ExpenseForm({
  editingExpense,
  onSuccess,
  onCancel,
}) {

  const [form, setForm] = useState({
    category: "Food",
    amount: "",
    description: "",
    bank_account_id: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [loadingAccounts, setLoadingAccounts] =
    useState(true);


  // ==========================================================
  // FETCH BANK ACCOUNTS
  // ==========================================================

  const fetchBankAccounts = async () => {

    try {

      setLoadingAccounts(true);

      const response = await api.get(
        "/bank-accounts/"
      );

      setBankAccounts(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch bank accounts error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load bank accounts"
      );

    } finally {

      setLoadingAccounts(false);

    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    fetchBankAccounts();

  }, []);


  // ==========================================================
  // SET FORM FOR ADD / EDIT
  // ==========================================================

  useEffect(() => {

    if (editingExpense) {

      setForm({
        category:
          editingExpense.category || "Food",

        amount:
          editingExpense.amount || "",

        description:
          editingExpense.description || "",

        bank_account_id:
          editingExpense.bank_account_id
            ? String(editingExpense.bank_account_id)
            : "",
      });

    } else {

      setForm({
        category: "Food",
        amount: "",
        description: "",
        bank_account_id: "",
      });

    }

  }, [editingExpense]);


  // ==========================================================
  // HANDLE INPUT
  // ==========================================================

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    if (!form.category) {

      toast.error(
        "Please select a category"
      );

      return;
    }


    if (Number(form.amount) <= 0) {

      toast.error(
        "Expense amount must be greater than zero"
      );

      return;
    }


    if (!form.bank_account_id) {

      toast.error(
        "Please select a bank account"
      );

      return;
    }


    setLoading(true);


    try {

      const payload = {

        category:
          form.category,

        amount:
          Number(form.amount),

        description:
          form.description.trim() || null,

        bank_account_id:
          Number(form.bank_account_id),
      };


      // UPDATE

      if (editingExpense) {

        await updateExpense(
          editingExpense.id,
          payload
        );

        toast.success(
          "Expense updated successfully"
        );

      }

      // CREATE

      else {

        await addExpense(
          payload
        );

        toast.success(
          "Expense added successfully"
        );

      }


      setForm({
        category: "Food",
        amount: "",
        description: "",
        bank_account_id: "",
      });


      if (onSuccess) {

        onSuccess();

      }


    } catch (error) {

      console.error(
        "Expense error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Expense operation failed"
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // LOADING ACCOUNTS
  // ==========================================================

  if (loadingAccounts) {

    return (

      <div className="bg-white rounded-xl shadow p-6">

        <p className="text-gray-600">
          Loading bank accounts...
        </p>

      </div>

    );

  }


  // ==========================================================
  // NO ACCOUNTS
  // ==========================================================

  if (bankAccounts.length === 0) {

    return (

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-bold mb-4">
          {editingExpense
            ? "Edit Expense"
            : "Add Expense"}
        </h2>

        <p className="text-red-500">
          No bank account available.
          Please add a bank account first.
        </p>

        {onCancel && (

          <button
            type="button"
            onClick={onCancel}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
          >
            Cancel
          </button>

        )}

      </div>

    );

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="bg-white rounded-xl shadow p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">

          {editingExpense
            ? "Edit Expense"
            : "Add Expense"}

        </h2>


        {onCancel && (

          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            ✕
          </button>

        )}

      </div>


      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* CATEGORY */}

        <div>

          <label className="block text-sm font-medium mb-1">
            Category
          </label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          >

            <option value="Food">
              Food
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


        {/* AMOUNT */}

        <div>

          <label className="block text-sm font-medium mb-1">
            Amount
          </label>

          <input
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            required
          />

        </div>


        {/* BANK ACCOUNT */}

        <div>

          <label className="block text-sm font-medium mb-1">
            Bank Account
          </label>

          <select
            name="bank_account_id"
            value={form.bank_account_id}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 bg-white"
            required
          >

            <option value="">
              Select Bank Account
            </option>

            {bankAccounts.map((account) => (

              <option
                key={account.id}
                value={account.id}
              >

                {account.bank_name}

                {" - "}

                {account.account_type}

                {" - "}

                {account.account_number
                  ? `****${account.account_number.slice(-4)}`
                  : "Account"}

                {" - ₹"}

                {Number(
                  account.balance || 0
                ).toFixed(2)}

              </option>

            ))}

          </select>

        </div>


        {/* DESCRIPTION */}

        <div>

          <label className="block text-sm font-medium mb-1">
            Description
          </label>

          <textarea
            name="description"
            placeholder="Enter description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
            rows="3"
          />

        </div>


        {/* BUTTONS */}

        <div className="flex gap-3">

          <button
            type="submit"
            disabled={
              loading ||
              bankAccounts.length === 0
            }
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg"
          >

            {loading
              ? "Saving..."
              : editingExpense
              ? "Update Expense"
              : "Add Expense"}

          </button>


          {editingExpense && onCancel && (

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