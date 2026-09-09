import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi, ordersApi, paymentsApi } from '../api/client';
import { useCartStore } from '../store/authStore';

export function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setItemCount } = useCartStore();

  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', address: '', comment: '' });

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
  });

  const updateQuantity = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.update(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => cartApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      cartApi.get().then((r) => setItemCount(r.data.items.length));
    },
  });

  const createOrder = useMutation({
    mutationFn: () => ordersApi.create(form),
    onSuccess: async (res) => {
      const payment = await paymentsApi.create(res.data.id);
      if (payment.data.confirmationUrl) {
        // В тестовом режиме симулируем оплату
        await paymentsApi.simulate(res.data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setItemCount(0);
      navigate('/orders');
    },
  });

  if (isLoading) return <div className="text-center py-20">Загрузка...</div>;

  const items = cart?.items || [];
  const total = cart?.total || 0;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <button onClick={() => navigate('/')} className="text-primary-600 hover:underline">
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border p-4 flex gap-4">
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-medium">{item.product.name}</h3>
              <p className="text-sm text-gray-500">{item.product.brand}</p>
              <p className="text-primary-600 font-bold mt-1">
                {Number(item.product.price).toLocaleString('ru-RU')} ₽
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                  className="px-2 py-1 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="px-3 py-1 border-x">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                  className="px-2 py-1 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem.mutate(item.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
          Оплата работает в демонстрационном режиме. Реальные списания не выполняются.
        </div>
        <div className="flex justify-between text-xl font-bold mb-6">
          <span>Итого:</span>
          <span>{total.toLocaleString('ru-RU')} ₽</span>
        </div>

        {!showCheckout ? (
          <button
            onClick={() => setShowCheckout(true)}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
          >
            Оформить заказ
          </button>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); createOrder.mutate(); }}
            className="space-y-4"
          >
            <h3 className="font-medium">Данные для доставки</h3>
            <input
              required
              placeholder="Имя"
              className="w-full border rounded-lg px-3 py-2"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
            <input
              required
              placeholder="Телефон"
              className="w-full border rounded-lg px-3 py-2"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            />
            <input
              required
              placeholder="Адрес доставки"
              className="w-full border rounded-lg px-3 py-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <textarea
              placeholder="Комментарий к заказу"
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium"
            >
              {createOrder.isPending ? 'Оформление...' : 'Подтвердить и оплатить'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
