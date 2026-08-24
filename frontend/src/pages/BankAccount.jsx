import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import BankAccountForm from "../components/bankaccount/BankAccountForm";

import {
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../api/bankAccounts";

export default function BankAccount() {

  // ==========================================
  // DATA
  // ==========================================

  const [accounts, setAccounts] = useState([]);

  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_type: "",
    balance: "",
  });

  const [editingAccount, setEditingAccount] =
    useState(null);

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [fetching, setFetching] = useState(true);

  // ==========================================
  // DELETE CONFIRMATION
  // ==========================================

  const [deleteAccountId, setDeleteAccountId] =
    useState(null);

  const [deleteAccountName, setDeleteAccountName] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);


  // ==========================================
  // FETCH ACCOUNTS
  // ==========================================

  const fetchAccounts = async () => {

    try {

      setFetching(true);

      const data = await getBankAccounts();

      setAccounts(
        Array.isArray(data) ? data : []
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

      setFetching(false);

    }

  };


  // ==========================================
  // LOAD ACCOUNTS
  // ==========================================

  useEffect(() => {

    fetchAccounts();

  }, []);


  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {

    setForm({
      bank_name: "",
      account_number: "",
      account_type: "",
      balance: "",
    });

    setEditingAccount(null);

    setShowForm(false);

  };


  // ==========================================
  // ADD ACCOUNT BUTTON
  // ==========================================

  const handleAdd = () => {

    setEditingAccount(null);

    setForm({
      bank_name: "",
      account_number: "",
      account_type: "",
      balance: "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // ==========================================
  // EDIT ACCOUNT
  // ==========================================

  const handleEdit = (account) => {

    setEditingAccount(account);

    setForm({
      bank_name: account.bank_name || "",
      account_number: account.account_number || "",
      account_type: account.account_type || "",
      balance:
        account.balance !== null &&
        account.balance !== undefined
          ? account.balance
          : "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // ==========================================
  // ADD / UPDATE
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    // -------------------------------
    // VALIDATION
    // -------------------------------

    if (!form.bank_name.trim()) {

      toast.error(
        "Please enter bank name"
      );

      return;
    }

    if (!form.account_number.trim()) {

      toast.error(
        "Please enter account number"
      );

      return;
    }

    if (!form.account_type) {

      toast.error(
        "Please select account type"
      );

      return;
    }

    if (Number(form.balance) < 0) {

      toast.error(
        "Balance cannot be negative"
      );

      return;
    }

    setLoading(true);

    try {

      const payload = {

        bank_name:
          form.bank_name.trim(),

        account_number:
          form.account_number.trim(),

        account_type:
          form.account_type,

        balance:
          Number(form.balance || 0),

      };


      // ==================================
      // UPDATE
      // ==================================

      if (editingAccount) {

        await updateBankAccount(
          editingAccount.id,
          payload
        );

        toast.success(
          "Bank account updated successfully"
        );

      }

      // ==================================
      // ADD
      // ==================================

      else {

        await addBankAccount(
          payload
        );

        toast.success(
          "Bank account added successfully"
        );

      }


      // ==================================
      // REFRESH LIST
      // ==================================

      await fetchAccounts();

      resetForm();

    } catch (error) {

      console.error(
        "Bank account operation error:",
        error
      );

      const message =
        error.response?.data?.detail ||
        "Bank account operation failed";

      toast.error(message);

    } finally {

      setLoading(false);

    }

  };


  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const handleDelete = (account) => {

    setDeleteAccountId(account.id);

    setDeleteAccountName(
      account.bank_name || "this bank account"
    );

  };


  // ==========================================
  // CANCEL DELETE
  // ==========================================

  const cancelDelete = () => {

    if (deleting) {
      return;
    }

    setDeleteAccountId(null);

    setDeleteAccountName("");

  };


  // ==========================================
  // CONFIRM DELETE
  // ==========================================

  const confirmDelete = async () => {

    if (!deleteAccountId) {
      return;
    }

    setDeleting(true);

    try {

      await deleteBankAccount(
        deleteAccountId
      );

      toast.success(
        "Bank account deleted successfully"
      );

      // Refresh account list

      await fetchAccounts();

      // Close confirmation popup

      setDeleteAccountId(null);

      setDeleteAccountName("");

    } catch (error) {

      console.error(
        "Delete bank account error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete bank account"
      );

    } finally {

      setDeleting(false);

    }

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (fetching) {

    return (

      <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">

        <div className="max-w-7xl mx-auto">

          <div className="bg-white rounded-xl shadow p-10 text-center">

            <p className="text-gray-600">
              Loading bank accounts...
            </p>

          </div>

        </div>

      </main>

    );

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">

      <div className="max-w-7xl mx-auto">


        {/* =====================================
            HEADER
        ===================================== */}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Bank Accounts
            </h1>

            <p className="text-gray-600 mt-2">
              Manage your linked bank accounts
            </p>

          </div>


          <button
            type="button"
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            + Add Account
          </button>

        </div>


        {/* =====================================
            FORM
        ===================================== */}

        {showForm && (

          <BankAccountForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            editing={editingAccount}
            onCancel={resetForm}
            loading={loading}
          />

        )}


        {/* =====================================
            ACCOUNT LIST
        ===================================== */}

        <div className="bg-white rounded-xl shadow overflow-hidden">


          {/* HEADER */}

          <div className="p-6 border-b">

            <h2 className="text-2xl font-bold">
              Your Accounts
            </h2>

            <p className="text-gray-600 mt-1">
              Your linked bank accounts
            </p>

          </div>


          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4">
                    ID
                  </th>

                  <th className="text-left p-4">
                    Bank Name
                  </th>

                  <th className="text-left p-4">
                    Account Number
                  </th>

                  <th className="text-left p-4">
                    Account Type
                  </th>

                  <th className="text-left p-4">
                    Balance
                  </th>

                  <th className="text-left p-4">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {accounts.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center text-gray-500 p-10"
                    >
                      No bank accounts added yet.
                    </td>

                  </tr>

                ) : (

                  accounts.map(
                    (account, index) => (

                      <tr
                        key={account.id}
                        className="border-t hover:bg-gray-50"
                      >

                        {/* DISPLAY ID */}

                        <td className="p-4 font-medium">
                          {index + 1}
                        </td>


                        {/* BANK NAME */}

                        <td className="p-4 font-medium">
                          {account.bank_name}
                        </td>


                        {/* ACCOUNT NUMBER */}

                        <td className="p-4">

                          {"*".repeat(
                            Math.max(
                              0,
                              (
                                account.account_number?.length ||
                                0
                              ) - 4
                            )
                          )}

                          {account.account_number?.slice(-4)}

                        </td>


                        {/* ACCOUNT TYPE */}

                        <td className="p-4">
                          {account.account_type}
                        </td>


                        {/* BALANCE */}

                        <td className="p-4 font-semibold text-green-600">

                          ₹
                          {Number(
                            account.balance || 0
                          ).toFixed(2)}

                        </td>


                        {/* ACTION */}

                        <td className="p-4">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(account)
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                              Edit
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(account)
                              }
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* ==========================================
          CUSTOM DELETE CONFIRMATION MODAL
      ========================================== */}

      {deleteAccountId !== null && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">

            {/* MODAL HEADER */}

            <div className="p-6 border-b">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">

                  <span className="text-red-600 text-xl">
                    !
                  </span>

                </div>

                <div>

                  <h3 className="text-xl font-bold text-gray-800">
                    Delete Bank Account
                  </h3>

                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>

                </div>

              </div>

            </div>


            {/* MODAL CONTENT */}

            <div className="p-6">

              <p className="text-gray-700">

                Are you sure you want to delete{" "}

                <span className="font-semibold text-gray-900">
                  {deleteAccountName}
                </span>

                ?

              </p>

              <p className="text-sm text-gray-500 mt-3">

                Any income, expense, or other records linked
                to this account must remain valid.

              </p>

            </div>


            {/* MODAL BUTTONS */}

            <div className="p-6 pt-0 flex justify-end gap-3">

              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >

                {deleting
                  ? "Deleting..."
                  : "Delete Account"}

              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );
}