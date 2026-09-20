import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function DueBeforeFifthWidget({ debts = [], monthOffset = 1 }) {
  const parseLocalDate = (value) => {
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const cycleStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 6);
  const cycleEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), 5);
  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(monthStart);
  const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
  const nextDueLabel = `5th of ${monthName}`;
  // Find all active installments due on or before the 5th
  const { earlyDebts, totalDueBeforeFifth } = useMemo(() => {
    const list = debts.filter((d) => {
      if (d.type !== 'installment' || Number(d.remaining_balance) <= 0 || !d.monthly_amount) return false;
      const dueDay = Number(d.due_day || 1);
      const cycleEndDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 5, 23, 59, 59);
      const cycleStartDate = new Date(today.getFullYear(), today.getMonth() + monthOffset - 1, 6);
      const dueDate = dueDay <= 5
        ? new Date(cycleEndDate.getFullYear(), cycleEndDate.getMonth(), dueDay)
        : new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), dueDay);
      if (dueDate < cycleStartDate || dueDate > cycleEndDate) return false;
      if (d.start_date && dueDate < parseLocalDate(d.start_date)) return false;
      return !(d.installments || []).some((payment) => {
        const paidDate = parseLocalDate(payment.payment_date);
        return paidDate >= cycleStartDate && paidDate <= cycleEndDate;
      });
    });

    const sum = list.reduce((acc, curr) => acc + Number(curr.monthly_amount), 0);
    return { earlyDebts: list, totalDueBeforeFifth: sum };
  }, [debts]);

  return (
    <div className="matte-card early-due-card">
      <div className="card-top-bar">
        <div>
          <h3 className="card-heading">Due By 5th</h3>
          <span className="sub-compare">Cycle: {shortDate.format(cycleStart)} – {shortDate.format(cycleEnd)}</span>
        </div>
      </div>

      <div style={{ margin: '12px 0 10px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
          {formatCurrency(totalDueBeforeFifth)}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', fontWeight: '600' }}>
          Total required by the 5th of each month
        </div>
      </div>

      <div className="early-due-list">
        {earlyDebts.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', padding: '6px 0' }}>
            No installments due on or before the 5th.
          </div>
        ) : (
          earlyDebts.map((item) => (
            <div key={item.id} className="early-due-item">
              <div>
                <span className="early-item-title">{item.title}</span>
                <span className="early-item-day">Due: {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(today.getFullYear(), today.getMonth() + monthOffset - (Number(item.due_day || 1) <= 5 ? 0 : 1), Number(item.due_day || 1)))}</span>
              </div>
              <span className="early-item-amount">{formatCurrency(item.monthly_amount)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
