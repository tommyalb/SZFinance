import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function FinanceProgressWidgets({ debts = [] }) {
  // 1. Calculate actual overall totals
  const totalDebt = debts.reduce((acc, d) => acc + Number(d.total_amount || 0), 0);
  const totalRemaining = debts.reduce((acc, d) => acc + Number(d.remaining_balance || 0), 0);
  const totalPaid = Math.max(0, totalDebt - totalRemaining);

  // Settlement rate starts at 0% when no payments have been made
  const settlementRate = totalDebt > 0 ? Math.min(100, Math.round((totalPaid / totalDebt) * 100)) : 0;

  // Category counts
  const regularDebts = debts.filter((d) => (d.type || 'debt') === 'debt');
  const installmentDebts = debts.filter((d) => d.type === 'installment');
  const clearedDebts = debts.filter((d) => Number(d.remaining_balance) <= 0);

  // Concentric ring fill percentages
  const ring1 = settlementRate;
  const ring2 = debts.length > 0 ? Math.min(100, Math.round((clearedDebts.length / debts.length) * 100)) : 0;

  // 2. Compute actual payments made this week by day of week (Monday to Sunday)
  const { weeklyData, currentDayIndex, weeklyTotal, weekChangePct } = useMemo(() => {
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const buckets = [
      { day: 'M', regular: 0, installment: 0 },
      { day: 'T', regular: 0, installment: 0 },
      { day: 'W', regular: 0, installment: 0 },
      { day: 'T', regular: 0, installment: 0 },
      { day: 'F', regular: 0, installment: 0 },
      { day: 'S', regular: 0, installment: 0 },
      { day: 'S', regular: 0, installment: 0 },
    ];

    const now = new Date();
    // JavaScript getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
    // Convert to Monday = 0, Sunday = 6
    const jsDay = now.getDay();
    const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

    // Calculate start of current week (Monday)
    const monday = new Date(now);
    monday.setDate(now.getDate() - todayIndex);
    monday.setHours(0, 0, 0, 0);

    let thisWeekSum = 0;

    debts.forEach((debt) => {
      const isInst = debt.type === 'installment';
      if (debt.installments && debt.installments.length > 0) {
        debt.installments.forEach((inst) => {
          const pDate = new Date(inst.payment_date);
          if (pDate >= monday && pDate <= now) {
            const pDay = pDate.getDay();
            const idx = pDay === 0 ? 6 : pDay - 1;
            const amt = Number(inst.amount_paid) || 0;
            if (isInst) {
              buckets[idx].installment += amt;
            } else {
              buckets[idx].regular += amt;
            }
            thisWeekSum += amt;
          }
        });
      }
    });

    // Provide baseline visualization so the curve stays smooth when starting
    const formattedBuckets = buckets.map((b) => ({
      ...b,
      regularPlot: b.regular > 0 ? b.regular : (thisWeekSum > 0 ? 0 : 2),
      installmentPlot: b.installment > 0 ? b.installment : (thisWeekSum > 0 ? 0 : 1),
    }));

    return {
      weeklyData: formattedBuckets,
      currentDayIndex: todayIndex,
      weeklyTotal: thisWeekSum,
      weekChangePct: settlementRate > 0 ? `+${settlementRate}%` : '0%',
    };
  }, [debts, settlementRate]);

  return (
    <div className="widgets-dual-container">
      {/* ---------------- CARD 1: WEEKLY PROGRESS ---------------- */}
      <div className="matte-card">
        <div className="card-top-bar">
          <div>
            <h3 className="card-heading">Weekly progress</h3>
            <div className="legend-row">
              <span className="legend-item">
                <span className="dot dot-black"></span> Regular ({regularDebts.length})
              </span>
              <span className="legend-item">
                <span className="dot dot-gray"></span> Installments ({installmentDebts.length})
              </span>
            </div>
          </div>
        </div>

        {/* Floating Percentage Badge & Working Chart */}
        <div className="chart-relative-box">
          <div className="floating-badge">{weekChangePct}</div>
          <div style={{ width: '100%', height: 110 }}>
            <ResponsiveContainer>
              <AreaChart data={weeklyData} margin={{ top: 14, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111827" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="regularPlot"
                  stroke="#111827"
                  strokeWidth={2.5}
                  fill="url(#curveFill)"
                />
                <Area
                  type="monotone"
                  dataKey="installmentPlot"
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day Strip - Automatically highlights today's day */}
        <div className="day-strip">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className={`day-pill ${i === currentDayIndex ? 'active' : ''}`}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CARD 2: MONTH PROGRESS ---------------- */}
      <div className="matte-card">
        <div className="card-top-bar">
          <div>
            <h3 className="card-heading">Month progress</h3>
            <span className="sub-compare">
              {settlementRate > 0 ? `+${settlementRate}% cleared to date` : 'No payments settled yet'}
            </span>
          </div>
        </div>

        {/* Legend + Dynamic Concentric Ring */}
        <div className="gauge-middle-section">
          <div className="categories-stack">
            <div className="cat-item">
              <span className="dot dot-black"></span>
              <span>Debts ({regularDebts.length})</span>
            </div>
            <div className="cat-item">
              <span className="dot dot-gray"></span>
              <span>Installment ({installmentDebts.length})</span>
            </div>
            <div className="cat-item">
              <span className="dot dot-light"></span>
              <span>Cleared ({clearedDebts.length})</span>
            </div>
          </div>

          <div className="concentric-ring-box">
            <svg viewBox="0 0 100 100" className="concentric-svg">
              {/* Outer track & fill: Principal Settled % */}
              <circle cx="50" cy="50" r="42" stroke="#f3f4f6" strokeWidth="5.5" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#111827"
                strokeWidth="5.5"
                fill="none"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * ring1) / 100}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />

              {/* Inner track & fill: Obligations Cleared % */}
              <circle cx="50" cy="50" r="32" stroke="#f3f4f6" strokeWidth="5" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="32"
                stroke="#9ca3af"
                strokeWidth="5"
                fill="none"
                strokeDasharray="201"
                strokeDashoffset={201 - (201 * ring2) / 100}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="ring-inner-metric">
              <span className="pct-text">{settlementRate}%</span>
              <span className="pct-sub">settled</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
