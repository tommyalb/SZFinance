import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { deleteDebt, recordPayment } from '../services/debtApi';
import AddPaymentModal from './AddPaymentModal';

export default function DebtCard({ debt, refreshData }) {
  const [showPastModal, setShowPastModal] = useState(false);
  const [pastMonthsCount, setPastMonthsCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInstallment = debt.type === 'installment';
  const progress = Math.min(
    100,
    Math.max(0, ((debt.total_amount - debt.remaining_balance) / debt.total_amount) * 100)
  );

  const paymentsCount = debt.installments ? debt.installments.length : 0;
  const remainingMonths = debt.tenure_months ? Math.max(0, debt.tenure_months - paymentsCount) : null;

  const handleDelete = async () => {
    if (window.confirm(`Delete "${debt.title}" and all payment records?`)) {
      try {
        await deleteDebt(debt.id);
        refreshData();
      } catch (err) {
        alert(`Deletion error: ${err.message}`);
      }
    }
  };

  // Bulk log previous months paid before tracking
  const handleLogPastMonths = async (e) => {
    e.preventDefault();
    const count = parseInt(pastMonthsCount, 10);
    if (!count || count <= 0) return;

    const monthlyPay = Number(debt.monthly_amount) || (debt.total_amount / (debt.tenure_months || 1));
    const totalToDeduct = monthlyPay * count;

    if (totalToDeduct > Number(debt.remaining_balance)) {
      alert('The total for these months exceeds the current remaining balance.');
      return;
    }

    setIsSubmitting(true);
    try {
      let currentBal = Number(debt.remaining_balance);
      const now = new Date();

      // Loop and create an installment row for each past month
      for (let i = count; i >= 1; i--) {
        const pastDate = new Date(now.getFullYear(), now.getMonth() - i, debt.due_day || 1);
        currentBal -= monthlyPay;
        await recordPayment(
          debt.id,
          monthlyPay,
          Math.max(0, currentBal),
          pastDate.toISOString()
        );
      }

      setShowPastModal(false);
      refreshData();
    } catch (err) {
      alert(`Error logging past payments: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="item-card">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: isInstallment ? '#f3f4f6' : '#e5e7eb',
                color: '#374151',
                fontWeight: 700,
              }}
            >
              {isInstallment ? 'Installment' : 'Debt'}
            </span>
            <h4 style={{ margin: '8px 0 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              {debt.title}
            </h4>
          </div>

          <button 
            onClick={handleDelete} 
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style={{ marginTop: '14px', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          {formatCurrency(debt.remaining_balance)}
        </div>
        
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
          Initial: {formatCurrency(debt.total_amount)}
        </div>

        {isInstallment && (
          <div className="installment-details-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#6b7280' }}>Monthly Due:</span>
              <strong>{formatCurrency(debt.monthly_amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#6b7280' }}>Due Date:</span>
              <strong style={{ color: '#dc2626' }}>Every {debt.due_day || 1}th</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '4px' }}>
              <span style={{ color: '#6b7280' }}>
                Tenure: <strong>{paymentsCount} / {debt.tenure_months || 0} paid</strong> ({remainingMonths} left)
              </span>
              
              {/* Button to log past months */}
              {debt.remaining_balance > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPastModal(!showPastModal)}
                  style={{
                    background: '#f3f4f6',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  + Prior Months
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inline Dialog to add past months */}
        {showPastModal && (
          <form onSubmit={handleLogPastMonths} style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '10px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#111827' }}>Log Past Months Completed:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                min="1"
                max={debt.tenure_months ? debt.tenure_months - paymentsCount : 120}
                value={pastMonthsCount}
                onChange={(e) => setPastMonthsCount(e.target.value)}
                placeholder="Months"
                style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                required
              />
              <button type="submit" disabled={isSubmitting} style={{ padding: '6px 12px', fontSize: '11px', background: '#111827', color: '#fff' }}>
                {isSubmitting ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </form>
        )}

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
          <span>Settled</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        {debt.remaining_balance > 0 ? (
          <AddPaymentModal debt={debt} onPaymentSuccess={refreshData} />
        ) : (
          <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '700', padding: '8px 0' }}>
            Settlement Complete
          </div>
        )}

        {debt.installments && debt.installments.length > 0 && (
          <details style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
              Payment History ({debt.installments.length}) · {formatCurrency(debt.installments.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0))} paid
            </summary>
            <ul style={{ paddingLeft: '16px', margin: '8px 0 0 0', color: '#374151' }}>
              {debt.installments.map((inst, index) => (
                <li key={inst.id} style={{ marginBottom: '4px' }}>
                  Month {index + 1} ({formatDate(inst.payment_date)}) — {formatCurrency(inst.amount_paid)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
