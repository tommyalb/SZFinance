import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

export default function DueScheduleChart({ debts }) {
  // Filter active installments that still have balance
  const installments = useMemo(() => {
    return debts.filter(
      (d) => d.type === 'installment' && Number(d.remaining_balance) > 0 && d.monthly_amount
    );
  }, [debts]);

  // Group installments by their due day (1 - 31)
  const chartData = useMemo(() => {
    const dayMap = {};

    installments.forEach((item) => {
      const day = item.due_day || 1;
      if (!dayMap[day]) {
        dayMap[day] = {
          dayLabel: `Day ${day}`,
          dayNumber: day,
          totalDue: 0,
          items: [],
        };
      }
      dayMap[day].totalDue += Number(item.monthly_amount);
      dayMap[day].items.push({
        title: item.title,
        amount: Number(item.monthly_amount),
      });
    });

    // Sort by day number
    return Object.values(dayMap).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [installments]);

  // Calculate current month's total due across all installments
  const totalMonthlyDue = installments.reduce((acc, curr) => acc + Number(curr.monthly_amount || 0), 0);

  // Custom tooltip to show breakdown of which loans are due on that day
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#111827',
          color: '#ffffff',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: '800', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            Due on the {data.dayNumber}th of this month
          </div>
          {data.items.map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', margin: '3px 0' }}>
              <span style={{ color: '#9ca3af' }}>{it.title}:</span>
              <span style={{ fontWeight: '700' }}>{formatCurrency(it.amount)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '6px', paddingTop: '4px', fontWeight: '800', color: '#10b981' }}>
            Total: {formatCurrency(data.totalDue)}
          </div>
        </div>
      );
    }
    return null;
  };

  if (installments.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel" style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Monthly Payment Due Schedule</h3>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>
            Payment load distribution across upcoming monthly due dates
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>TOTAL DUE THIS MONTH</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>
            {formatCurrency(totalMonthlyDue)}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.42)" />
            <XAxis dataKey="dayLabel" stroke="#374151" fontSize={11} tickLine={false} tick={{ fill: '#374151', fontWeight: 600 }} />
            <YAxis stroke="#374151" fontSize={11} tickLine={false} tick={{ fill: '#374151', fontWeight: 600 }} tickFormatter={(val) => `RM${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalDue" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#111827" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
