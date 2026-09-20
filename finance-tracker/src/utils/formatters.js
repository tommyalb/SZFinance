export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

export const formatDate = (dateString) => {
  const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
  const localDate = year && month && day ? new Date(year, month - 1, day) : new Date(dateString);
  return localDate.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
