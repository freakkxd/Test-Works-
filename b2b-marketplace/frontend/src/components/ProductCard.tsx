import { Link } from 'react-router-dom';
import type { Product } from '../api/client';
import { formatCurrency, stockStatus } from '../utils/format';
import { ProductImage, getProductImageUrl } from './ProductImage';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const stock = stockStatus(product.stock);
  const hasDiscount = product.oldPrice && Number(product.oldPrice) > Number(product.price);
  const imageUrl = getProductImageUrl(product);

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl shadow-sm border hover:shadow-md transition overflow-hidden group block"
    >
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        <ProductImage
          src={imageUrl}
          alt={product.name}
          className="group-hover:scale-105 transition-transform duration-300"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Скидка
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.brand} · {product.sku}</p>
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-primary-600">{formatCurrency(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.oldPrice!)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            ★ {product.rating.toFixed(1)}
            <span className="text-gray-400">({product.ratingCount})</span>
          </div>
          <span className={`text-xs ${stock.color}`}>{stock.label}</span>
        </div>
      </div>
    </Link>
  );
}
