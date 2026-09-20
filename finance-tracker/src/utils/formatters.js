export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};