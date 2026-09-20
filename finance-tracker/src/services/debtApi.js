import { supabase } from '../lib/supabase';

// Fetch all debts along with their installment payment records
export async function getDebtsWithInstallments(userId) {
  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      installments (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Add a new debt or installment plan
export async function addDebt(debtData) {
  const { data, error } = await supabase
    .from('debts')
    .insert([debtData])
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Delete an obligation and its related records
export async function deleteDebt(debtId) {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', debtId);

  if (error) {
    throw new Error(error.message);
  }
}

// Record a payment / installment transaction
export async function recordPayment(debtId, amountPaid, newBalance, paymentDate = new Date().toISOString()) {
  // 1. Insert installment record
  const { error: paymentError } = await supabase
    .from('installments')
    .insert([
      {
        debt_id: debtId,
        amount_paid: amountPaid,
        payment_date: paymentDate,
      },
    ]);

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  // 2. Update remaining balance on parent debt
  const { error: updateError } = await supabase
    .from('debts')
    .update({ remaining_balance: newBalance })
    .eq('id', debtId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

// Alias export in case other components import addPayment
export const addPayment = recordPayment;