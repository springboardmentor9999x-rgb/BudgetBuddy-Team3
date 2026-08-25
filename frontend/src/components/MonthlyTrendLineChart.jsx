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

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
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

          <span>{item.name}</span>

          <strong>
            {formatCurrency(item.value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function MonthlyTrendLineChart({ data }) {
  return (
    <div className="trend-chart-wrapper">
      {data.length === 0 ? (
        <div className="empty-chart">
          <div className="empty-chart-icon">↗</div>

          <h4>No monthly data</h4>

          <p>
            Add income and expenses to see your financial trend.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={330}>
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
              dataKey="month"
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
              content={<TrendTooltip />}
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

            <Line
              type="monotone"
              dataKey="total_income"
              name="Income"
              stroke="#22b573"
              strokeWidth={3}
              dot={{
                r: 3,
                strokeWidth: 2,
                fill: "#ffffff",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
              }}
            />

            <Line
              type="monotone"
              dataKey="total_expenses"
              name="Expenses"
              stroke="#ef5b5b"
              strokeWidth={3}
              dot={{
                r: 3,
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
      )}
    </div>
  );
}

export default MonthlyTrendLineChart;