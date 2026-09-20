import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function PaymentCalendar({ debts = [] }) {
  const days = useMemo(() => {
    const map = {};
    debts.filter((d) => d.type === 'installment' && Number(d.remaining_balance) > 0).forEach((debt) => {
      const day = Number(debt.due_day) || 1;
      if (!map[day]) map[day] = [];
      map[day].push(debt);
    });
    return map;
  }, [debts]);

  const month = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const selectedEntries = selectedDay ? (days[selectedDay] || []) : [];
  return (
    <section className="payment-calendar glass-panel">
      <div className="calendar-heading">
        <div><h3>Payment calendar</h3><p>{month} · upcoming commitments</p></div>
        <span>{Object.keys(days).length} payment days</span>
      </div>
      <div className="calendar-days">
        {Array.from({ length: 31 }, (_, index) => {
          const day = index + 1;
          const entries = days[day] || [];
          return <button type="button" key={day} className={`calendar-day ${entries.length ? 'has-payment' : ''} ${selectedDay === day ? 'selected' : ''}`} onClick={() => setSelectedDay(entries.length ? day : null)} title={entries.map((d) => d.title).join(', ')}><b>{day}</b>{entries.length > 0 && <small>{entries.length}</small>}</button>;
        })}
      </div>
      {selectedDay && <div className="calendar-details">
        <div className="calendar-details-title">Payments due on the {selectedDay}{selectedDay === 1 ? 'st' : selectedDay === 2 ? 'nd' : selectedDay === 3 ? 'rd' : 'th'}</div>
        {selectedEntries.map((debt) => <div className="calendar-detail-row" key={debt.id}><span><b>{debt.title}</b><small>Installment payment</small></span><strong>{formatCurrency(debt.monthly_amount)}</strong></div>)}
      </div>}
    </section>
  );
}
