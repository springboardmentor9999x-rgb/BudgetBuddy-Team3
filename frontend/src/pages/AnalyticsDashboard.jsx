import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  getSpendingByCategory,
  getMonthlyTrend,
  getSavingsProgress,
  getAnalyticsSummary,
} from "../api/analytics";

import {
  downloadMonthlyPDF,
  downloadMonthlyExcel,
} from "../api/reports";

import SpendingPieChart from "../components/SpendingPieChart";
import MonthlyTrendLineChart from "../components/MonthlyTrendLineChart";
import SavingsProgressBar from "../components/SavingsProgressBar";
import PremiumUpgradeModal from "../components/PremiumUpgradeModal";
import CancelPremiumModal from "../components/CancelPremiumModal";
import { reactivatePremiumTrial } from "../api/billing";

import { useAuth } from "../context/AuthContext";

import "./AnalyticsDashboard.css";


/* =========================================================
   CONSTANTS
========================================================= */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TREND_RANGES = {
  CURRENT_MONTH: "current_month",
  SIX_MONTHS: "6_months",
  TWELVE_MONTHS: "12_months",
  CUSTOM: "custom",
};


/* =========================================================
   HELPERS
========================================================= */

const formatDateForInput = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const formatCurrency = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};


const calculatePercentageChange = (
  current,
  previous
) => {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0) {
    if (currentValue === 0) {
      return 0;
    }

    return null;
  }

  return (
    ((currentValue - previousValue) /
      previousValue) *
    100
  );
};


const getChangeText = (
  percentageChange,
  currentValue
) => {
  if (percentageChange === null) {
    return Number(currentValue || 0) > 0
      ? "New"
      : "No change";
  }

  if (percentageChange === 0) {
    return "No change";
  }

  return percentageChange > 0
    ? `↑ ${Math.abs(percentageChange).toFixed(1)}%`
    : `↓ ${Math.abs(percentageChange).toFixed(1)}%`;
};


/* =========================================================
   ICONS
========================================================= */

const Icon = ({
  type,
  size = 20,
}) => {
  const icons = {
    income: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 19V5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6 11l6-6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    expense: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 5v14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6 13l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    balance: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),

    savings: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 18V9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 18V5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16 18v-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M22 18V3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),

    calendar: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M16 3v4M8 3v4M3 10h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),

    trend: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 17l5-5 4 3 7-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 7h5v5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    target: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="1"
          fill="currentColor"
        />
      </svg>
    ),

    download: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 4v11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M7 11l5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 20h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),

    shield: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 3l8 3v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6l8-3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),

    spark: (
      <svg
        width={size}
        height={size}
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
    ),
  };

  return icons[type] || null;
};


/* =========================================================
   INCOME VS EXPENSE CHART
========================================================= */

function IncomeExpenseChart({
  income,
  expenses,
}) {
  const data = [
    {
      name: "Income",
      value: Number(income || 0),
    },
    {
      name: "Expenses",
      value: Number(expenses || 0),
    },
  ];

  const hasData = data.some(
    (item) => item.value > 0
  );

  if (!hasData) {
    return (
      <div className="analytics-empty-chart">
        <div className="analytics-empty-icon">
          <Icon type="trend" size={24} />
        </div>

        <h4>No financial data</h4>

        <p>
          Add income or expenses to see
          your financial comparison.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    const item = payload[0];

    return (
      <div className="analytics-tooltip">
        <span>
          {item.payload.name}
        </span>

        <strong>
          {formatCurrency(item.value)}
        </strong>
      </div>
    );
  };

  return (
    <div className="analytics-bar-chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 5,
            bottom: 10,
          }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#e9edf3"
          />

          <XAxis
            dataKey="name"
            tick={{
              fill: "#667085",
              fontSize: 11,
              fontWeight: 600,
            }}
            axisLine={{
              stroke: "#e4e7ec",
            }}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: "#98a2b3",
              fontSize: 10,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              `₹${Number(
                value
              ).toLocaleString("en-IN")}`
            }
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: "#f7f8fa",
            }}
          />

          <Bar
            dataKey="value"
            name=""
            fill="#6c4ee6"
            radius={[
              8,
              8,
              0,
              0,
            ]}
            maxBarSize={80}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


/* =========================================================
   MONTH COMPARISON CHART
========================================================= */

function MonthComparisonChart({
  currentMonthName,
  previousMonthName,
  currentIncome,
  previousIncome,
  currentExpenses,
  previousExpenses,
}) {
  const data = [
    {
      name: previousMonthName,
      income: Number(
        previousIncome || 0
      ),
      expenses: Number(
        previousExpenses || 0
      ),
    },
    {
      name: currentMonthName,
      income: Number(
        currentIncome || 0
      ),
      expenses: Number(
        currentExpenses || 0
      ),
    },
  ];

  const hasData = data.some(
    (item) =>
      item.income > 0 ||
      item.expenses > 0
  );

  if (!hasData) {
    return (
      <div className="analytics-empty-chart compact">
        <div className="analytics-empty-icon">
          <Icon type="trend" size={22} />
        </div>

        <h4>No comparison data</h4>

        <p>
          Add transactions to compare
          monthly performance.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    return (
      <div className="analytics-tooltip comparison-tooltip">
        <strong>{label}</strong>

        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="comparison-tooltip-row"
          >
            <span>{item.name}</span>

            <strong>
              {formatCurrency(
                item.value
              )}
            </strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="comparison-chart">
      <ResponsiveContainer
        width="100%"
        height={270}
      >
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 15,
            left: 0,
            bottom: 15,
          }}
          barCategoryGap="25%"
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#e9edf3"
          />

          <XAxis
            dataKey="name"
            tick={{
              fill: "#667085",
              fontSize: 11,
              fontWeight: 600,
            }}
            axisLine={{
              stroke: "#e4e7ec",
            }}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: "#98a2b3",
              fontSize: 10,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              `₹${Number(
                value
              ).toLocaleString("en-IN")}`
            }
          />

          <Tooltip
            content={<CustomTooltip />}
          />

          <Legend
            verticalAlign="bottom"
            height={30}
            iconType="circle"
            wrapperStyle={{
              fontSize: "11px",
              color: "#667085",
            }}
          />

          <Bar
            dataKey="income"
            name="Income"
            fill="#22a06b"
            radius={[
              7,
              7,
              0,
              0,
            ]}
            maxBarSize={48}
          />

          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#e85d5d"
            radius={[
              7,
              7,
              0,
              0,
            ]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


/* =========================================================
   MAIN DASHBOARD
========================================================= */

function AnalyticsDashboard() {

  const {
    user,
    loading: authLoading,
    refreshUser,
  } = useAuth();


  /* =======================================================
     ROLE
  ======================================================= */

  const userRole = String(
    user?.role || "user"
  )
    .trim()
    .toLowerCase();

  const isAdmin =
    userRole === "admin";

  const isPremium =
    userRole === "premium";

  const hasPremiumAnalytics =
    isPremium || isAdmin;

  const isCancellationScheduled =
    isPremium &&
    Boolean(user?.cancellation_requested);

  const premiumEndDateLabel = (() => {

    if (!user?.premium_expires_at) {

      return "";

    }

    const expiresAt = new Date(
      user.premium_expires_at
    );

    if (Number.isNaN(expiresAt.getTime())) {

      return "";

    }

    return expiresAt.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  })();


  /* =======================================================
     DATE
  ======================================================= */

  const currentDate =
    useMemo(
      () => new Date(),
      []
    );

  const currentMonth =
    currentDate.getMonth() + 1;

  const currentYear =
    currentDate.getFullYear();

  const todayInputValue =
    formatDateForInput(
      currentDate
    );


  /* =======================================================
     PERIOD
  ======================================================= */

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(currentMonth);

  const [
    selectedYear,
    setSelectedYear,
  ] = useState(currentYear);


  /* =======================================================
     TREND RANGE
  ======================================================= */

  const [
    trendRange,
    setTrendRange,
  ] = useState(
    TREND_RANGES.CURRENT_MONTH
  );


  /* =======================================================
     CUSTOM DATES
  ======================================================= */

  const [
    customStartDate,
    setCustomStartDate,
  ] = useState("");

  const [
    customEndDate,
    setCustomEndDate,
  ] = useState("");


  /* =======================================================
     DATA
  ======================================================= */

  const [
    spendingData,
    setSpendingData,
  ] = useState([]);

  const [
    monthlyData,
    setMonthlyData,
  ] = useState([]);

  const [
    savingsData,
    setSavingsData,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState(null);

  const [
    comparisonData,
    setComparisonData,
  ] = useState([]);


  /* =======================================================
     UI
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    exportLoading,
    setExportLoading,
  ] = useState("");

  const [
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
  ] = useState(false);

  const [
    isCancelModalOpen,
    setIsCancelModalOpen,
  ] = useState(false);

  const [
    reactivatingPremium,
    setReactivatingPremium,
  ] = useState(false);

  const [
    upgradeSuccessMessage,
    setUpgradeSuccessMessage,
  ] = useState("");


  /* =======================================================
     PERIOD VALUES
  ======================================================= */

  const selectedMonthName =
    MONTH_NAMES[
      selectedMonth - 1
    ] ||
    MONTH_NAMES[
      currentMonth - 1
    ];


  const selectedPeriodValue =
    `${selectedYear}-${String(
      selectedMonth
    ).padStart(2, "0")}`;


  /* =======================================================
     PREVIOUS MONTH
  ======================================================= */

  const previousMonthDate =
    useMemo(
      () =>
        new Date(
          selectedYear,
          selectedMonth - 2,
          1
        ),
      [
        selectedYear,
        selectedMonth,
      ]
    );

  const previousMonth =
    previousMonthDate.getMonth() + 1;

  const previousMonthYear =
    previousMonthDate.getFullYear();

  const previousMonthName =
    MONTH_NAMES[
      previousMonth - 1
    ];

  const previousMonthPeriodValue =
    `${previousMonthYear}-${String(
      previousMonth
    ).padStart(2, "0")}`;


  /* =======================================================
     MONTH OPTIONS
  ======================================================= */

  const monthOptions =
    useMemo(() => {

      const options = [];

      const startDate =
        new Date(
          currentYear,
          currentMonth - 1,
          1
        );

      for (
        let i = 0;
        i < 12;
        i++
      ) {

        const optionDate =
          new Date(
            startDate.getFullYear(),
            startDate.getMonth() - i,
            1
          );

        const year =
          optionDate.getFullYear();

        const month =
          optionDate.getMonth() + 1;

        const value =
          `${year}-${String(
            month
          ).padStart(2, "0")}`;

        options.push({
          value,
          label:
            `${MONTH_NAMES[
              month - 1
            ]} ${year}`,
          year,
          month,
        });
      }

      return options;

    }, [
      currentMonth,
      currentYear,
    ]);


  /* =======================================================
     LOAD ANALYTICS
  ======================================================= */

  const loadAnalytics =
    async (
      month,
      year,
      range =
        TREND_RANGES.CURRENT_MONTH,
      startDate = "",
      endDate = ""
    ) => {

      try {

        setLoading(true);
        setError("");


        /* -----------------------------------------------
           BASIC DATA
        ----------------------------------------------- */

        const basicRequests = [
          getSpendingByCategory(
            month,
            year
          ),

          getAnalyticsSummary(
            month,
            year
          ),
        ];


        /* -----------------------------------------------
           PREMIUM DATA
        ----------------------------------------------- */

        if (hasPremiumAnalytics) {

          basicRequests.push(
            getSavingsProgress(
              month,
              year
            )
          );

        }


        const basicResults =
          await Promise.all(
            basicRequests
          );


        const spending =
          basicResults[0];

        const summaryData =
          basicResults[1];

        const savings =
          hasPremiumAnalytics
            ? basicResults[2]
            : [];


        /* -----------------------------------------------
           TREND
        ----------------------------------------------- */

        let trendData = [];


        if (
          hasPremiumAnalytics &&
          range ===
            TREND_RANGES.CURRENT_MONTH
        ) {

          trendData =
            await getMonthlyTrend({
              mode: "daily",
              month,
              year,
            });

        } else if (
          hasPremiumAnalytics &&
          range ===
            TREND_RANGES.SIX_MONTHS
        ) {

          trendData =
            await getMonthlyTrend({
              mode: "monthly",
              months: 6,
              month,
              year,
            });

        } else if (
          hasPremiumAnalytics &&
          range ===
            TREND_RANGES.TWELVE_MONTHS
        ) {

          trendData =
            await getMonthlyTrend({
              mode: "monthly",
              months: 12,
              month,
              year,
            });

        } else if (
          hasPremiumAnalytics &&
          range ===
            TREND_RANGES.CUSTOM &&
          startDate &&
          endDate
        ) {

          trendData =
            await getMonthlyTrend({
              mode: "daily",
              start_date:
                startDate,
              end_date:
                endDate,
            });

        }


        /* -----------------------------------------------
           MONTH COMPARISON
        ----------------------------------------------- */

        let comparisonTrend = [];

        if (hasPremiumAnalytics) {

          try {

            comparisonTrend =
              await getMonthlyTrend({
                mode: "monthly",
                months: 2,
                month,
                year,
              });

          } catch (
            comparisonError
          ) {

            console.error(
              "Failed to load month comparison:",
              comparisonError
            );

            comparisonTrend = [];

          }
        }


        /* -----------------------------------------------
           STATE
        ----------------------------------------------- */

        setSpendingData(
          Array.isArray(spending)
            ? spending
            : []
        );

        setSavingsData(
          hasPremiumAnalytics &&
          Array.isArray(savings)
            ? savings
            : []
        );

        setSummary(
          summaryData || null
        );

        setMonthlyData(
          Array.isArray(trendData)
            ? trendData
            : []
        );

        setComparisonData(
          Array.isArray(
            comparisonTrend
          )
            ? comparisonTrend
            : []
        );

      } catch (
        analyticsError
      ) {

        console.error(
          "Failed to load analytics:",
          analyticsError
        );

        setSpendingData([]);
        setSavingsData([]);
        setSummary(null);
        setMonthlyData([]);
        setComparisonData([]);

        setError(
          "Unable to load analytics for the selected period. Please try again."
        );

      } finally {

        setLoading(false);

      }
    };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    if (
      authLoading ||
      !user
    ) {
      return;
    }

    setSelectedMonth(
      currentMonth
    );

    setSelectedYear(
      currentYear
    );

    setTrendRange(
      TREND_RANGES.CURRENT_MONTH
    );

    setCustomStartDate("");
    setCustomEndDate("");

    loadAnalytics(
      currentMonth,
      currentYear,
      TREND_RANGES.CURRENT_MONTH
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    user,
  ]);


  /* =======================================================
     MONTH CHANGE
  ======================================================= */

  const handleMonthChange = (
    event
  ) => {

    if (!hasPremiumAnalytics) {
      return;
    }

    const value =
      event.target.value;

    if (!value) {
      return;
    }

    const [
      year,
      month,
    ] = value
      .split("-")
      .map(Number);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month)
    ) {
      return;
    }

    setSelectedMonth(month);
    setSelectedYear(year);

    setTrendRange(
      TREND_RANGES.CURRENT_MONTH
    );

    setCustomStartDate("");
    setCustomEndDate("");

    loadAnalytics(
      month,
      year,
      TREND_RANGES.CURRENT_MONTH
    );
  };


  /* =======================================================
     RANGE CHANGE
  ======================================================= */

  const handleTrendRangeChange = (
    event
  ) => {

    if (!hasPremiumAnalytics) {
      return;
    }

    const range =
      event.target.value;

    setTrendRange(range);
    setCustomStartDate("");
    setCustomEndDate("");

    if (
      range ===
      TREND_RANGES.CURRENT_MONTH
    ) {

      loadAnalytics(
        selectedMonth,
        selectedYear,
        TREND_RANGES.CURRENT_MONTH
      );

      return;
    }

    if (
      range ===
      TREND_RANGES.SIX_MONTHS
    ) {

      loadAnalytics(
        selectedMonth,
        selectedYear,
        TREND_RANGES.SIX_MONTHS
      );

      return;
    }

    if (
      range ===
      TREND_RANGES.TWELVE_MONTHS
    ) {

      loadAnalytics(
        selectedMonth,
        selectedYear,
        TREND_RANGES.TWELVE_MONTHS
      );

      return;
    }

    if (
      range ===
      TREND_RANGES.CUSTOM
    ) {

      setMonthlyData([]);

    }
  };


  /* =======================================================
     CUSTOM DATE VALIDATION
  ======================================================= */

  const isCustomDateRangeValid =
    (
      startDate,
      endDate
    ) => {

      if (
        !startDate ||
        !endDate
      ) {
        return false;
      }

      return (
        new Date(startDate) <=
        new Date(endDate)
      );
    };


  const handleCustomStartDate = (
    event
  ) => {

    if (!hasPremiumAnalytics) {
      return;
    }

    const value =
      event.target.value;

    setCustomStartDate(value);

    if (
      value &&
      customEndDate
    ) {

      if (
        !isCustomDateRangeValid(
          value,
          customEndDate
        )
      ) {

        setError(
          "The start date cannot be after the end date."
        );

        setMonthlyData([]);

        return;
      }

      setError("");

      loadAnalytics(
        selectedMonth,
        selectedYear,
        TREND_RANGES.CUSTOM,
        value,
        customEndDate
      );
    }
  };


  const handleCustomEndDate = (
    event
  ) => {

    if (!hasPremiumAnalytics) {
      return;
    }

    const value =
      event.target.value;

    setCustomEndDate(value);

    if (
      customStartDate &&
      value
    ) {

      if (
        !isCustomDateRangeValid(
          customStartDate,
          value
        )
      ) {

        setError(
          "The end date cannot be before the start date."
        );

        setMonthlyData([]);

        return;
      }

      setError("");

      loadAnalytics(
        selectedMonth,
        selectedYear,
        TREND_RANGES.CUSTOM,
        customStartDate,
        value
      );
    }
  };


  /* =======================================================
     PREMIUM UPGRADE
  ======================================================= */

  const handleTrialStarted = async () => {

    // AuthContext refreshes the user; `user.role` becoming
    // "premium" flows straight through to `hasPremiumAnalytics`
    // below, so premium analytics unlock immediately without
    // a page reload.

    await refreshUser();

    setIsUpgradeModalOpen(false);

    setUpgradeSuccessMessage(
      "You're on Premium! Enjoy your 1-month free trial."
    );

    window.setTimeout(() => {

      setUpgradeSuccessMessage("");

    }, 6000);

  };


  const handlePremiumCancelled = async () => {

    await refreshUser();

    setIsCancelModalOpen(false);

    setUpgradeSuccessMessage(
      "Cancellation scheduled. Your premium access continues until " +
      (premiumEndDateLabel || "your trial end date") + "."
    );

    window.setTimeout(() => {

      setUpgradeSuccessMessage("");

    }, 6000);

  };


  const handleReactivatePremium = async () => {

    if (reactivatingPremium) {

      return;

    }

    try {

      setReactivatingPremium(true);

      await reactivatePremiumTrial();

      await refreshUser();

      setUpgradeSuccessMessage(
        "Your premium plan has been reactivated."
      );

      window.setTimeout(() => {

        setUpgradeSuccessMessage("");

      }, 6000);

    } catch (error) {

      console.error(
        "Failed to reactivate premium:",
        error
      );

    } finally {

      setReactivatingPremium(false);

    }

  };


  /* =======================================================
     EXPORT
  ======================================================= */

  const handlePDFDownload =
    async () => {

      if (
        !hasPremiumAnalytics ||
        exportLoading
      ) {
        return;
      }

      if (
        trendRange ===
          TREND_RANGES.CUSTOM &&
        (
          !customStartDate ||
          !customEndDate
        )
      ) {

        setError(
          "Please select both a start date and end date before exporting."
        );

        return;
      }

      try {

        setExportLoading("pdf");
        setError("");

        await downloadMonthlyPDF({
          month:
            selectedMonth,

          year:
            selectedYear,

          startDate:
            trendRange ===
            TREND_RANGES.CUSTOM
              ? customStartDate
              : "",

          endDate:
            trendRange ===
            TREND_RANGES.CUSTOM
              ? customEndDate
              : "",

          range:
            trendRange,
        });

      } catch (
        pdfError
      ) {

        console.error(
          "PDF download failed:",
          pdfError
        );

        setError(
          "Unable to download the PDF report. Please try again."
        );

      } finally {

        setExportLoading("");

      }
    };


  const handleExcelDownload =
    async () => {

      if (
        !hasPremiumAnalytics ||
        exportLoading
      ) {
        return;
      }

      if (
        trendRange ===
          TREND_RANGES.CUSTOM &&
        (
          !customStartDate ||
          !customEndDate
        )
      ) {

        setError(
          "Please select both a start date and end date before exporting."
        );

        return;
      }

      try {

        setExportLoading("excel");
        setError("");

        await downloadMonthlyExcel({
          month:
            selectedMonth,

          year:
            selectedYear,

          startDate:
            trendRange ===
            TREND_RANGES.CUSTOM
              ? customStartDate
              : "",

          endDate:
            trendRange ===
            TREND_RANGES.CUSTOM
              ? customEndDate
              : "",

          range:
            trendRange,
        });

      } catch (
        excelError
      ) {

        console.error(
          "Excel download failed:",
          excelError
        );

        setError(
          "Unable to download the Excel report. Please try again."
        );

      } finally {

        setExportLoading("");

      }
    };


  /* =======================================================
     FINANCIAL VALUES
  ======================================================= */

  const totalIncome =
    Number(
      summary?.total_income || 0
    );

  const totalExpenses =
    Number(
      summary?.total_expenses || 0
    );

  const netBalance =
    Number(
      summary?.net_balance ??
      (
        totalIncome -
        totalExpenses
      )
    );

  const savingsRate =
    Number(
      summary?.savings_rate || 0
    );


  /* =======================================================
     FINANCIAL HEALTH
  ======================================================= */

  let healthText =
    "Needs attention";

  let healthClass =
    "warning";

  if (savingsRate >= 50) {

    healthText =
      "Excellent";

    healthClass =
      "excellent";

  } else if (
    savingsRate >= 30
  ) {

    healthText =
      "Healthy";

    healthClass =
      "healthy";

  } else if (
    savingsRate >= 15
  ) {

    healthText =
      "Moderate";

    healthClass =
      "moderate";

  }


  const safeSavingsRate =
    Math.min(
      Math.max(
        savingsRate,
        0
      ),
      100
    );


  /* =======================================================
     GOALS
  ======================================================= */

  const totalGoals =
    savingsData.length;

  const completedGoals =
    savingsData.filter(
      (goal) =>
        Number(
          goal?.percentage || 0
        ) >= 100
    ).length;


  /* =======================================================
     COMPARISON
  ======================================================= */

  const currentMonthData =
    comparisonData.find(
      (item) =>
        item?.month ===
        selectedPeriodValue
    );

  const previousMonthData =
    comparisonData.find(
      (item) =>
        item?.month ===
        previousMonthPeriodValue
    );


  const currentMonthIncome =
    Number(
      currentMonthData?.total_income ||
      0
    );

  const currentMonthExpenses =
    Number(
      currentMonthData?.total_expenses ||
      0
    );

  const previousMonthIncome =
    Number(
      previousMonthData?.total_income ||
      0
    );

  const previousMonthExpenses =
    Number(
      previousMonthData?.total_expenses ||
      0
    );


  const incomePercentageChange =
    calculatePercentageChange(
      currentMonthIncome,
      previousMonthIncome
    );

  const expensesPercentageChange =
    calculatePercentageChange(
      currentMonthExpenses,
      previousMonthExpenses
    );


  const incomeChangeText =
    getChangeText(
      incomePercentageChange,
      currentMonthIncome
    );

  const expensesChangeText =
    getChangeText(
      expensesPercentageChange,
      currentMonthExpenses
    );


  const incomeChangeClass =
    incomePercentageChange === null
      ? "neutral"
      : incomePercentageChange > 0
      ? "positive"
      : incomePercentageChange < 0
      ? "negative"
      : "neutral";


  const expensesChangeClass =
    expensesPercentageChange === null
      ? "neutral"
      : expensesPercentageChange > 0
      ? "negative"
      : expensesPercentageChange < 0
      ? "positive"
      : "neutral";


  /* =======================================================
     TREND TITLE
  ======================================================= */

  const trendTitle =
    trendRange ===
    TREND_RANGES.SIX_MONTHS
      ? "Income & Expenses — Last 6 Months"
      : trendRange ===
        TREND_RANGES.TWELVE_MONTHS
      ? "Income & Expenses — Last 12 Months"
      : trendRange ===
        TREND_RANGES.CUSTOM
      ? "Income & Expenses — Custom Range"
      : `Income & Expenses — ${selectedMonthName} ${selectedYear}`;


  const trendDescription =
    trendRange ===
    TREND_RANGES.SIX_MONTHS
      ? "Monthly income and expenses over the last six months."
      : trendRange ===
        TREND_RANGES.TWELVE_MONTHS
      ? "Monthly income and expenses over the last twelve months."
      : trendRange ===
        TREND_RANGES.CUSTOM
      ? customStartDate &&
        customEndDate
        ? `${customStartDate} to ${customEndDate}`
        : "Select a start and end date to view your custom trend."
      : `Daily income and expenses for ${selectedMonthName} ${selectedYear}.`;


  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {

    return (
      <div className="analytics-loading-screen">
        <div className="analytics-spinner"></div>

        <h3>
          Loading your account
        </h3>

        <p>
          Checking your analytics access...
        </p>
      </div>
    );
  }


  /* =======================================================
     NO USER
  ======================================================= */

  if (!user) {

    return (
      <div className="analytics-loading-screen">
        <h3>
          Please log in
        </h3>

        <p>
          You need to be logged in to view
          your financial analytics.
        </p>
      </div>
    );
  }


  /* =======================================================
     ANALYTICS LOADING
  ======================================================= */

  if (loading) {

    return (
      <div className="analytics-loading-screen">
        <div className="analytics-spinner"></div>

        <h3>
          Loading your analytics
        </h3>

        <p>
          Preparing your financial insights...
        </p>
      </div>
    );
  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="analytics-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="analytics-page-header">

        <div>

          <div className="analytics-breadcrumb">
            <span>Dashboard</span>
            <span>/</span>
            <strong>Analytics</strong>
          </div>

          <div className="analytics-title-row">

            <div>

              <h1>
                Financial Analytics
              </h1>

              <p>
                Understand where your money goes,
                how much you save, and how your
                finances are progressing.
              </p>

            </div>

            <div className="live-status">
              <span className="live-dot"></span>
              Live data
            </div>

          </div>

        </div>

      </header>


      {/* =================================================
          PERIOD BAR
      ================================================= */}

      <section className="analytics-period-bar">

        <div className="period-bar-info">

          <span className="eyebrow">
            ANALYTICS PERIOD
          </span>

          <h3>
            {hasPremiumAnalytics
              ? "Review your financial performance"
              : "Your current month"}
          </h3>

          <p>
            {hasPremiumAnalytics
              ? "Choose a month to explore your financial performance."
              : "Basic analytics are available for the current month."}
          </p>

        </div>


        <div className="period-bar-control">

          <label>
            {hasPremiumAnalytics
              ? "Selected month"
              : "Current month"}
          </label>

          {hasPremiumAnalytics ? (

            <div className="select-control">

              <Icon
                type="calendar"
                size={17}
              />

              <select
                value={
                  selectedPeriodValue
                }
                onChange={
                  handleMonthChange
                }
              >

                {monthOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}

              </select>

            </div>

          ) : (

            <div className="current-period">
              <Icon
                type="calendar"
                size={17}
              />

              <span>
                {selectedMonthName}{" "}
                {selectedYear}
              </span>
            </div>

          )}

        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="analytics-error">

          <div className="error-symbol">
            !
          </div>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =================================================
          UPGRADE SUCCESS
      ================================================= */}

      {upgradeSuccessMessage && (

        <div
          className="analytics-error"
          style={{
            background: "#f0edff",
            borderColor: "#d9d2ff",
            color: "#4a3aa8",
          }}
        >

          <div
            className="error-symbol"
            style={{
              background: "#6c4ee6",
              color: "#ffffff",
            }}
          >
            ✓
          </div>

          <span>
            {upgradeSuccessMessage}
          </span>

        </div>

      )}


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <section className="analytics-kpi-grid">

        {/* INCOME */}

        <div className="analytics-kpi-card">

          <div className="kpi-card-header">

            <div className="kpi-icon income">
              <Icon
                type="income"
                size={19}
              />
            </div>

            <span>
              Total Income
            </span>

          </div>

          <strong className="kpi-value">
            {formatCurrency(
              totalIncome
            )}
          </strong>

          <div className="kpi-footer">
            <span className="kpi-positive">
              Income
            </span>

            <span>
              {selectedMonthName}
            </span>
          </div>

        </div>


        {/* EXPENSES */}

        <div className="analytics-kpi-card">

          <div className="kpi-card-header">

            <div className="kpi-icon expense">
              <Icon
                type="expense"
                size={19}
              />
            </div>

            <span>
              Total Expenses
            </span>

          </div>

          <strong className="kpi-value">
            {formatCurrency(
              totalExpenses
            )}
          </strong>

          <div className="kpi-footer">
            <span className="kpi-negative">
              Spending
            </span>

            <span>
              {selectedMonthName}
            </span>
          </div>

        </div>


        {/* BALANCE */}

        <div className="analytics-kpi-card">

          <div className="kpi-card-header">

            <div className="kpi-icon balance">
              <Icon
                type="balance"
                size={19}
              />
            </div>

            <span>
              Net Balance
            </span>

          </div>

          <strong className="kpi-value">
            {formatCurrency(
              Math.abs(netBalance)
            )}
          </strong>

          <div className="kpi-footer">

            <span
              className={
                netBalance >= 0
                  ? "kpi-positive"
                  : "kpi-negative"
              }
            >
              {netBalance >= 0
                ? "Available"
                : "Deficit"}
            </span>

            <span>
              After expenses
            </span>

          </div>

        </div>


        {/* SAVINGS */}

        <div className="analytics-kpi-card">

          <div className="kpi-card-header">

            <div className="kpi-icon savings">
              <Icon
                type="savings"
                size={19}
              />
            </div>

            <span>
              Savings Rate
            </span>

          </div>

          <strong className="kpi-value">
            {savingsRate}%
          </strong>

          <div className="kpi-footer">

            <span className="kpi-positive">
              {healthText}
            </span>

            <span>
              Of income
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          FINANCIAL HEALTH
      ================================================= */}

      <section
        className={`financial-health-card ${healthClass}`}
      >

        <div className="health-main">

          <div className="health-icon">
            {healthClass ===
            "excellent"
              ? "✓"
              : healthClass ===
                "healthy"
              ? "↗"
              : "!"}
          </div>

          <div>

            <span className="eyebrow">
              FINANCIAL HEALTH
            </span>

            <h3>
              {healthText}
            </h3>

            <p>
              You're currently saving{" "}
              <strong>
                {savingsRate}%
              </strong>{" "}
              of your income.
            </p>

          </div>

        </div>


        <div className="health-progress-area">

          <div className="health-progress-top">

            <span>
              Savings performance
            </span>

            <strong>
              {savingsRate}%
            </strong>

          </div>

          <div className="health-progress">
            <div
              className="health-progress-fill"
              style={{
                width:
                  `${safeSavingsRate}%`,
              }}
            />
          </div>

        </div>

      </section>


      {/* =================================================
          BASIC ANALYTICS HEADER
      ================================================= */}

      <section className="section-heading">

        <div>

          <span className="eyebrow">
            OVERVIEW
          </span>

          <h2>
            Spending & income
          </h2>

          <p>
            A snapshot of your financial activity
            for {selectedMonthName} {selectedYear}.
          </p>

        </div>

        <span className="period-pill">
          {selectedMonthName} {selectedYear}
        </span>

      </section>


      {/* =================================================
          MAIN CHARTS
      ================================================= */}

      <section className="analytics-chart-grid">

        {/* SPENDING */}

        <div className="analytics-chart-card">

          <div className="chart-card-header">

            <div>

              <span className="chart-label">
                SPENDING BREAKDOWN
              </span>

              <h3>
                Spending by Category
              </h3>

              <p>
                See how your expenses are distributed
                across categories.
              </p>

            </div>

            <span className="chart-count">
              {spendingData.length}{" "}
              {spendingData.length === 1
                ? "category"
                : "categories"}
            </span>

          </div>

          <div className="chart-body pie-chart-body">

            {spendingData.length > 0 ? (

              <SpendingPieChart
                data={
                  spendingData
                }
              />

            ) : (

              <div className="analytics-empty-chart">

                <div className="analytics-empty-icon">
                  <Icon
                    type="trend"
                    size={24}
                  />
                </div>

                <h4>
                  No spending data
                </h4>

                <p>
                  Add expenses to see your
                  spending breakdown.
                </p>

              </div>

            )}

          </div>

        </div>


        {/* INCOME EXPENSE */}

        <div className="analytics-chart-card">

          <div className="chart-card-header">

            <div>

              <span className="chart-label">
                FINANCIAL COMPARISON
              </span>

              <h3>
                Income vs Expenses
              </h3>

              <p>
                Compare your total income with
                your spending.
              </p>

            </div>

          </div>

          <div className="chart-body">

            <IncomeExpenseChart
              income={
                totalIncome
              }
              expenses={
                totalExpenses
              }
            />

          </div>

        </div>

      </section>


      {/* =================================================
          PREMIUM
      ================================================= */}

      {hasPremiumAnalytics ? (

        <>

          {/* PREMIUM SECTION HEADER */}

          <section className="premium-section-heading">

            <div>

              <div className="premium-heading-label">
                <span className="premium-dot"></span>

                {isAdmin
                  ? "ADMIN / PREMIUM"
                  : "PREMIUM ANALYTICS"}
              </div>

              <h2>
                Deeper financial insights
              </h2>

              <p>
                Explore historical performance,
                savings goals and month-to-month
                changes.
              </p>

            </div>

            <div className="flex flex-col items-end gap-2.5">

              <div className="premium-access-badge">
                <Icon
                  type="spark"
                  size={15}
                />

                {isAdmin
                  ? "Admin Access"
                  : "Premium Access"}
              </div>

              {isCancellationScheduled && (

                <div
                  className="
                    text-xs
                    font-medium
                    text-amber-700
                    bg-amber-50
                    border border-amber-200
                    rounded-full
                    px-3 py-1
                  "
                >
                  Cancellation scheduled
                  {premiumEndDateLabel
                    ? ` \u2022 ends ${premiumEndDateLabel}`
                    : ""}
                </div>

              )}

              {isPremium && !isAdmin && (

                isCancellationScheduled ? (

                  <button
                    type="button"
                    onClick={
                      handleReactivatePremium
                    }
                    disabled={
                      reactivatingPremium
                    }
                    className="
                      inline-flex items-center gap-1.5
                      px-3 py-1.5
                      rounded-full
                      border border-purple-200
                      bg-white
                      text-purple-600
                      hover:text-purple-700
                      hover:border-purple-300
                      hover:bg-purple-50
                      disabled:text-gray-400
                      disabled:border-gray-200
                      disabled:bg-white
                      text-xs font-semibold
                      transition-colors
                    "
                  >

                    {reactivatingPremium
                      ? "Reactivating..."
                      : "Reactivate Premium"}

                  </button>

                ) : (

                  <button
                    type="button"
                    onClick={() =>
                      setIsCancelModalOpen(true)
                    }
                    className="
                      inline-flex items-center gap-1.5
                      px-3 py-1.5
                      rounded-full
                      border border-gray-200
                      bg-white
                      text-gray-500
                      hover:text-red-600
                      hover:border-red-200
                      hover:bg-red-50
                      text-xs font-semibold
                      transition-colors
                    "
                  >

                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>

                    Cancel Premium

                  </button>

                )

              )}

            </div>

          </section>


          {/* TREND CONTROLS */}

          <section className="trend-controls-card">

            <div className="trend-controls-header">

              <div>

                <span className="chart-label">
                  TREND RANGE
                </span>

                <h3>
                  Choose your analytics period
                </h3>

              </div>

              <span className="trend-range-status">
                {trendRange ===
                TREND_RANGES.SIX_MONTHS
                  ? "6 months"
                  : trendRange ===
                    TREND_RANGES.TWELVE_MONTHS
                  ? "12 months"
                  : trendRange ===
                    TREND_RANGES.CUSTOM
                  ? "Custom"
                  : "Current month"}
              </span>

            </div>


            <div className="trend-buttons">

              <button
                type="button"
                className={
                  trendRange ===
                  TREND_RANGES.CURRENT_MONTH
                    ? "trend-button active"
                    : "trend-button"
                }
                onClick={() =>
                  handleTrendRangeChange({
                    target: {
                      value:
                        TREND_RANGES.CURRENT_MONTH,
                    },
                  })
                }
              >
                <Icon
                  type="calendar"
                  size={17}
                />

                <span>
                  Current month
                </span>
              </button>


              <button
                type="button"
                className={
                  trendRange ===
                  TREND_RANGES.SIX_MONTHS
                    ? "trend-button active"
                    : "trend-button"
                }
                onClick={() =>
                  handleTrendRangeChange({
                    target: {
                      value:
                        TREND_RANGES.SIX_MONTHS,
                    },
                  })
                }
              >
                <Icon
                  type="trend"
                  size={17}
                />

                <span>
                  Last 6 months
                </span>
              </button>


              <button
                type="button"
                className={
                  trendRange ===
                  TREND_RANGES.TWELVE_MONTHS
                    ? "trend-button active"
                    : "trend-button"
                }
                onClick={() =>
                  handleTrendRangeChange({
                    target: {
                      value:
                        TREND_RANGES.TWELVE_MONTHS,
                    },
                  })
                }
              >
                <Icon
                  type="trend"
                  size={17}
                />

                <span>
                  Last 12 months
                </span>
              </button>


              <button
                type="button"
                className={
                  trendRange ===
                  TREND_RANGES.CUSTOM
                    ? "trend-button active"
                    : "trend-button"
                }
                onClick={() =>
                  handleTrendRangeChange({
                    target: {
                      value:
                        TREND_RANGES.CUSTOM,
                    },
                  })
                }
              >
                <Icon
                  type="calendar"
                  size={17}
                />

                <span>
                  Custom range
                </span>
              </button>

            </div>


            {trendRange ===
              TREND_RANGES.CUSTOM && (

              <div className="custom-date-controls">

                <div className="date-field">

                  <label>
                    Start date
                  </label>

                  <input
                    type="date"
                    value={
                      customStartDate
                    }
                    max={
                      customEndDate ||
                      todayInputValue
                    }
                    onChange={
                      handleCustomStartDate
                    }
                  />

                </div>


                <div className="date-field">

                  <label>
                    End date
                  </label>

                  <input
                    type="date"
                    value={
                      customEndDate
                    }
                    min={
                      customStartDate ||
                      undefined
                    }
                    max={
                      todayInputValue
                    }
                    onChange={
                      handleCustomEndDate
                    }
                  />

                </div>

              </div>

            )}

          </section>


          {/* HISTORICAL TREND */}

          <section className="analytics-chart-card trend-chart-card-large">

            <div className="chart-card-header">

              <div>

                <span className="chart-label">
                  HISTORICAL TREND
                </span>

                <h3>
                  {trendTitle}
                </h3>

                <p>
                  {trendDescription}
                </p>

              </div>

            </div>

            <div className="historical-chart-body">

              {monthlyData.length > 0 ? (

                <MonthlyTrendLineChart
                  data={
                    monthlyData
                  }
                  mode={
                    trendRange ===
                      TREND_RANGES.CUSTOM ||
                    trendRange ===
                      TREND_RANGES.CURRENT_MONTH
                      ? "daily"
                      : "monthly"
                  }
                />

              ) : (

                <div className="analytics-empty-chart">

                  <div className="analytics-empty-icon">
                    <Icon
                      type="trend"
                      size={24}
                    />
                  </div>

                  <h4>
                    No financial data
                  </h4>

                  <p>
                    Add income or expenses during
                    the selected period to see
                    your financial trend.
                  </p>

                </div>

              )}

            </div>

          </section>


          {/* SECONDARY PREMIUM GRID */}

          <section className="premium-secondary-grid">

            {/* MONTH COMPARISON */}

            <div className="analytics-chart-card">

              <div className="chart-card-header">

                <div>

                  <span className="chart-label">
                    MONTH COMPARISON
                  </span>

                  <h3>
                    This month vs previous
                  </h3>

                  <p>
                    Compare income and expenses
                    with {previousMonthName}.
                  </p>

                </div>

              </div>


              <div className="comparison-summary">

                <div className="comparison-stat">

                  <span>
                    Income
                  </span>

                  <strong>
                    {incomeChangeText}
                  </strong>

                  <small
                    className={
                      incomeChangeClass
                    }
                  >
                    {formatCurrency(
                      currentMonthIncome
                    )}
                  </small>

                </div>


                <div className="comparison-stat">

                  <span>
                    Expenses
                  </span>

                  <strong>
                    {expensesChangeText}
                  </strong>

                  <small
                    className={
                      expensesChangeClass
                    }
                  >
                    {formatCurrency(
                      currentMonthExpenses
                    )}
                  </small>

                </div>

              </div>


              <MonthComparisonChart
                currentMonthName={
                  selectedMonthName
                }
                previousMonthName={
                  previousMonthName
                }
                currentIncome={
                  currentMonthIncome
                }
                previousIncome={
                  previousMonthIncome
                }
                currentExpenses={
                  currentMonthExpenses
                }
                previousExpenses={
                  previousMonthExpenses
                }
              />

            </div>


            {/* SAVINGS GOALS */}

            <div className="analytics-chart-card savings-goals-card">

              <div className="chart-card-header">

                <div>

                  <span className="chart-label">
                    SAVINGS GOALS
                  </span>

                  <h3>
                    Your financial targets
                  </h3>

                  <p>
                    Track your progress toward
                    your savings goals.
                  </p>

                </div>

                <div className="goal-count">
                  <strong>
                    {completedGoals}
                  </strong>

                  <span>
                    / {totalGoals}
                  </span>
                </div>

              </div>


              <div className="goal-card-content">

                {totalGoals > 0 ? (

                  <SavingsProgressBar
                    goals={
                      savingsData
                    }
                  />

                ) : (

                  <div className="goal-empty">

                    <div className="goal-empty-icon">
                      <Icon
                        type="target"
                        size={25}
                      />
                    </div>

                    <h4>
                      No savings goals yet
                    </h4>

                    <p>
                      Create a goal to start
                      tracking your progress.
                    </p>

                  </div>

                )}

              </div>

            </div>

          </section>


          {/* EXPORT */}

          <section className="export-card">

            <div className="export-content">

              <div className="export-icon">
                <Icon
                  type="download"
                  size={23}
                />
              </div>

              <div>

                <span className="chart-label">
                  REPORTS & EXPORT
                </span>

                <h3>
                  Download your financial report
                </h3>

                <p>
                  Export your analytics as a
                  professional PDF or Excel report.
                </p>

              </div>

            </div>


            <div className="export-actions">

              <button
                type="button"
                className="export-button pdf"
                disabled={
                  Boolean(exportLoading)
                }
                onClick={
                  handlePDFDownload
                }
              >

                <Icon
                  type="download"
                  size={18}
                />

                <span>

                  <strong>
                    {exportLoading ===
                    "pdf"
                      ? "Generating..."
                      : "Download PDF"}
                  </strong>

                  <small>
                    PDF report
                  </small>

                </span>

              </button>


              <button
                type="button"
                className="export-button excel"
                disabled={
                  Boolean(exportLoading)
                }
                onClick={
                  handleExcelDownload
                }
              >

                <Icon
                  type="download"
                  size={18}
                />

                <span>

                  <strong>
                    {exportLoading ===
                    "excel"
                      ? "Generating..."
                      : "Download Excel"}
                  </strong>

                  <small>
                    Spreadsheet
                  </small>

                </span>

              </button>

            </div>

          </section>

        </>

      ) : (

        /* =================================================
           BASIC USER UPGRADE
        ================================================= */

        <section className="upgrade-card">

          <div className="upgrade-icon">
            <Icon
              type="spark"
              size={25}
            />
          </div>

          <div>

            <span className="chart-label">
              PREMIUM ANALYTICS
            </span>

            <h3>
              Unlock deeper financial insights
            </h3>

            <p>
              Upgrade to Premium to access
              historical trends, custom date
              ranges, month comparisons, savings
              analytics and PDF/Excel exports.
            </p>

          </div>

          <button
            type="button"
            className="upgrade-button"
            onClick={() =>
              setIsUpgradeModalOpen(true)
            }
          >
            Explore Premium
          </button>

        </section>

      )}


      {/* =================================================
          ADMIN NOTICE
      ================================================= */}

      {isAdmin && (

        <section className="admin-notice">

          <div className="admin-icon">
            <Icon
              type="shield"
              size={22}
            />
          </div>

          <div>

            <span className="chart-label">
              ADMIN ACCESS
            </span>

            <h3>
              System Analytics available
            </h3>

            <p>
              You can access the separate System
              Analytics page for aggregated
              platform-wide metrics. Your personal
              analytics above remain scoped to
              your own account.
            </p>

          </div>

        </section>

      )}


      {/* =================================================
          INSIGHT
      ================================================= */}

      <section className="smart-insight-card">

        <div className="smart-insight-icon">
          <Icon
            type="spark"
            size={22}
          />
        </div>

        <div>

          <span className="chart-label">
            PERSONALIZED INSIGHT
          </span>

          <h3>
            Smart Financial Insight
          </h3>

          <p>

            {totalIncome === 0 &&
            totalExpenses === 0

              ? "No income or expenses have been recorded for the selected period. Add transactions to start receiving financial insights."

              : netBalance < 0

              ? "Your expenses are higher than your income this month. Consider reviewing your largest spending categories and reducing non-essential expenses."

              : savingsRate >= 50

              ? "Excellent work. You're saving more than half of your income. Keep maintaining this strong financial discipline."

              : savingsRate >= 30

              ? "Great job! Your savings rate is healthy. Keep maintaining a good balance between spending and saving."

              : savingsRate >= 15

              ? "You're making progress. Try identifying one or two unnecessary spending categories and redirect that money toward your savings goals."

              : "Your savings rate could improve. Consider reducing non-essential expenses and setting aside a fixed amount whenever you receive income."

            }

          </p>

        </div>

      </section>


      {/* =================================================
          PREMIUM UPGRADE MODAL
      ================================================= */}

      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() =>
          setIsUpgradeModalOpen(false)
        }
        onUpgraded={handleTrialStarted}
      />

      <CancelPremiumModal
        isOpen={isCancelModalOpen}
        onClose={() =>
          setIsCancelModalOpen(false)
        }
        onCancelled={handlePremiumCancelled}
        premiumEndDateLabel={premiumEndDateLabel}
      />

    </div>
  );
}

export default AnalyticsDashboard;