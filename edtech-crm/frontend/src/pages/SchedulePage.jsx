import { useState, useEffect } from 'react';
import { schedules } from '../api/client';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('week');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', teacher_id: '3', group_name: 'Группа A', room: 'Каб. 101',
    starts_at: '', ends_at: '', course_id: '1',
  });

  const load = async () => {
    const from = new Date();
    from.setDate(from.getDate() - from.getDay() + 1);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    const { data } = await schedules.list({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    setEvents(data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await schedules.create(form);
    setShowForm(false);
    load();
  };

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

  const getEventsForDay = (dayOffset) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayOffset);
    return events.filter(e => {
      const start = new Date(e.starts_at);
      return start.toDateString() === day.toDateString();
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Расписание</h1>
        <div className="flex gap-2">
          {['week', 'day'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm ${view === v ? 'bg-brand-600 text-white' : 'border hover:bg-slate-50'}`}>
              {v === 'week' ? 'Неделя' : 'День'}
            </button>
          ))}
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm">
            + Занятие
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-6 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Название" required className="border rounded-lg px-3 py-2 col-span-2"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Группа" required className="border rounded-lg px-3 py-2"
            value={form.group_name} onChange={e => setForm({ ...form, group_name: e.target.value })} />
          <input placeholder="Кабинет" required className="border rounded-lg px-3 py-2"
            value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
          <input type="datetime-local" required className="border rounded-lg px-3 py-2"
            value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
          <input type="datetime-local" required className="border rounded-lg px-3 py-2"
            value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Сохранить</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg">Отмена</button>
          </div>
        </form>
      )}

      {/* Календарь недели */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, idx) => {
          const dayEvents = getEventsForDay(idx);
          const date = new Date(weekStart);
          date.setDate(date.getDate() + idx);

          return (
            <div key={day} className="bg-white rounded-xl border min-h-[200px]">
              <div className="p-3 border-b text-center">
                <p className="font-medium text-sm">{day}</p>
                <p className="text-xs text-slate-400">{date.getDate()}.{date.getMonth() + 1}</p>
              </div>
              <div className="p-2 space-y-1">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="bg-brand-50 border border-brand-200 rounded-lg p-2 text-xs">
                    <p className="font-medium truncate">{ev.title}</p>
                    <p className="text-slate-500">{ev.room} · {ev.group_name}</p>
                    <p className="text-slate-400">
                      {new Date(ev.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
