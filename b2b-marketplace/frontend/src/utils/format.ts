export const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(value));

export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDateTime = (date: string | Date) =>
  new Date(date).toLocaleString('ru-RU');

export const stockStatus = (stock: number): { label: string; color: string } => {
  if (stock === 0) return { label: 'Нет в наличии', color: 'text-red-500' };
  if (stock <= 5) return { label: `Мало (${stock} шт.)`, color: 'text-orange-500' };
  return { label: `В наличии: ${stock} шт.`, color: 'text-green-600' };
};
