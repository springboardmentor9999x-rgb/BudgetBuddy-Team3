import { useState } from "react";

import { cancelPremiumTrial } from "../api/billing";


/* =========================================================
   CANCEL PREMIUM MODAL

   props:
     isOpen      -> whether the modal is visible
     onClose     -> called to dismiss the modal
     onCancelled -> called once cancellation has successfully
                    been scheduled on the backend. Premium
                    access is NOT revoked yet — it continues
                    until the current trial/period ends. The
                    parent is responsible for refreshing auth
                    state.
========================================================= */

function CancelPremiumModal({
  isOpen,
  onClose,
  onCancelled,
  premiumEndDateLabel,
}) {

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  if (!isOpen) {

    return null;

  }


  /* =======================================================
     CONFIRM CANCELLATION
  ======================================================= */

  const handleConfirm = async () => {

    if (submitting) {

      return;

    }

    try {

      setSubmitting(true);
      setError("");

      await cancelPremiumTrial();

      if (onCancelled) {

        await onCancelled();

      }

    } catch (err) {

      console.error(
        "Failed to cancel premium:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to cancel your premium plan right now. Please try again."
      );

    } finally {

      setSubmitting(false);

    }

  };


  /* =======================================================
     CLOSE (BLOCKED WHILE SUBMITTING)
  ======================================================= */

  const handleClose = () => {

    if (submitting) {

      return;

    }

    onClose();

  };


  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black
        bg-opacity-50
        px-4
      "
      onClick={handleClose}
    >

      <div
        className="
          w-full
          max-w-md
          bg-white
          rounded-2xl
          shadow-2xl
          p-6
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start gap-4">

          <div
            className="
              flex-shrink-0
              w-11 h-11
              rounded-full
              bg-amber-100
              text-amber-600
              flex items-center justify-center
              text-xl
            "
          >
            !
          </div>

          <div>

            <h2 className="text-lg font-bold text-gray-800">
              Cancel Premium?
            </h2>

            <p className="text-sm text-gray-600 mt-1">
              You'll keep full premium access until your current
              trial ends{
                premiumEndDateLabel
                  ? ` on ${premiumEndDateLabel}`
                  : ""
              }. You can reactivate any time before then.
            </p>

          </div>

        </div>


        {/* =================================================
            WHAT HAPPENS NEXT
        ================================================= */}

        <div
          className="
            mt-4
            bg-amber-50
            border
            border-amber-200
            rounded-lg
            p-4
          "
        >

          <p className="text-sm text-amber-800 font-medium mb-1.5">
            What happens when you cancel:
          </p>

          <ul className="text-sm text-amber-700 list-disc list-inside space-y-0.5">
            <li>
              Premium access continues until{" "}
              {premiumEndDateLabel || "your trial end date"}
            </li>
            <li>Your plan will not renew after that date</li>
            <li>You won't be charged</li>
            <li>You can reactivate any time before it ends</li>
          </ul>

        </div>


        {error && (

          <div
            className="
              mt-4
              px-3
              py-2.5
              rounded-lg
              bg-red-50
              border
              border-red-200
              text-sm
              text-red-700
            "
          >
            {error}
          </div>

        )}


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="flex gap-3 mt-6">

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="
              flex-1
              px-5
              py-2.5
              rounded-lg
              bg-gray-200
              hover:bg-gray-300
              disabled:bg-gray-100
              text-gray-700
              font-medium
            "
          >
            Keep Premium
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="
              flex-1
              px-5
              py-2.5
              rounded-lg
              bg-red-600
              hover:bg-red-700
              disabled:bg-red-300
              text-white
              font-medium
            "
          >
            {submitting
              ? "Scheduling..."
              : "Cancel Premium"}
          </button>

        </div>

      </div>

    </div>

  );

}

export default CancelPremiumModal;