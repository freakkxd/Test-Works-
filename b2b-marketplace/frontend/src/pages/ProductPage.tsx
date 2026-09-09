import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, cartApi, reviewsApi } from '../api/client';
import { useAuthStore, useCartStore } from '../store/authStore';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getOne(id!).then((r) => r.data),
    enabled: !!id,
  });

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(id!, quantity),
    onSuccess: () => {
      cartApi.get().then((r) => setItemCount(r.data.items.length));
      alert('Товар добавлен в корзину!');
    },
  });

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.create(id!, reviewRating, reviewComment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setReviewComment('');
    },
  });

  if (isLoading) return <div className="text-center py-20">Загрузка...</div>;
  if (!product) return <div className="text-center py-20">Товар не найден</div>;

  const price = Number(product.price).toLocaleString('ru-RU');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Галерея */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
            <img
              src={product.images[selectedImage] || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    idx === selectedImage ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Информация */}
        <div>
          <p className="text-sm text-gray-500 mb-1">{product.brand} · {product.category.name}</p>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-primary-600">{price} ₽</span>
            <div className="flex items-center gap-1 text-yellow-500">
              {'★'.repeat(Math.round(product.rating))}
              <span className="text-gray-600 ml-1">
                {product.rating.toFixed(1)} ({product.ratingCount} отзывов)
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Характеристики */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Характеристики</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b py-1">
                    <dt className="text-gray-500">{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Добавить в корзину */}
          {product.stock > 0 ? (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  addToCart.mutate();
                }}
                disabled={addToCart.isPending}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Добавить в корзину
              </button>
            </div>
          ) : (
            <p className="text-red-500 font-medium mb-8">Нет в наличии</p>
          )}
        </div>
      </div>

      {/* Отзывы */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Отзывы ({product.reviews?.length || 0})</h2>

        {user && (
          <form
            onSubmit={(e) => { e.preventDefault(); submitReview.mutate(); }}
            className="bg-white rounded-xl border p-6 mb-8"
          >
            <h3 className="font-medium mb-4">Оставить отзыв</h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl ${star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Ваш отзыв..."
              className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
              rows={3}
            />
            <button
              type="submit"
              disabled={submitReview.isPending}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              Отправить
            </button>
          </form>
        )}

        <div className="space-y-4">
          {product.reviews?.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{review.user.name || 'Пользователь'}</span>
                <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
              </div>
              {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
