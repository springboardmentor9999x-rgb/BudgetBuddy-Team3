import { useEffect, useState } from "react";
import { getBankAccounts } from "../../api/bankAccounts";

export default function SavingsGoalForm({
  onSubmit,
  editingGoal,
  onCancel,
  loading,
}) {

  const [form, setForm] = useState({
    title: "",
    target_amount: "",
    target_date: "",
    bank_account_id: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState("");

  // ======================================================
  // LOAD BANK ACCOUNTS
  // ======================================================

  useEffect(() => {

    const loadBankAccounts = async () => {

      try {

        setBankLoading(true);
        setBankError("");

        const data = await getBankAccounts();

        setBankAccounts(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Failed to load bank accounts:",
          error
        );

        setBankError(
          error.response?.data?.detail ||
          "Failed to load bank accounts."
        );

      } finally {

        setBankLoading(false);

      }
    };

    loadBankAccounts();

  }, []);

  // ======================================================
  // LOAD FORM DATA
  // ======================================================

  useEffect(() => {

    if (editingGoal) {

      setForm({
        title: editingGoal.title || "",

        target_amount:
          editingGoal.target_amount || "",

        target_date:
          editingGoal.target_date
            ? String(
                editingGoal.target_date
              ).slice(0, 10)
            : "",

        bank_account_id:
          editingGoal.bank_account_id
            ? String(
                editingGoal.bank_account_id
              )
            : "",
      });

    } else {

      setForm({
        title: "",
        target_amount: "",
        target_date: "",
        bank_account_id: "",
      });

    }

  }, [editingGoal]);

  // ======================================================
  // HANDLE SUBMIT
  // ======================================================

  const handleSubmit = (e) => {

    e.preventDefault();

    const title = form.title.trim();

    const targetAmount = Number(
      form.target_amount
    );

    const bankAccountId = Number(
      form.bank_account_id
    );

    if (!title) {

      alert("Please enter a goal title.");

      return;
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {

      alert(
        "Please enter a valid target amount."
      );

      return;
    }

    if (
      !Number.isInteger(bankAccountId) ||
      bankAccountId <= 0
    ) {

      alert(
        "Please select a bank account."
      );

      return;
    }

    onSubmit({

      title,

      target_amount:
        targetAmount,

      target_date:
        form.target_date || null,

      bank_account_id:
        bankAccountId,

      // Current amount should not be
      // changed manually from this form.
      current_amount:
        editingGoal
          ? Number(
              editingGoal.current_amount || 0
            )
          : 0,

      status:
        editingGoal?.status ||
        "in_progress",
    });
  };

  // ======================================================
  // HANDLE CHANGE
  // ======================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  return (

    <div className="bg-white rounded-xl shadow p-6 mb-6">

      <h2 className="text-xl font-bold mb-1">

        {editingGoal
          ? "Edit Savings Goal"
          : "Create Savings Goal"}

      </h2>

      <p className="text-gray-500 mb-5">

        {editingGoal
          ? "Update your goal details and bank account."
          : "Set a target and choose the bank account you will use for contributions."}

      </p>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4"
      >

        {/* ==================================================
            TITLE
        ================================================== */}

        <input
          type="text"
          name="title"
          placeholder="Goal Title"
          value={form.title}
          onChange={handleChange}
          className="border rounded-lg p-3"
          required
          minLength={2}
          maxLength={100}
        />

        {/* ==================================================
            TARGET AMOUNT
        ================================================== */}

        <input
          type="number"
          name="target_amount"
          min="0.01"
          step="0.01"
          placeholder="Target Amount"
          value={form.target_amount}
          onChange={handleChange}
          className="border rounded-lg p-3"
          required
        />

        {/* ==================================================
            TARGET DATE
        ================================================== */}

        <input
          type="date"
          name="target_date"
          value={form.target_date}
          onChange={handleChange}
          className="border rounded-lg p-3"
        />

        {/* ==================================================
            BANK ACCOUNT
        ================================================== */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-2">

            Bank Account

          </label>

          <select
            name="bank_account_id"
            value={form.bank_account_id}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 bg-white"
            required
            disabled={bankLoading}
          >

            <option value="">

              {bankLoading
                ? "Loading bank accounts..."
                : "Select bank account"}

            </option>

            {bankAccounts.map(
              (account) => (

                <option
                  key={account.id}
                  value={account.id}
                >

                  {account.bank_name}
                  {" • "}
                  {account.account_type}
                  {" • Balance ₹"}
                  {Number(
                    account.balance || 0
                  ).toFixed(2)}

                </option>

              )
            )}

          </select>

          {bankError && (

            <p className="text-sm text-red-600 mt-2">

              {bankError}

            </p>

          )}

          {!bankLoading &&
            bankAccounts.length === 0 &&
            !bankError && (

              <p className="text-sm text-red-600 mt-2">

                Please add a bank account before
                creating a savings goal.

              </p>

            )}

        </div>

        {/* ==================================================
            INFORMATION
        ================================================== */}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">

          <strong>Note:</strong>{" "}

          Creating a savings goal does not deduct
          money from your bank account.

          Money will be deducted only when you use
          the <strong>Contribute</strong> button.

        </div>

        {/* ==================================================
            BUTTONS
        ================================================== */}

        <div className="flex gap-3">

          <button
            type="submit"
            disabled={
              loading ||
              bankLoading ||
              bankAccounts.length === 0
            }
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
              : "Create Goal"}

          </button>

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

        </div>

      </form>

    </div>
  );
}