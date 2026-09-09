import { useState, useEffect } from 'react';
import api from '../api/client';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/dashboard').then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Загрузка...</div>;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Повторить</button>
    </div>
  );

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Дашборд</h1>
      <p className="text-xs text-slate-400 mb-6">Northstar Demo · Синтетические данные для демонстрации</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Студентов', value: data.students_count, icon: '🎓' },
          { label: 'Активных групп', value: data.active_groups, icon: '👥' },
          { label: 'Оплаты (demo)', value: fmt(data.payments_month), icon: '💰' },
          { label: 'Задолженность', value: data.overdue_count, icon: '⚠️' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border p-5">
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="text-sm text-slate-500">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">Ближайшие занятия</h2>
        {!data.upcoming_schedules?.length ? (
          <p className="text-slate-400">Нет предстоящих занятий</p>
        ) : (
          <div className="space-y-3">
            {data.upcoming_schedules.map(s => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-slate-400">{s.group_name} · {s.room} · {s.teacher_name}</p>
                </div>
                <span className="text-sm text-slate-500">{new Date(s.starts_at).toLocaleString('ru-RU')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
