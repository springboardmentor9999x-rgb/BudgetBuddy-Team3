import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import IncomeForm from "../components/income/IncomeForm";
import IncomeList from "../components/income/IncomeList";

import api from "../api/axios";

export default function Income() {

  // ==========================================
  // DATA
  // ==========================================

  const [incomes, setIncomes] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [form, setForm] = useState({
    source: "",
    amount: "",
    notes: "",
    bank_account_id: "",
  });

  const [editingIncome, setEditingIncome] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [showForm, setShowForm] = useState(false);

  // ==========================================
  // DELETE CONFIRMATION
  // ==========================================

  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // GET ALL INCOMES
  // ==========================================

  const fetchIncomes = async () => {

    try {

      const response = await api.get("/incomes/");

      setIncomes(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch income error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to load income"
      );
    }
  };

  // ==========================================
  // GET ALL BANK ACCOUNTS
  // ==========================================

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

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    fetchIncomes();
    fetchBankAccounts();

  }, []);

  // ==========================================
  // ADD / UPDATE INCOME
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    // ======================================
    // SOURCE VALIDATION
    // ======================================

    if (!form.source.trim()) {

      toast.error(
        "Please enter income source"
      );

      return;
    }

    // ======================================
    // AMOUNT VALIDATION
    // ======================================

    if (Number(form.amount) <= 0) {

      toast.error(
        "Income amount must be greater than zero"
      );

      return;
    }

    // ======================================
    // BANK ACCOUNT VALIDATION
    // ======================================

    if (!form.bank_account_id) {

      toast.error(
        "Please select a bank account"
      );

      return;
    }

    setLoading(true);

    try {

      const payload = {
        source: form.source.trim(),

        amount: Number(form.amount),

        notes:
          form.notes.trim() || null,

        bank_account_id:
          Number(form.bank_account_id),
      };

      // ======================================
      // UPDATE
      // ======================================

      if (editingIncome) {

        await api.put(
          `/incomes/${editingIncome.id}`,
          payload
        );

        toast.success(
          "Income updated successfully"
        );

      }

      // ======================================
      // CREATE
      // ======================================

      else {

        await api.post(
          "/incomes/",
          payload
        );

        toast.success(
          "Income added successfully"
        );
      }

      // ======================================
      // RESET
      // ======================================

      resetForm();

      setShowForm(false);

      // ======================================
      // REFRESH DATA
      // ======================================

      await fetchIncomes();
      await fetchBankAccounts();

    } catch (error) {

      console.error(
        "Income operation error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Income operation failed"
      );

    } finally {

      setLoading(false);
    }
  };

  // ==========================================
  // ADD INCOME BUTTON
  // ==========================================

  const handleAddIncome = () => {

    setEditingIncome(null);

    setForm({
      source: "",
      amount: "",
      notes: "",
      bank_account_id: "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (income) => {

    if (!income?.id) {

      toast.error(
        "Unable to edit income: missing income ID."
      );

      return;
    }

    setEditingIncome(income);

    setForm({
      source: income.source || "",

      amount: income.amount || "",

      notes: income.notes || "",

      bank_account_id:
        income.bank_account_id
          ? String(income.bank_account_id)
          : "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // OPEN DELETE MODAL
  // ==========================================

  const handleDelete = (income) => {

    if (!income?.id) {

      toast.error(
        "Unable to delete income: missing income ID."
      );

      return;
    }

    setIncomeToDelete(income);
  };

  // ==========================================
  // CONFIRM DELETE
  // ==========================================

  const confirmDelete = async () => {

    if (!incomeToDelete?.id) {

      toast.error(
        "Unable to delete income: missing income ID."
      );

      return;
    }

    setDeleting(true);

    try {

      await api.delete(
        `/incomes/${incomeToDelete.id}`
      );

      toast.success(
        "Income deleted successfully"
      );

      // Close modal
      setIncomeToDelete(null);

      // Refresh income list
      await fetchIncomes();

      // Refresh bank account balance
      await fetchBankAccounts();

    } catch (error) {

      console.error(
        "Delete income error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
          "Failed to delete income"
      );

    } finally {

      setDeleting(false);
    }
  };

  // ==========================================
  // CANCEL DELETE
  // ==========================================

  const cancelDelete = () => {

    if (deleting) {
      return;
    }

    setIncomeToDelete(null);
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {

    setForm({
      source: "",
      amount: "",
      notes: "",
      bank_account_id: "",
    });

    setEditingIncome(null);
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {

    resetForm();

    setShowForm(false);
  };

  // ==========================================
  // LOADING BANK ACCOUNTS
  // ==========================================

  if (loadingAccounts) {

    return (
      <div className="min-h-screen bg-gray-100">

        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

          <div className="bg-white rounded-xl shadow p-10 text-center">

            Loading bank accounts...

          </div>

        </main>

      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="mb-8 flex justify-between items-start">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Income Manager
            </h1>

            <p className="text-gray-600 mt-2">
              Add, update and manage your income records
            </p>

          </div>

          {!showForm && (

            <button
              onClick={handleAddIncome}
              className="
                bg-green-600
                hover:bg-green-700
                text-white
                px-6
                py-3
                rounded-lg
                font-medium
                transition
              "
            >
              + Add Income
            </button>

          )}

        </div>

        {/* ======================================
            FORM
        ====================================== */}

        {showForm && (

          <IncomeForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            editing={editingIncome}
            onCancel={handleCancel}
            loading={loading}
            bankAccounts={bankAccounts}
          />

        )}

        {/* ======================================
            LIST
        ====================================== */}

        <IncomeList
          incomes={incomes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </main>


      {/* ==========================================
          DELETE CONFIRMATION MODAL
      ========================================== */}

      {incomeToDelete && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            px-4
          "
          onClick={cancelDelete}
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-2xl
              w-full
              max-w-md
              p-6
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ICON */}

            <div
              className="
                w-12
                h-12
                rounded-full
                bg-red-100
                flex
                items-center
                justify-center
                text-2xl
                mb-4
              "
            >
              ⚠️
            </div>


            {/* TITLE */}

            <h2
              className="
                text-xl
                font-bold
                text-gray-900
              "
            >
              Delete Income?
            </h2>


            {/* MESSAGE */}

            <p
              className="
                text-gray-600
                mt-2
                leading-relaxed
              "
            >

              Are you sure you want to delete the{" "}

              <span className="font-semibold text-gray-900">
                {incomeToDelete.source}
              </span>

              {" "}income?

            </p>


            {/* AMOUNT */}

            <p
              className="
                text-lg
                font-semibold
                text-green-600
                mt-3
              "
            >
              ₹
              {Number(
                incomeToDelete.amount || 0
              ).toFixed(2)}
            </p>


            {/* WARNING */}

            <p
              className="
                text-sm
                text-gray-500
                mt-2
              "
            >
              The income will be removed and the amount
              will be deducted from the associated bank account.
            </p>


            {/* BUTTONS */}

            <div
              className="
                flex
                justify-end
                gap-3
                mt-6
              "
            >

              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  border
                  border-gray-300
                  text-gray-700
                  hover:bg-gray-100
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="
                  px-5
                  py-2.5
                  rounded-lg
                  bg-red-600
                  hover:bg-red-700
                  text-white
                  disabled:bg-red-400
                  disabled:cursor-not-allowed
                "
              >

                {deleting
                  ? "Deleting..."
                  : "Delete Income"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}