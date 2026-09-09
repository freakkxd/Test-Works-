import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { students } from '../api/client';

function ProgressBar({ percent }) {
  return (
    <div className="w-full bg-slate-200 rounded-full h-3">
      <div
        className="bg-brand-600 h-3 rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    students.get(id).then(r => setStudent(r.data));
    students.progress(id).then(r => setProgress(r.data));
  }, [id]);

  const toggleLesson = async (lessonId) => {
    await students.toggleProgress(id, lessonId);
    const { data } = await students.progress(id);
    setProgress(data);
  };

  const getCertificate = async () => {
    try {
      const { data } = await students.certificate(id);
      setCertificate(data.certificate);
    } catch (err) {
      alert(err.response?.data?.message || 'Сертификат недоступен');
    }
  };

  if (!student) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{student.name}</h1>
      <p className="text-slate-500 mb-8">{student.email} · {student.phone || '—'} · {student.course?.name}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Прогресс обучения */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Прогресс обучения</h2>
          {progress && (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Завершено</span>
                  <span className="font-bold">{progress.completion_percent}%</span>
                </div>
                <ProgressBar percent={progress.completion_percent} />
              </div>

              <div className="space-y-2">
                {progress.modules?.map(({ lesson, completed }) => (
                  <div key={lesson.id} className="flex items-center justify-between py-2 border-b">
                    <span className={completed ? 'line-through text-slate-400' : ''}>{lesson.title}</span>
                    <button
                      onClick={() => toggleLesson(lesson.id)}
                      className={`text-xs px-3 py-1 rounded-full ${completed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-brand-100'}`}
                    >
                      {completed ? '✓ Завершён' : 'Отметить'}
                    </button>
                  </div>
                ))}
              </div>

              {progress.certificate_available && (
                <button onClick={getCertificate} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Получить сертификат
                </button>
              )}
            </>
          )}
        </div>

        {/* Оплаты */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">История оплат</h2>
          {student.payments?.length === 0 ? (
            <p className="text-slate-400">Нет платежей</p>
          ) : (
            <div className="space-y-3">
              {student.payments?.map(p => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{Number(p.amount).toLocaleString('ru-RU')} ₽</p>
                    <p className="text-xs text-slate-400">Срок: {p.due_date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === 'paid' ? 'bg-green-100 text-green-700' :
                    p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.status === 'paid' ? 'Оплачен' : p.status === 'overdue' ? 'Просрочен' : 'Ожидает'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Сертификат */}
      {certificate && (
        <div className="mt-8 bg-gradient-to-br from-brand-600 to-purple-700 text-white rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">🎓 Сертификат</h2>
          <p className="text-xl mb-1">{certificate.student_name}</p>
          <p className="opacity-80 mb-4">успешно завершил(а) курс «{certificate.course_name}»</p>
          <p className="text-sm opacity-60">ID: {certificate.certificate_id}</p>
        </div>
      )}
    </div>
  );
}
