import { useState } from "react";

import { requestPremium } from "../api/billing";


/* =========================================================
   PREMIUM FEATURES
========================================================= */

const PREMIUM_FEATURES = [
  "Historical trends",
  "6 & 12 month analytics",
  "Custom date ranges",
  "Month comparison",
  "Savings analytics",
  "PDF export",
  "Excel export",
  "Advanced insights",
];


/* =========================================================
   CHECK ICON
========================================================= */

function CheckIcon() {

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="flex-shrink-0"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="#6c4ee6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

}


/* =========================================================
   PREMIUM UPGRADE MODAL

   props:
     isOpen  -> whether the modal is visible
     onClose -> called to dismiss the modal

   IMPORTANT:
     A Basic User only REQUESTS Premium here.

     This does NOT activate Premium immediately.

     Flow:
       Basic User
           ↓
       Request Premium
           ↓
       Admin Notification
           ↓
       Admin approves from User Management
           ↓
       User becomes Premium
           ↓
       1-month free Premium starts
========================================================= */

function PremiumUpgradeModal({
  isOpen,
  onClose,
}) {

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  if (!isOpen) {

    return null;

  }


  /* =======================================================
     REQUEST PREMIUM ACCESS
  ======================================================= */

  const handleRequestPremium = async () => {

    if (submitting || submitted) {

      return;

    }

    try {

      setSubmitting(true);
      setError("");

      await requestPremium();

      /*
       * IMPORTANT:
       * requestPremium() only sends the request to Admin.
       *
       * It does NOT change the user's role.
       * The user remains Basic until Admin approves.
       */

      setSubmitted(true);

    } catch (err) {

      console.error(
        "Failed to request premium access:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to submit your Premium request right now. Please try again."
      );

    } finally {

      setSubmitting(false);

    }

  };


  /* =======================================================
     CLOSE
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
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="px-6 pt-6 pb-5"
          style={{
            background:
              "linear-gradient(135deg, #6c4ee6, #7e6aeb)",
          }}
        >

          <div className="flex items-start justify-between">

            <div
              className="
                w-11 h-11
                rounded-xl
                bg-white
                bg-opacity-15
                flex items-center justify-center
                text-white
              "
            >

              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >

                <path
                  d="M12 3l1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

              </svg>

            </div>


            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="
                text-white
                text-opacity-80
                hover:text-opacity-100
                disabled:opacity-40
                text-xl
                leading-none
              "
              aria-label="Close"
            >
              &times;
            </button>

          </div>


          <h2 className="text-white text-lg font-bold mt-3">
            Upgrade to Premium
          </h2>


          <p className="text-white text-opacity-90 text-sm mt-1">
            Unlock deeper financial insights and take full
            control of your money.
          </p>


          <div
            className="
              inline-flex
              items-center
              gap-1.5
              mt-3
              px-3
              py-1.5
              rounded-full
              bg-white
              text-xs
              font-bold
            "
            style={{ color: "#6c4ee6" }}
          >
            1 Month FREE for new users
          </div>

        </div>


        {/* =================================================
            FEATURE LIST
        ================================================= */}

        <div className="px-6 py-5">

          <ul className="grid grid-cols-2 gap-y-2.5 gap-x-3">

            {PREMIUM_FEATURES.map((feature) => (

              <li
                key={feature}
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-gray-700
                "
              >

                <CheckIcon />

                <span>
                  {feature}
                </span>

              </li>

            ))}

          </ul>


          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {submitted && (

            <div
              className="
                mt-4
                px-3
                py-3
                rounded-lg
                bg-green-50
                border
                border-green-200
                text-sm
                text-green-700
              "
            >

              <div className="font-semibold">
                Premium request submitted!
              </div>

              <div className="mt-1 text-xs text-green-600">
                Your request has been sent to the Admin.
                Premium access will be activated after
                Admin approval.
              </div>

            </div>

          )}


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

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
              ACTION
          ================================================= */}

          {!submitted ? (

            <button
              type="button"
              onClick={handleRequestPremium}
              disabled={submitting}
              className="
                w-full
                mt-5
                py-3
                rounded-xl
                text-white
                text-sm
                font-bold
                disabled:opacity-60
              "
              style={{
                background:
                  "linear-gradient(135deg, #6c4ee6, #7e6aeb)",
              }}
            >

              {submitting
                ? "Submitting Request..."
                : "Request Premium"}

            </button>

          ) : (

            <button
              type="button"
              onClick={handleClose}
              className="
                w-full
                mt-5
                py-3
                rounded-xl
                text-white
                text-sm
                font-bold
              "
              style={{
                background:
                  "linear-gradient(135deg, #6c4ee6, #7e6aeb)",
              }}
            >
              Close
            </button>

          )}


          <p className="text-center text-xs text-gray-400 mt-3">

            1 month free after Admin approval.
            No payment required.

          </p>

        </div>

      </div>

    </div>

  );

}


export default PremiumUpgradeModal;