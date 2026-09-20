import { useState } from 'react';
import { addInstallment } from '../services/installmentApi';

export default function AddPaymentModal({ debt, onPaymentSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addInstallment(debt.id, parseFloat(amount), debt.remaining_balance);
      setAmount('');
      onPaymentSuccess();
    } catch (err) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-action-panel">
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={debt.remaining_balance}
          placeholder="Pay amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ flex: '1' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Pay Installment'}
        </button>
      </form>
    </div>
  );
}
