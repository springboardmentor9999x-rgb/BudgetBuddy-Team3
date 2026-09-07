import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;

}


/* =========================================================
   TOOLTIP
========================================================= */

function TrendTooltip({
  active,
  payload,
  label,
}) {

  if (
    !active ||
    !payload ||
    !payload.length
  ) {

    return null;

  }


  return (

    <div className="custom-tooltip trend-tooltip">

      <div className="tooltip-month">
        {label}
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
            {formatCurrency(
              item.value
            )}
          </strong>

        </div>

      ))}

    </div>

  );

}


/* =========================================================
   MONTHLY TREND LINE CHART
========================================================= */

function MonthlyTrendLineChart({
  data,
  mode = "daily",
}) {

  const isEmpty =
    !Array.isArray(data) ||
    data.length === 0;


  if (isEmpty) {

    return (

      <div className="trend-chart-wrapper">

        <div className="empty-chart">

          <div className="empty-chart-icon">
            ↗
          </div>


          <h4>
            No trend data
          </h4>


          <p>
            Add income and expenses to
            see your financial trend.
          </p>

        </div>

      </div>

    );

  }


  return (

    <div className="trend-chart-wrapper">

      <ResponsiveContainer
        width="100%"
        height={330}
      >

        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 18,
            left: 0,
            bottom: 5,
          }}
        >

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#edf0f5"
          />


          <XAxis
            dataKey={
              mode === "monthly"
                ? "label"
                : "month"
            }
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#8b95a7",
              fontSize: 11,
            }}
            interval={
              mode === "daily"
                ? "preserveStartEnd"
                : 0
            }
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
                ? `₹${(
                    value / 1000
                  ).toFixed(0)}k`
                : `₹${value}`
            }
          />


          <Tooltip
            content={
              <TrendTooltip />
            }
            cursor={{
              stroke: "#cfd5e1",
              strokeDasharray: "4 4",
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


          {/* =================================================
              INCOME
          ================================================= */}

          <Line
            type="monotone"
            dataKey="total_income"
            name="Income"
            stroke="#22b573"
            strokeWidth={3}
            dot={{
              r:
                mode === "daily"
                  ? 2
                  : 3,
              strokeWidth: 2,
              fill: "#ffffff",
            }}
            activeDot={{
              r: 6,
              strokeWidth: 2,
            }}
          />


          {/* =================================================
              EXPENSES
          ================================================= */}

          <Line
            type="monotone"
            dataKey="total_expenses"
            name="Expenses"
            stroke="#ef5b5b"
            strokeWidth={3}
            dot={{
              r:
                mode === "daily"
                  ? 2
                  : 3,
              strokeWidth: 2,
              fill: "#ffffff",
            }}
            activeDot={{
              r: 6,
              strokeWidth: 2,
            }}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}


export default MonthlyTrendLineChart;