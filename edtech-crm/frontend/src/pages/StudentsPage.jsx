import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { students, courses } from '../api/client';

export default function StudentsPage() {
  const [list, setList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', course_id: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (courseFilter) params.course_id = courseFilter;
      const { data } = await students.list(params);
      setList(data.data || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, courseFilter]);
  useEffect(() => { courses.list().then(r => setCoursesList(r.data)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await students.create(form);
    setShowForm(false);
    setForm({ name: '', email: '', phone: '', course_id: '' });
    load();
  };

  const handleExport = async () => {
    const { data } = await students.exportCsv();
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Студенты</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
            Экспорт CSV
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm">
            + Добавить
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input placeholder="Поиск..." className="border rounded-lg px-3 py-2 flex-1"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border rounded-lg px-3 py-2" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="">Все курсы</option>
          {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Имя" required className="border rounded-lg px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" type="email" required className="border rounded-lg px-3 py-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Телефон" className="border rounded-lg px-3 py-2" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <select required className="border rounded-lg px-3 py-2" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
            <option value="">Выберите курс</option>
            {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Сохранить</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg">Отмена</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">Имя</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Телефон</th>
              <th className="text-left p-4">Курс</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Загрузка...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Студенты не найдены</td></tr>
            ) : list.map(s => (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4 text-slate-500">{s.email}</td>
                <td className="p-4 text-slate-500">{s.phone || '—'}</td>
                <td className="p-4">{s.course?.name || '—'}</td>
                <td className="p-4 text-right">
                  <Link to={`/students/${s.id}`} className="text-brand-600 hover:underline">Карточка →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
