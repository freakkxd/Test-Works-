import { Link, useNavigate } from 'react-router-dom';
import { demo } from '../api/client';

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await onLogout(); } catch {}
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Дашборд', roles: ['admin', 'manager', 'teacher'] },
    { to: '/students', label: 'Студенты', roles: ['admin', 'manager', 'teacher'] },
    { to: '/schedule', label: 'Расписание', roles: ['admin', 'manager', 'teacher'] },
    { to: '/payments', label: 'Оплаты', roles: ['admin', 'manager'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="northstar-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold text-brand-600 tracking-tight">◆ Northstar Demo</Link>

          <nav className="flex items-center gap-6">
            {navItems.filter(n => n.roles.includes(user?.role)).map(n => (
              <Link key={n.to} to={n.to} className="text-slate-600 hover:text-brand-600 transition text-sm font-medium">
                {n.label}
              </Link>
            ))}

            {user?.role === 'admin' && (
              <button
                onClick={async () => {
                  if (confirm('Перегенерировать demo-данные?')) {
                    await demo.reseed();
                    window.location.reload();
                  }
                }}
                className="text-xs text-slate-500 hover:text-brand-600 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50"
                title="Синтетические данные для демонстрации"
              >
                ↻ Demo
              </button>
            )}

            <div className="flex items-center gap-3 ml-2">
              <span className="text-sm text-slate-500">{user?.name} ({user?.role})</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600 font-medium">Выйти</button>
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 mt-8 bg-white">Northstar Demo · Синтетические данные для демонстрации · Все данные искусственные</footer>
    </div>
  );
}
