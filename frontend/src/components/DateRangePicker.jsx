import React from "react";
import { Calendar } from "lucide-react";

export default function DateRangePicker({ startDate, endDate, onChange, disabled }) {
  const handleStart = (e) => {
    onChange({ startDate: e.target.value, endDate });
  };

  const handleEnd = (e) => {
    onChange({ startDate, endDate: e.target.value });
  };

  const handleReset = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    onChange({ startDate: firstDay, endDate: lastDay });
  };

  return (
    <div className="date-range-picker">
      <div className="date-range-label">
        <Calendar size={15} />
        <span>Custom Date Range</span>
      </div>
      <div className="date-range-inputs">
        <div className="date-input-group">
          <label htmlFor="analytics-start-date">From</label>
          <input
            id="analytics-start-date"
            type="date"
            value={startDate || ""}
            onChange={handleStart}
            disabled={disabled}
            className="date-input"
            max={endDate || undefined}
          />
        </div>
        <span className="date-range-sep">→</span>
        <div className="date-input-group">
          <label htmlFor="analytics-end-date">To</label>
          <input
            id="analytics-end-date"
            type="date"
            value={endDate || ""}
            onChange={handleEnd}
            disabled={disabled}
            className="date-input"
            min={startDate || undefined}
          />
        </div>
        <button
          className="date-reset-btn"
          onClick={handleReset}
          disabled={disabled}
          title="Reset to current month"
        >
          Current Month
        </button>
      </div>
    </div>
  );
}
