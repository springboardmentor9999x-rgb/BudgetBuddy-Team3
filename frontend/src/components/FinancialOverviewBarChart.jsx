import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

function FinancialOverviewBarChart({ summary, savingsGoals = [] }) {
  /*
   * Calculate total amount contributed
   * across all savings goals.
   */
  const totalSavingsContribution = savingsGoals.reduce(
    (total, goal) => {
      return total + Number(
        goal?.current_amount ??
        goal?.saved_amount ??
        goal?.amount_contributed ??
        0
      );
    },
    0
  );

  /*
   * Final account balance after savings contributions.
   *
   * If your backend already provides account_balance,
   * use that value directly.
   */
  const accountBalance = Number(
    summary?.account_balance ?? 0
  );

  const data = [
    {
      name: "Income",
      value: Number(summary?.total_income ?? 0),
      color: "#22b573",
    },
    {
      name: "Expenses",
      value: Number(summary?.total_expenses ?? 0),
      color: "#ef5b5b",
    },
    {
      name: "Savings Goals",
      value: totalSavingsContribution,
      color: "#f59e0b",
    },
    {
      name: "Account Balance",
      value: accountBalance,
      color: "#6d4de5",
    },
  ];

  const formatCurrency = (value) => {
    return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const item = payload[0];

    return (
      <div className="financial-overview-tooltip">
        <div className="financial-tooltip-label">
          {item?.payload?.name}
        </div>

        <div className="financial-tooltip-value">
          {formatCurrency(item?.value)}
        </div>
      </div>
    );
  };

  return (
    <div className="financial-overview-chart-card">

      {/* HEADER */}
      <div className="financial-overview-chart-header">
        <div>
          <span className="financial-chart-eyebrow">
            OVERVIEW
          </span>

          <h3>Financial Overview</h3>

          <p>
            Income, expenses, savings contributions and
            account balance
          </p>
        </div>
      </div>

      {/* CHART */}
      <div className="financial-overview-chart">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
        >
          <BarChart
            data={data}
            margin={{
              top: 35,
              right: 25,
              left: 20,
              bottom: 15,
            }}
            barCategoryGap="25%"
          >

            <CartesianGrid
              stroke="#e8ecf2"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={{
                stroke: "#d9dee8",
              }}
              tickLine={false}
              tick={{
                fill: "#344054",
                fontSize: 11,
                fontWeight: 700,
              }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#7d8799",
                fontSize: 10,
              }}
              tickFormatter={(value) =>
                `₹${Number(value).toLocaleString("en-IN")}`
              }
              width={75}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: "rgba(99, 102, 241, 0.035)",
              }}
            />

            <Bar
              dataKey="value"
              radius={[10, 10, 2, 2]}
              maxBarSize={100}
              minPointSize={6}
              isAnimationActive={true}
              animationDuration={700}
              label={{
                position: "top",
                fill: "#596477",
                fontSize: 10,
                fontWeight: 700,
                formatter: (value) =>
                  formatCurrency(value),
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`financial-bar-${index}`}
                  fill={entry.color}
                />
              ))}
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default FinancialOverviewBarChart;