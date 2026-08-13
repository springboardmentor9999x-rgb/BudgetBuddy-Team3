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

    // SOURCE VALIDATION

    if (!form.source.trim()) {
      toast.error(
        "Please enter income source"
      );
      return;
    }

    // AMOUNT VALIDATION

    if (Number(form.amount) <= 0) {
      toast.error(
        "Income amount must be greater than zero"
      );
      return;
    }

    // BANK ACCOUNT VALIDATION

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

      // RESET FORM

      resetForm();

      // REFRESH INCOME LIST

      await fetchIncomes();

      // REFRESH BANK ACCOUNT BALANCES

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
  // EDIT
  // ==========================================

  const handleEdit = (income) => {

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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this income?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `/incomes/${id}`
      );

      toast.success(
        "Income deleted successfully"
      );

      // REFRESH INCOME LIST

      await fetchIncomes();

      // REFRESH BANK ACCOUNT BALANCE

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
    }
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

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800">
            Income Manager
          </h1>

          <p className="text-gray-600 mt-2">
            Add, update and manage your income records
          </p>

        </div>

        {/* FORM */}

        <IncomeForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          editing={editingIncome}
          onCancel={resetForm}
          loading={loading}
          bankAccounts={bankAccounts}
        />

        {/* LIST */}

        <IncomeList
          incomes={incomes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </main>

    </div>
  );
}