import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


/* =========================================================
   CURRENCY FORMAT
========================================================= */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}


/* =========================================================
   TOOLTIP
========================================================= */

function IncomeExpenseTooltip({
  active,
  payload,
}) {

  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  return (
    <div className="custom-tooltip">

      <div className="tooltip-category">
        {payload[0]?.payload?.name}
      </div>

      {payload.map((item) => (

        <div
          className="trend-tooltip-row"
          key={item.dataKey}
        >

          <span
            className="trend-tooltip-dot"
            style={{
              background: item.color,
            }}
          ></span>

          <span>
            {item.name}
          </span>

          <strong>
            {formatCurrency(item.value)}
          </strong>

        </div>

      ))}

    </div>
  );
}


/* =========================================================
   COMPONENT
========================================================= */

function IncomeExpenseBarChart({
  totalIncome = 0,
  totalExpenses = 0,
}) {

  const chartData = [
    {
      name: "Income",
      amount: Number(totalIncome || 0),
    },
    {
      name: "Expenses",
      amount: Number(totalExpenses || 0),
    },
  ];


  const hasData =
    Number(totalIncome || 0) > 0 ||
    Number(totalExpenses || 0) > 0;


  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (!hasData) {

    return (

      <div className="bar-chart-wrapper">

        <div className="empty-chart">

          <div className="empty-chart-icon">
            ₹
          </div>

          <h4>
            No income or expense data
          </h4>

          <p>
            Add income or expenses to see
            your financial comparison.
          </p>

        </div>

      </div>

    );
  }


  /* =======================================================
     CHART
  ======================================================= */

  return (

    <div className="bar-chart-wrapper">

      <ResponsiveContainer
        width="100%"
        height={330}
      >

        <BarChart
          data={chartData}
          margin={{
            top: 15,
            right: 18,
            left: 0,
            bottom: 5,
          }}
          barCategoryGap="35%"
        >

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#edf0f5"
          />


          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8b95a7",
              fontSize: 11,
            }}
          />


          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8b95a7",
              fontSize: 11,
            }}
            tickFormatter={(value) =>
              value >= 1000
                ? `₹${(value / 1000).toFixed(0)}k`
                : `₹${value}`
            }
          />


          <Tooltip
            content={
              <IncomeExpenseTooltip />
            }
            cursor={{
              fill: "#f5f7fa",
            }}
          />


          <Legend
            verticalAlign="top"
            align="right"
            height={35}
            iconType="circle"
            wrapperStyle={{
              fontSize: "11px",
              color: "#707a8d",
            }}
          />


          <Bar
            dataKey="amount"
            name="Amount"
            fill="#6366f1"
            radius={[
              6,
              6,
              0,
              0,
            ]}
            maxBarSize={70}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );
}


export default IncomeExpenseBarChart;