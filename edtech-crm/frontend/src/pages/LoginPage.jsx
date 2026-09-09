import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api/client';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await auth.login(form.email, form.password);
      localStorage.setItem('token', data.token);
      onLogin(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">EdTech CRM</h1>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required className="w-full border rounded-lg px-4 py-3"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Пароль" required className="w-full border rounded-lg px-4 py-3"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 font-medium">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <div className="mt-6 p-4 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
          <p className="font-medium">Demo-аккаунты (Northstar Demo):</p>
          <p>admin@demo-edtech.local / admin123</p>
          <p>manager@demo-edtech.local / manager123</p>
          <p>teacher@demo-edtech.local / teacher123</p>
          <p>student@demo-edtech.local / student123</p>
        </div>
      </div>
    </div>
  );
}
