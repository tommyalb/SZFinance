import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { deleteDebt, recordPayment } from '../services/debtApi';
import { deleteInstallment } from '../services/installmentApi';
import AddPaymentModal from './AddPaymentModal';

export default function DebtCard({ debt, refreshData }) {
  const [showPastModal, setShowPastModal] = useState(false);
  const [pastMonthsCount, setPastMonthsCount] = useState('1');
  const [pastPayments, setPastPayments] = useState([]);
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

  const handleDeletePayment = async (payment) => {
    if (!window.confirm('Remove this payment record? The amount will be returned to the remaining balance.')) return;
    try {
      await deleteInstallment(payment.id, debt.id, payment.amount_paid, debt.remaining_balance);
      refreshData();
    } catch (err) {
      alert(`Error removing payment: ${err.message}`);
    }
  };

  // Bulk log previous months paid before tracking
  const handleLogPastMonths = async (e) => {
    e.preventDefault();
    if (!pastPayments.length || pastPayments.some((payment) => !payment.date || Number(payment.amount) <= 0)) return;
    const totalToDeduct = pastPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    if (totalToDeduct > Number(debt.remaining_balance)) {
      alert('The total for these months exceeds the current remaining balance.');
      return;
    }

    setIsSubmitting(true);
    try {
      let currentBal = Number(debt.remaining_balance);

      // Loop and create an installment row for each past month
      for (const payment of [...pastPayments].sort((a, b) => new Date(a.date) - new Date(b.date))) {
        currentBal -= Number(payment.amount);
        await recordPayment(
          debt.id,
          Number(payment.amount),
          Math.max(0, currentBal),
          new Date(payment.date).toISOString()
        );
      }

      setShowPastModal(false);
      setPastPayments([]);
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
            {debt.start_date && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#6b7280' }}>Started Paying:</span>
              <strong>{formatDate(debt.start_date)}</strong>
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '4px' }}>
              <span style={{ color: '#6b7280' }}>
                Tenure: <strong>{paymentsCount} / {debt.tenure_months || 0} paid</strong> ({remainingMonths} left)
              </span>
              
              {/* Button to log past months */}
              {debt.remaining_balance > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowPastModal(!showPastModal); if (!showPastModal) setPastPayments([{ date: new Date().toISOString().split('T')[0], amount: debt.monthly_amount || '' }]); }}
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
          <form onSubmit={handleLogPastMonths} className="past-payments-form">
            <span className="past-payments-title">Add completed installments manually:</span>
            {pastPayments.map((payment, index) => <div className="past-payment-row" key={index}>
              <input type="date" value={payment.date} onChange={(e) => setPastPayments((items) => items.map((item, i) => i === index ? { ...item, date: e.target.value } : item))} required />
              <input type="number" min="0.01" step="0.01" placeholder="Amount" value={payment.amount} onChange={(e) => setPastPayments((items) => items.map((item, i) => i === index ? { ...item, amount: e.target.value } : item))} required />
              <button type="button" onClick={() => setPastPayments((items) => items.filter((_, i) => i !== index))}>×</button>
            </div>)}
            <button type="button" className="add-past-payment" onClick={() => setPastPayments((items) => [...items, { date: new Date().toISOString().split('T')[0], amount: debt.monthly_amount || '' }])}>+ Add another installment</button>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save completed payments'}</button>
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
                <li key={inst.id} style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                  <span>Month {index + 1} ({formatDate(inst.payment_date)}) — {formatCurrency(inst.amount_paid)}</span>
                  <button type="button" className="remove-payment-button" onClick={() => handleDeletePayment(inst)} title="Remove payment">×</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
