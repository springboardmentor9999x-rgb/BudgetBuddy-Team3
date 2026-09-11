export default function IncomeForm({
  form,
  setForm,
  onSubmit,
  editing,
  onCancel,
  loading,
  bankAccounts,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-5">
        {editing ? "Edit Income" : "Add Income"}
      </h2>

      <form onSubmit={onSubmit} className="grid gap-4">

        {/* INCOME SOURCE */}

        <input
          type="text"
          placeholder="Income Source"
          value={form.source}
          onChange={(e) =>
            setForm({
              ...form,
              source: e.target.value,
            })
          }
          className="border rounded-lg p-3"
          required
        />

        {/* AMOUNT */}

        <input
          type="number"
          placeholder="Amount"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(e) =>
            setForm({
              ...form,
              amount: e.target.value,
            })
          }
          className="border rounded-lg p-3"
          required
        />

        {/* BANK ACCOUNT */}

        <select
          value={form.bank_account_id}
          onChange={(e) =>
            setForm({
              ...form,
              bank_account_id: e.target.value,
            })
          }
          className="border rounded-lg p-3 bg-white"
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
              {account.bank_name} -{" "}
              {account.account_type}{" "}
              {account.account_number
                ? `****${account.account_number.slice(-4)}`
                : ""}{" "}
              - ₹
              {Number(account.balance || 0).toFixed(2)}
            </option>
          ))}
        </select>

        {/* NO BANK ACCOUNT */}

        {bankAccounts.length === 0 && (
          <p className="text-red-500 text-sm">
            No bank account available. Please add a
            bank account first.
          </p>
        )}

        {/* NOTES */}

        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
          className="border rounded-lg p-3"
        />

        {/* BUTTONS */}

        <div className="flex gap-3">

          <button
            type="submit"
            disabled={
              loading || bankAccounts.length === 0
            }
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg"
          >
            {loading
              ? "Saving..."
              : editing
              ? "Update Income"
              : "Add Income"}
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