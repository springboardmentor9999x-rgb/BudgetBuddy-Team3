import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeToSavingsGoal,
} from "../api/savingsgoals";

import { getBankAccounts } from "../api/bankAccounts";

import SavingsGoalForm from "../components/savingsgoal/SavingsGoalForm";
import SavingsGoalList from "../components/savingsgoal/SavingsGoalList";


export default function SavingsGoals() {

  // ======================================================
  // SAVINGS GOALS
  // ======================================================

  const [goals, setGoals] = useState([]);

  const [editingGoal, setEditingGoal] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);


  // ======================================================
  // BANK ACCOUNTS
  // ======================================================

  const [bankAccounts, setBankAccounts] =
    useState([]);


  // ======================================================
  // CONTRIBUTION MODAL
  // ======================================================

  const [contributingGoal, setContributingGoal] =
    useState(null);

  const [contributionAmount, setContributionAmount] =
    useState("");

  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState("");

  const [contributionLoading, setContributionLoading] =
    useState(false);


  // ======================================================
  // DELETE MODAL
  // ======================================================

  const [deletingGoal, setDeletingGoal] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);


  // ======================================================
  // FETCH SAVINGS GOALS
  // ======================================================

  const fetchGoals = async () => {

    try {

      const data = await getSavingsGoals();

      setGoals(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Fetch savings goals error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to load savings goals"
      );
    }
  };


  // ======================================================
  // FETCH BANK ACCOUNTS
  // ======================================================

  const fetchBankAccounts = async () => {

    try {

      const data = await getBankAccounts();

      setBankAccounts(
        Array.isArray(data)
          ? data
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
    }
  };


  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {

    fetchGoals();
    fetchBankAccounts();

  }, []);


  // ======================================================
  // CREATE / UPDATE GOAL
  // ======================================================

  const handleSubmit = async (data) => {

    setLoading(true);

    try {

      if (editingGoal) {

        await updateSavingsGoal(
          editingGoal.id,
          data
        );

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
      await fetchBankAccounts();

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


  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit = (goal) => {

    setEditingGoal(goal);
    setShowForm(true);
  };


  // ======================================================
  // OPEN DELETE CONFIRMATION
  // ======================================================

  const handleDelete = (goal) => {

    setDeletingGoal(goal);
  };


  // ======================================================
  // CANCEL DELETE
  // ======================================================

  const handleCancelDelete = () => {

    if (deleteLoading) {
      return;
    }

    setDeletingGoal(null);
  };


  // ======================================================
  // CONFIRM DELETE
  // ======================================================

  const handleConfirmDelete = async () => {

    if (!deletingGoal) {
      return;
    }

    setDeleteLoading(true);

    try {

      await deleteSavingsGoal(
        deletingGoal.id
      );

      toast.success(
        "Savings goal deleted successfully"
      );

      setDeletingGoal(null);

      await fetchGoals();
      await fetchBankAccounts();

    } catch (error) {

      console.error(
        "Delete savings goal error:",
        error
      );

      toast.error(
        error.response?.data?.detail ||
        "Failed to delete savings goal"
      );

    } finally {

      setDeleteLoading(false);
    }
  };


  // ======================================================
  // OPEN CONTRIBUTION MODAL
  // ======================================================

  const handleContribute = (goal) => {

    setContributingGoal(goal);

    setContributionAmount("");

    // ----------------------------------------------------
    // If goal already has a bank account, select it.
    // Otherwise select the first available account.
    // ----------------------------------------------------

    if (goal.bank_account_id) {

      setSelectedBankAccountId(
        String(goal.bank_account_id)
      );

    } else if (bankAccounts.length > 0) {

      setSelectedBankAccountId(
        String(bankAccounts[0].id)
      );

    } else {

      setSelectedBankAccountId("");
    }
  };


  // ======================================================
  // CLOSE CONTRIBUTION MODAL
  // ======================================================

  const handleCloseContribution = () => {

    if (contributionLoading) {
      return;
    }

    setContributingGoal(null);

    setContributionAmount("");

    setSelectedBankAccountId("");
  };


  // ======================================================
  // SUBMIT CONTRIBUTION
  // ======================================================

  const handleContributionSubmit = async (e) => {

    e.preventDefault();

    if (!contributingGoal) {
      return;
    }


    // ====================================================
    // VALIDATE BANK ACCOUNT
    // ====================================================

    if (!selectedBankAccountId) {

      toast.error(
        "Please select a bank account."
      );

      return;
    }


    // ====================================================
    // CONVERT BANK ACCOUNT ID TO NUMBER
    // ====================================================

    const bankAccountId = Number(
      selectedBankAccountId
    );


    if (
      !Number.isInteger(bankAccountId) ||
      bankAccountId <= 0
    ) {

      toast.error(
        "Please select a valid bank account."
      );

      return;
    }


    // ====================================================
    // VALIDATE AMOUNT
    // ====================================================

    const amount = Number(
      contributionAmount
    );


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      toast.error(
        "Enter a valid contribution amount."
      );

      return;
    }


    // ====================================================
    // CURRENT / TARGET
    // ====================================================

    const currentAmount = Number(
      contributingGoal.current_amount || 0
    );

    const targetAmount = Number(
      contributingGoal.target_amount || 0
    );


    const remaining =
      targetAmount - currentAmount;


    // ====================================================
    // PREVENT OVER-CONTRIBUTION
    // ====================================================

    if (amount > remaining) {

      toast.error(
        `You only need ₹${remaining.toFixed(
          2
        )} to complete this goal.`
      );

      return;
    }


    // ====================================================
    // START LOADING
    // ====================================================

    setContributionLoading(true);


    try {

      // ==================================================
      // IMPORTANT
      // SEND BOTH:
      //
      // amount
      // bank_account_id
      //
      // This must match the backend schema.
      // ==================================================

      console.log(
        "Contribution request:",
        {
          goal_id: contributingGoal.id,
          amount: amount,
          bank_account_id: bankAccountId,
        }
      );


      const updatedGoal =
        await contributeToSavingsGoal(
          contributingGoal.id,
          amount,
          bankAccountId
        );


      // ==================================================
      // CALCULATE PROGRESS
      // ==================================================

      const progress =
        targetAmount > 0
          ? (
              Number(
                updatedGoal.current_amount
              ) /
              Number(
                updatedGoal.target_amount
              )
            ) * 100
          : 0;


      // ==================================================
      // SUCCESS MESSAGE
      // ==================================================

      if (progress >= 100) {

        toast.success(
          "🎉 Savings goal completed!"
        );

      } else if (progress >= 70) {

        toast.success(
          "Great progress! You've reached 70% of your goal."
        );

      } else {

        toast.success(
          "Contribution added successfully."
        );
      }


      // ==================================================
      // CLOSE MODAL
      // ==================================================

      setContributingGoal(null);

      setContributionAmount("");

      setSelectedBankAccountId("");


      // ==================================================
      // REFRESH DATA
      // ==================================================

      await fetchGoals();

      await fetchBankAccounts();


    } catch (error) {

      console.error(
        "Contribution error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );


      toast.error(
        error.response?.data?.detail ||
        "Failed to add contribution."
      );

    } finally {

      setContributionLoading(false);
    }
  };


  // ======================================================
  // CANCEL FORM
  // ======================================================

  const handleCancel = () => {

    setEditingGoal(null);

    setShowForm(false);
  };


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div className="p-6">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="flex justify-between items-start mb-6">

        <div>

          <p className="text-sm font-semibold text-green-500 uppercase tracking-wide">
            Future Plans
          </p>

          <h1 className="text-3xl font-bold mt-1">
            Savings Goals
          </h1>

          <p className="text-gray-600 mt-1">
            Turn your financial priorities into measurable progress.
          </p>

        </div>


        <button
          onClick={() => {

            setEditingGoal(null);
            setShowForm(true);

          }}
          className="
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-6
            py-3
            rounded-lg
          "
        >
          + Create Savings Goal
        </button>

      </div>


      {/* ==================================================
          CREATE / EDIT FORM
      ================================================== */}

      {showForm && (

        <SavingsGoalForm
          onSubmit={handleSubmit}
          editingGoal={editingGoal}
          onCancel={handleCancel}
          loading={loading}
          bankAccounts={bankAccounts}
        />

      )}


      {/* ==================================================
          GOAL LIST
      ================================================== */}

      <SavingsGoalList
        goals={goals}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onContribute={handleContribute}
      />


      {/* ==================================================
          CONTRIBUTION MODAL
      ================================================== */}

      {contributingGoal && (

        <div
          className="
            fixed
            inset-0
            bg-black/50
            flex
            items-center
            justify-center
            z-50
            p-4
          "
          onClick={handleCloseContribution}
        >

          <div
            className="
              bg-white
              rounded-xl
              shadow-xl
              w-full
              max-w-md
              p-6
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex justify-between items-start mb-5">

              <div>

                <h2 className="text-xl font-bold">
                  Add Contribution
                </h2>

                <p className="text-gray-500 mt-1">
                  {contributingGoal.title}
                </p>

              </div>


              <button
                type="button"
                onClick={handleCloseContribution}
                disabled={contributionLoading}
                className="
                  text-gray-500
                  hover:text-gray-800
                  text-xl
                "
              >
                ×
              </button>

            </div>


            {/* ==================================================
                CURRENT / TARGET / REMAINING
            ================================================== */}

            <div className="bg-gray-50 rounded-lg p-4 mb-5">

              <div className="flex justify-between">

                <span className="text-gray-600">
                  Current
                </span>

                <span className="font-semibold">
                  ₹
                  {Number(
                    contributingGoal.current_amount || 0
                  ).toFixed(2)}
                </span>

              </div>


              <div className="flex justify-between mt-2">

                <span className="text-gray-600">
                  Target
                </span>

                <span className="font-semibold">
                  ₹
                  {Number(
                    contributingGoal.target_amount || 0
                  ).toFixed(2)}
                </span>

              </div>


              <div className="flex justify-between mt-2">

                <span className="text-gray-600">
                  Remaining
                </span>

                <span className="font-semibold text-green-600">

                  ₹
                  {Math.max(
                    Number(
                      contributingGoal.target_amount || 0
                    ) -
                    Number(
                      contributingGoal.current_amount || 0
                    ),
                    0
                  ).toFixed(2)}

                </span>

              </div>

            </div>


            {/* ==================================================
                BANK ACCOUNT SELECTION
            ================================================== */}

            <label className="block text-sm font-medium text-gray-700 mb-2">

              Deduct from bank account

            </label>


            {bankAccounts.length === 0 ? (

              <div
                className="
                  border
                  border-red-300
                  bg-red-50
                  text-red-700
                  rounded-lg
                  p-3
                  mb-5
                "
              >
                No bank accounts available.
                Please add a bank account first.
              </div>

            ) : (

              <select
                value={selectedBankAccountId}
                onChange={(e) =>
                  setSelectedBankAccountId(
                    e.target.value
                  )
                }
                disabled={contributionLoading}
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  mb-5
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
                required
              >

                <option value="">
                  Select bank account
                </option>


                {bankAccounts.map(
                  (account) => (

                    <option
                      key={account.id}
                      value={account.id}
                    >

                      {account.bank_name}
                      {" - "}
                      {account.account_type}
                      {" - "}
                      ****
                      {String(
                        account.account_number || ""
                      ).slice(-4)}

                      {" | Balance: ₹"}
                      {Number(
                        account.balance || 0
                      ).toFixed(2)}

                    </option>

                  )
                )}

              </select>

            )}


            {/* ==================================================
                CONTRIBUTION FORM
            ================================================== */}

            <form
              onSubmit={
                handleContributionSubmit
              }
            >

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Contribution amount

              </label>


              <div className="relative">

                <span
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                >
                  ₹
                </span>


                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(e) =>
                    setContributionAmount(
                      e.target.value
                    )
                  }
                  placeholder="Enter amount"
                  className="
                    w-full
                    border
                    rounded-lg
                    p-3
                    pl-8
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                  autoFocus
                  required
                  disabled={
                    contributionLoading
                  }
                />

              </div>


              <p className="text-xs text-gray-500 mt-2">

                The contribution will be deducted
                from the selected bank account.

              </p>


              {/* ==================================================
                  BUTTONS
              ================================================== */}

              <div className="flex gap-3 mt-6">

                <button
                  type="submit"
                  disabled={
                    contributionLoading ||
                    bankAccounts.length === 0
                  }
                  className="
                    flex-1
                    bg-green-600
                    hover:bg-green-700
                    disabled:bg-gray-400
                    text-white
                    px-4
                    py-3
                    rounded-lg
                  "
                >

                  {contributionLoading
                    ? "Adding..."
                    : "Add Contribution"}

                </button>


                <button
                  type="button"
                  onClick={
                    handleCloseContribution
                  }
                  disabled={
                    contributionLoading
                  }
                  className="
                    bg-gray-500
                    hover:bg-gray-600
                    disabled:bg-gray-400
                    text-white
                    px-4
                    py-3
                    rounded-lg
                  "
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      {deletingGoal && (

        <div
          className="
            fixed
            inset-0
            bg-black/50
            flex
            items-center
            justify-center
            z-50
            p-4
          "
        >

          <div
            className="
              bg-white
              rounded-xl
              shadow-xl
              w-full
              max-w-md
              p-6
            "
          >

            <h2 className="text-xl font-bold text-gray-900">

              Delete Savings Goal?

            </h2>


            <p className="text-gray-600 mt-3">

              Are you sure you want to delete{" "}

              <span className="font-semibold">

                {deletingGoal.title}

              </span>

              ?

            </p>


            <p className="text-sm text-red-600 mt-3">

              Any amount saved in this goal will be
              refunded to its linked bank account.

            </p>


            <div className="flex gap-3 mt-6">

              <button
                type="button"
                onClick={
                  handleConfirmDelete
                }
                disabled={deleteLoading}
                className="
                  flex-1
                  bg-red-600
                  hover:bg-red-700
                  disabled:bg-gray-400
                  text-white
                  px-4
                  py-3
                  rounded-lg
                "
              >

                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}

              </button>


              <button
                type="button"
                onClick={
                  handleCancelDelete
                }
                disabled={deleteLoading}
                className="
                  flex-1
                  bg-gray-500
                  hover:bg-gray-600
                  disabled:bg-gray-400
                  text-white
                  px-4
                  py-3
                  rounded-lg
                "
              >

                Cancel

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}