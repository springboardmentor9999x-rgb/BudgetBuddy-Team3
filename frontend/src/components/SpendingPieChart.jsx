import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
  const safeData = Array.isArray(data) ? data : [];

  const totalSpending = safeData.reduce(
    (sum, item) =>
      sum + Number(item?.total || 0),
    0
  );

  return (
    <div className="pie-chart-wrapper">
      {safeData.length === 0 ? (
        <div className="empty-chart">
          <div className="empty-chart-icon">
            ₹
          </div>

          <h4>No spending data</h4>

          <p>
            Add some expenses to see your
            spending breakdown.
          </p>
        </div>
      ) : (
        <>
          {/* ================================
              DONUT CHART
          ================================= */}

          <div className="pie-chart-visual">
            <ResponsiveContainer
              width="100%"
              height={360}
            >
              <PieChart>
                <Pie
                  data={safeData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={82}
                  outerRadius={124}
                  paddingAngle={3}
                  stroke="none"
                  labelLine={false}
                >
                  {safeData.map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  content={
                    <SpendingTooltip />
                  }
                />

                {/* CENTER LABEL */}

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
                  {formatCurrency(
                    totalSpending
                  )}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ================================
              CATEGORY LEGEND
          ================================= */}

          <div className="pie-legend">
            {safeData.map(
              (item, index) => {
                const amount = Number(
                  item?.total || 0
                );

                const percentage =
                  totalSpending > 0
                    ? (
                        (amount /
                          totalSpending) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <div
                    className="pie-legend-item"
                    key={`${item?.category || "category"}-${index}`}
                  >
                    {/* CATEGORY */}

                    <div className="pie-legend-left">
                      <span
                        className="legend-dot"
                        style={{
                          backgroundColor:
                            COLORS[
                              index %
                                COLORS.length
                            ],
                        }}
                      />

                      <span className="legend-category">
                        {item?.category ||
                          "Uncategorized"}
                      </span>
                    </div>

                    {/* AMOUNT + PERCENTAGE */}

                    <div className="pie-legend-right">
                      <strong>
                        {formatCurrency(
                          amount
                        )}
                      </strong>

                      <span>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SpendingPieChart;