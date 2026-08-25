import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function SpendingTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="custom-tooltip">
      <div className="tooltip-category">
        {item.name}
      </div>

      <div className="tooltip-value">
        {formatCurrency(item.value)}
      </div>
    </div>
  );
}

function SpendingPieChart({ data }) {
  const totalSpending = data.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  return (
    <div className="pie-chart-wrapper">
      {data.length === 0 ? (
        <div className="empty-chart">
          <div className="empty-chart-icon">₹</div>
          <h4>No spending data</h4>
          <p>
            Add some expenses to see your spending breakdown.
          </p>
        </div>
      ) : (
        <>
          <div className="pie-chart-visual">
            <ResponsiveContainer width="100%" height={330}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={82}
                  outerRadius={118}
                  paddingAngle={3}
                  stroke="none"
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip content={<SpendingTooltip />} />

                <text
                  x="50%"
                  y="47%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pie-center-label"
                >
                  Total
                </text>

                <text
                  x="50%"
                  y="56%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pie-center-value"
                >
                  {formatCurrency(totalSpending)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pie-legend">
            {data.map((item, index) => {
              const percentage =
                totalSpending > 0
                  ? ((Number(item.total) / totalSpending) * 100).toFixed(1)
                  : 0;

              return (
                <div
                  className="pie-legend-item"
                  key={`${item.category}-${index}`}
                >
                  <div className="pie-legend-left">
                    <span
                      className="legend-dot"
                      style={{
                        background:
                          COLORS[index % COLORS.length],
                      }}
                    ></span>

                    <span className="legend-category">
                      {item.category}
                    </span>
                  </div>

                  <div className="pie-legend-right">
                    <strong>
                      {formatCurrency(item.total)}
                    </strong>

                    <span>{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default SpendingPieChart;