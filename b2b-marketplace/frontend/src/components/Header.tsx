import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store/authStore';

export function Header() {
  const { user, logout, isAdmin } = useAuthStore();
  const { itemCount } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="northstar-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary-600 tracking-tight">
            ◆ Northstar Demo
          </Link>

          <nav className="flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-primary-600 transition text-sm font-medium">
              Каталог
            </Link>

            {user && (
              <>
                <Link to="/cart" className="text-slate-600 hover:text-primary-600 transition text-sm font-medium relative">
                  Корзина
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link to="/orders" className="text-slate-600 hover:text-primary-600 transition text-sm font-medium">
                  Мои заказы
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className="text-slate-600 hover:text-primary-600 transition text-sm font-medium">
                    Админка
                  </Link>
                )}
              </>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">{user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="northstar-btn-primary px-4 py-2 text-sm"
              >
                Войти
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
