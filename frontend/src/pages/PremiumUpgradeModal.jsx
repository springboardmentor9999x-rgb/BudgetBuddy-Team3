import { useState } from "react";
import { requestPremium } from "../api/billing";

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleRequest = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await requestPremium();

      setMessage(
        "Premium request sent successfully. The Admin will review your request."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              Explore Premium
            </h2>

            <p className="text-gray-500 mt-1">
              Unlock advanced BudgetBuddy analytics.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 text-xl"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div>✓ 6/12-month analytics</div>
          <div>✓ Custom date ranges</div>
          <div>✓ Month comparison</div>
          <div>✓ Category trends</div>
          <div>✓ Savings contribution trends</div>
          <div>✓ PDF and Excel export</div>
          <div>✓ Advanced insights</div>
        </div>

        {message && (
          <div className="mt-5 p-3 rounded-lg bg-green-50 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 p-3 rounded-lg bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {!message && (
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 text-white py-3 disabled:opacity-50"
            >
              {loading
                ? "Sending Request..."
                : "Request Premium"}
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-lg border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}