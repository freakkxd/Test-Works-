import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, ordersApi, demoApi, type Product } from '../api/client';

export function AdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: 0, brand: '', stock: 0,
    images: ['https://picsum.photos/800/600'], categoryId: '',
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.getAll({ limit: 100 }).then((r) => r.data),
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => ordersApi.getAll().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then((r) => r.data),
  });

  const [reseedMsg, setReseedMsg] = useState('');

  const reseedDemo = useMutation({
    mutationFn: () => demoApi.reset(),
    onSuccess: (res) => {
      setReseedMsg(`Демо-каталог обновлён: ${res.data.products} товаров`);
      queryClient.invalidateQueries();
    },
  });

  const saveProduct = useMutation({
    mutationFn: () =>
      editProduct
        ? productsApi.update(editProduct.id, form)
        : productsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowForm(false);
      setEditProduct(null);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: Number(product.price),
      brand: product.brand,
      stock: product.stock,
      images: product.images,
      categoryId: product.category.id,
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Панель администратора</h1>
          <p className="text-xs text-gray-400 mt-1">Синтетические данные для демонстрации</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Перегенерировать демо-каталог?')) reseedDemo.mutate();
          }}
          disabled={reseedDemo.isPending}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          {reseedDemo.isPending ? 'Генерация...' : 'Перегенерировать демо-каталог'}
        </button>
      </div>
      {reseedMsg && <p className="text-sm text-green-600 mb-4">{reseedMsg}</p>}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
        Оплата работает в демонстрационном режиме. Реальные списания не выполняются.
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-lg font-medium ${
            tab === 'products' ? 'bg-primary-600 text-white' : 'bg-gray-100'
          }`}
        >
          Товары
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium ${
            tab === 'orders' ? 'bg-primary-600 text-white' : 'bg-gray-100'
          }`}
        >
          Заказы
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="flex justify-between mb-6">
            <p className="text-gray-500">Всего: {products?.meta.total || 0} товаров</p>
            <button
              onClick={() => {
                setEditProduct(null);
                setForm({ name: '', description: '', price: 0, brand: '', stock: 0, images: ['https://picsum.photos/800/600'], categoryId: categories?.[0]?.id || '' });
                setShowForm(true);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              + Добавить товар
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h3 className="font-bold mb-4">{editProduct ? 'Редактировать' : 'Новый товар'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Название" className="border rounded-lg px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Бренд" className="border rounded-lg px-3 py-2" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                <input type="number" placeholder="Цена" className="border rounded-lg px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                <input type="number" placeholder="Остаток" className="border rounded-lg px-3 py-2" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                <select className="border rounded-lg px-3 py-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <textarea placeholder="Описание" className="border rounded-lg px-3 py-2 col-span-2" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => saveProduct.mutate()} className="bg-primary-600 text-white px-6 py-2 rounded-lg">Сохранить</button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg border">Отмена</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">Товар</th>
                  <th className="text-left p-4">Бренд</th>
                  <th className="text-right p-4">Цена</th>
                  <th className="text-right p-4">Остаток</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {products?.data.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-gray-500">{p.brand}</td>
                    <td className="p-4 text-right">{Number(p.price).toLocaleString('ru-RU')} ₽</td>
                    <td className="p-4 text-right">{p.stock}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEdit(p)} className="text-primary-600 hover:underline">Изменить</button>
                      <button onClick={() => deleteProduct.mutate(p.id)} className="text-red-500 hover:underline">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {orders?.data.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{order.customerName} · {order.customerPhone}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus.mutate({ id: order.id, status: e.target.value })}
                  className="border rounded-lg px-3 py-1 text-sm"
                >
                  {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <p className="text-lg font-bold">{Number(order.totalAmount).toLocaleString('ru-RU')} ₽</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
