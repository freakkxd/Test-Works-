import { useState, useEffect } from 'react';
import { payments, students } from '../api/client';

export default function PaymentsPage() {
  const [list, setList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: '', amount: '', due_date: '', description: '' });

  const load = async () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const { data } = await payments.list(params);
    setList(data.data || data);
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { students.list().then(r => setStudentsList(r.data.data || r.data)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await payments.create(form);
    setShowForm(false);
    load();
  };

  const markPaid = async (id) => {
    await payments.update(id, { status: 'paid' });
    load();
  };

  const handleExport = async () => {
    const { data } = await payments.exportCsv();
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
  };

  const statusLabel = { pending: 'Ожидает', paid: 'Оплачен', overdue: 'Просрочен' };
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Оплаты</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">Экспорт CSV</button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm">+ Счёт</button>
        </div>
      </div>

      <select className="border rounded-lg px-3 py-2 mb-6" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">Все статусы</option>
        <option value="pending">Ожидает</option>
        <option value="paid">Оплачен</option>
        <option value="overdue">Просрочен</option>
      </select>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 mb-6 grid grid-cols-2 gap-4">
          <select required className="border rounded-lg px-3 py-2" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
            <option value="">Студент</option>
            {studentsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" placeholder="Сумма" required className="border rounded-lg px-3 py-2" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <input type="date" required className="border rounded-lg px-3 py-2" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          <input placeholder="Описание" className="border rounded-lg px-3 py-2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Создать</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg">Отмена</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">Студент</th>
              <th className="text-right p-4">Сумма</th>
              <th className="text-left p-4">Срок</th>
              <th className="text-left p-4">Статус</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-4 font-medium">{p.student?.name}</td>
                <td className="p-4 text-right">{Number(p.amount).toLocaleString('ru-RU')} ₽</td>
                <td className="p-4 text-slate-500">{p.due_date}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {p.status === 'pending' && (
                    <button onClick={() => markPaid(p.id)} className="text-green-600 hover:underline text-xs">
                      Отметить оплаченным
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
