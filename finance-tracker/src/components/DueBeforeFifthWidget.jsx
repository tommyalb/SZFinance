import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function DueBeforeFifthWidget({ debts = [], monthOffset = 1 }) {
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
      if (d.type !== 'installment' || Number(d.remaining_balance) <= 0 || !d.monthly_amount || Number(d.due_day || 1) > 5) return false;
      const dueDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, Number(d.due_day || 1));
      return !(d.installments || []).some((payment) => {
        const paidDate = new Date(payment.payment_date);
        return paidDate.getFullYear() === dueDate.getFullYear() && paidDate.getMonth() === dueDate.getMonth();
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
                <span className="early-item-day">Next due: {item.due_day || 1}{item.due_day === 1 ? 'st' : item.due_day === 2 ? 'nd' : item.due_day === 3 ? 'rd' : 'th'} of {monthName}</span>
              </div>
              <span className="early-item-amount">{formatCurrency(item.monthly_amount)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
