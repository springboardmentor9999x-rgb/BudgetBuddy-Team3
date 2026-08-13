export default function BankAccountForm({
  form,
  setForm,
  onSubmit,
  editing,
  onCancel,
  loading,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">

      <h2 className="text-2xl font-bold mb-6">
        {editing ? "Edit Bank Account" : "Add Bank Account"}
      </h2>

      <form onSubmit={onSubmit} className="grid gap-4">

        {/* BANK NAME */}

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Bank Name
          </label>

          <input
            type="text"
            placeholder="Example: SBI"
            value={form.bank_name}
            onChange={(e) =>
              setForm({
                ...form,
                bank_name: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
            required
          />
        </div>

        {/* ACCOUNT NUMBER */}

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Account Number
          </label>

          <input
            type="text"
            placeholder="Enter account number"
            value={form.account_number}
            onChange={(e) =>
              setForm({
                ...form,
                account_number: e.target.value.replace(/\D/g, ""),
              })
            }
            className="w-full border rounded-lg p-3"
            maxLength="18"
            required
          />

          <p className="text-sm text-gray-500 mt-1">
            Each bank account number can only be added once.
          </p>
        </div>

        {/* ACCOUNT TYPE */}

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Account Type
          </label>

          <select
            value={form.account_type}
            onChange={(e) =>
              setForm({
                ...form,
                account_type: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
            required
          >
            <option value="">Select account type</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
            <option value="Salary">Salary</option>
            <option value="Fixed Deposit">Fixed Deposit</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* BALANCE */}

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Initial Balance
          </label>

          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={form.balance}
            onChange={(e) =>
              setForm({
                ...form,
                balance: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
            required
          />
        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 mt-2">

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : editing
              ? "Update Account"
              : "Add Account"}
          </button>

          {editing && (
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