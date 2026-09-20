import { supabase } from '../lib/supabase';

export const addInstallment = async (debtId, amountPaid, currentBalance, paymentDate) => {
  // 1. Record installment payment
  const { error: insertError } = await supabase
    .from('installments')
    .insert([{
      debt_id: debtId,
      amount_paid: amountPaid,
      payment_date: paymentDate || new Date().toISOString().split('T')[0],
    }]);

  if (insertError) throw insertError;

  // 2. Decrement remaining balance
  const newBalance = Math.max(0, currentBalance - amountPaid);
  const { error: updateError } = await supabase
    .from('debts')
    .update({ remaining_balance: newBalance })
    .eq('id', debtId);

  if (updateError) throw updateError;

  return newBalance;
};
