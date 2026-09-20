import { formatCurrency } from '../utils/formatters';

export default function PaymentReminders({ debts = [] }) {
  const today = new Date().getDate();
  const upcoming = debts.filter((d) => Number(d.remaining_balance) > 0 && Number(d.due_day || 1) >= today).sort((a, b) => Number(a.due_day || 1) - Number(b.due_day || 1)).slice(0, 3);
  if (!upcoming.length) return null;
  return <section className="reminders-panel glass-panel"><div><h3>Upcoming payments</h3><p>Stay ahead of your next commitments.</p></div><div className="reminder-list">{upcoming.map((debt) => <div className="reminder-row" key={debt.id}><span><b>{debt.title}</b><small>Due on the {debt.due_day || 1}th</small></span><strong>{formatCurrency(debt.monthly_amount || debt.remaining_balance)}</strong></div>)}</div></section>;
}
