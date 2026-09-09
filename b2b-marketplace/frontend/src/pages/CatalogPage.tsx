import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, type ProductFilters } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { Pagination } from '../components/Pagination';
import { LoadingSkeleton } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export function CatalogPage() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then((r) => r.data),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => productsApi.getBrands().then((r) => r.data),
  });

  const updateFilter = (key: keyof ProductFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Каталог B2B</h1>
      <p className="text-sm text-gray-500 mb-8">Northstar Demo · Синтетические данные для демонстрации</p>

      <div className="flex gap-8">
        {/* Фильтры */}
        <aside className="w-64 shrink-0 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Поиск</label>
            <input
              type="text"
              placeholder="Название или описание..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Категория</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={filters.categoryId || ''}
              onChange={(e) => updateFilter('categoryId', e.target.value || undefined)}
            >
              <option value="">Все категории</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Бренд</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={filters.brand || ''}
              onChange={(e) => updateFilter('brand', e.target.value || undefined)}
            >
              <option value="">Все бренды</option>
              {brands?.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Цена, ₽</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="От"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
              <input
                type="number"
                placeholder="До"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Мин. рейтинг</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={filters.minRating || ''}
              onChange={(e) => updateFilter('minRating', e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Любой</option>
              <option value="4">4+ ★</option>
              <option value="3">3+ ★</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
            />
            Только в наличии
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Сортировка</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
              }}
            >
              <option value="createdAt-desc">Новинки</option>
              <option value="price-asc">Цена ↑</option>
              <option value="price-desc">Цена ↓</option>
              <option value="rating-desc">Рейтинг</option>
            </select>
          </div>
        </aside>

        {/* Список товаров */}
        <main className="flex-1">
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <ErrorState message="Не удалось загрузить каталог" onRetry={() => refetch()} />
          ) : !productsData?.data.length ? (
            <EmptyState
              title="Товары не найдены"
              description="Попробуйте изменить фильтры или перегенерировать демо-каталог в админке."
              actionLabel="Сбросить фильтры"
              onAction={() => setFilters({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' })}
            />
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Найдено: {productsData.meta.total} товаров
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                currentPage={productsData.meta.page}
                totalPages={productsData.meta.totalPages}
                onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
