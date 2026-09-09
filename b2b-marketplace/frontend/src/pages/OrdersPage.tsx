import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/client';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Ожидает оплаты', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Оплачен', color: 'bg-green-100 text-green-800' },
  PROCESSING: { label: 'В обработке', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Отправлен', color: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Отменён', color: 'bg-red-100 text-red-800' },
};

export function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
  });

  if (isLoading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>

      {!orders?.length ? (
        <p className="text-gray-500 text-center py-12">У вас пока нет заказов</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100' };
            return (
              <div key={order.id} className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product.name} × {item.quantity}</span>
                      <span>{(Number(item.price) * item.quantity).toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  <div className="text-sm text-gray-500">
                    <p>{order.customerName} · {order.customerPhone}</p>
                    <p>{order.address}</p>
                  </div>
                  <span className="text-xl font-bold">
                    {Number(order.totalAmount).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
