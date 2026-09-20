import { useState } from 'react';
import { addDebt, recordPayment } from '../services/debtApi';
import { supabase } from '../lib/supabase';

export default function AddDebtForm({ onDebtAdded }) {
  const [type, setType] = useState('debt');
  const [amount, setAmount] = useState('');
  const [priorPaid, setPriorPaid] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('education');
  const [otherCategory, setOtherCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const parsedPriorPaid = parseFloat(priorPaid) || 0;
  const parsedMonths = parseInt(tenureMonths, 10) || 0;

  const handleMonthsChange = (val) => {
    setTenureMonths(val);
    const months = parseInt(val, 10) || 0;
    if (months > 0 && parsedAmount > 0) {
      setMonthlyAmount((parsedAmount / months).toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'debt' && parsedPriorPaid > parsedAmount) {
      alert('Prior paid amount cannot exceed total obligation amount.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

    const initialRemaining = type === 'installment' ? parsedAmount : parsedAmount - parsedPriorPaid;

      // 1. Create debt with accurate remaining balance
      const newDebt = await addDebt({
        user_id: user.id,
        title: category === 'other' ? otherCategory.trim() : category.charAt(0).toUpperCase() + category.slice(1),
        total_amount: parsedAmount,
        remaining_balance: type === 'installment' ? parsedAmount : initialRemaining,
        type: type,
        tenure_months: type === 'installment' ? parsedMonths : null,
        monthly_amount: type === 'installment' ? parseFloat(monthlyAmount) : null,
        due_day: type === 'installment' ? parseInt(dueDay, 10) : null,
        start_date: type === 'installment' ? startDate : null,
        category,
        category_other: category === 'other' ? otherCategory.trim() : null,
      });

      // 2. If there were prior payments, log an initial installment entry
      if (type === 'debt' && parsedPriorPaid > 0 && newDebt && newDebt[0]) {
        await recordPayment(
          newDebt[0].id,
          parsedPriorPaid,
          initialRemaining,
          new Date().toISOString()
        );
      }

      setAmount('');
      setPriorPaid('');
      setTenureMonths('');
      setMonthlyAmount('');
      setDueDay('5');
      setStartDate(new Date().toISOString().split('T')[0]);
      setCategory('education');
      setOtherCategory('');
      onDebtAdded();
    } catch (err) {
      alert(`Error creating entry: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel debt-form-panel" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => setType('debt')}
          className={`filter-btn ${type === 'debt' ? 'active' : ''}`}
          style={{ padding: '8px 18px' }}
        >
          Regular Debt
        </button>
        <button
          type="button"
          onClick={() => setType('installment')}
          className={`filter-btn ${type === 'installment' ? 'active' : ''}`}
          style={{ padding: '8px 18px' }}
        >
          Monthly Installment
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        <div className="debt-category-row">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>
          {category === 'other' && <input type="text" placeholder="State category" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} required />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: type === 'installment' ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr', gap: '12px', width: '100%' }}>
          {type === 'debt' && <input
            type="number"
            step="0.01"
            min="1"
            placeholder="Total (MYR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />}
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Prior Paid (MYR)"
            value={priorPaid}
            onChange={(e) => setPriorPaid(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
            title="Amount you have already paid off before tracking here"
          />
          {type === 'installment' && (
            <input
              type="number"
              min="1"
              max="360"
              placeholder="Tenure (Months)"
              value={tenureMonths}
              onChange={(e) => handleMonthsChange(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          )}
        </div>

        {type === 'installment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>
                MONTHLY PAYMENT (MYR)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 450.00"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>
                PAYMENT DUE DAY (1 - 31 OF MONTH)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 5 (5th of every month)"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '4px' }}>
              STARTED PAYING
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {parsedPriorPaid > 0 && (
              <>Net balance to track: <strong>RM {(parsedAmount - parsedPriorPaid).toFixed(2)}</strong></>
            )}
          </span>
          <button type="submit" disabled={loading} style={{ padding: '10px 24px' }}>
            {loading ? 'Saving...' : type === 'installment' ? 'Save Installment Schedule' : 'Add Debt Obligation'}
          </button>
        </div>
      </form>
    </div>
  );
}
