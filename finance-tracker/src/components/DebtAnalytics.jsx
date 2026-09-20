import { formatCurrency } from '../utils/formatters';

export default function DebtAnalytics({ debts = [] }) {
  const total = debts.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  const remaining = debts.reduce((sum, d) => sum + Number(d.remaining_balance || 0), 0);
  const paid = Math.max(0, total - remaining);
  const rate = total ? Math.round((paid / total) * 100) : 0;
  const monthly = debts.reduce((sum, d) => sum + Number(d.monthly_amount || 0), 0);
  return <section className="analytics-grid">
    <div className="analytics-card"><span>Total committed</span><strong>{formatCurrency(total)}</strong></div>
    <div className="analytics-card"><span>Paid so far</span><strong>{formatCurrency(paid)}</strong></div>
    <div className="analytics-card"><span>Monthly commitment</span><strong>{formatCurrency(monthly)}</strong></div>
    <div className="analytics-card"><span>Overall progress</span><strong>{rate}%</strong><div className="analytics-progress"><i style={{ width: `${rate}%` }} /></div></div>
  </section>;
}
