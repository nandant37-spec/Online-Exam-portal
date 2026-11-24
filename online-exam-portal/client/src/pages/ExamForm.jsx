import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { ErrorBox, PageHeader, Spinner } from '../components/ui';

// Date <-> <input type="datetime-local"> helpers (local time)
const toLocalInput = (d) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

export default function ExamForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    durationMinutes: 30,
    passPercent: 40,
    startTime: toLocalInput(new Date()),
    endTime: toLocalInput(Date.now() + 7 * 864e5),
  });

  useEffect(() => {
    (async () => {
      try {
        const q = await api.get('/questions');
        setBank(q.data);
        if (editing) {
          const { data: e } = await api.get(`/exams/${id}`);
          setForm({
            title: e.title,
            subject: e.subject,
            description: e.description || '',
            durationMinutes: e.durationMinutes,
            passPercent: e.passPercent,
            startTime: toLocalInput(e.startTime),
            endTime: toLocalInput(e.endTime),
          });
          setSelected(new Set(e.questions.map((x) => x._id)));
        }
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, editing]);

  const subjects = useMemo(() => [...new Set((bank || []).map((q) => q.subject))], [bank]);
  const visible = (bank || []).filter((q) => !filter || q.subject === filter);
  const totalMarks = (bank || []).filter((q) => selected.has(q._id)).reduce((s, q) => s + q.marks, 0);

  const toggle = (qid) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return next;
    });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        passPercent: Number(form.passPercent),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        questions: [...selected],
      };
      if (editing) await api.put(`/exams/${id}`, payload);
      else await api.post('/exams', payload);
      navigate('/exams');
    } catch (err) {
      setError(errMsg(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <form onSubmit={submit}>
      <PageHeader title={editing ? 'Edit exam' : 'Create exam'}>
        <Link to="/exams" className="btn-ghost">Cancel</Link>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save exam'}</button>
      </PageHeader>
      <ErrorBox message={error} />

      <div className="card mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Title</label>
          <input className="input" required value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label">Subject</label>
          <input className="input" required list="subjects" value={form.subject} onChange={set('subject')} />
          <datalist id="subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div className="md:col-span-2">
          <label className="label">Description (optional)</label>
          <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <input className="input" type="number" min={1} required value={form.durationMinutes} onChange={set('durationMinutes')} />
        </div>
        <div>
          <label className="label">Pass percentage</label>
          <input className="input" type="number" min={0} max={100} required value={form.passPercent} onChange={set('passPercent')} />
        </div>
        <div>
          <label className="label">Opens at</label>
          <input className="input" type="datetime-local" required value={form.startTime} onChange={set('startTime')} />
        </div>
        <div>
          <label className="label">Closes at</label>
          <input className="input" type="datetime-local" required value={form.endTime} onChange={set('endTime')} />
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            Select questions <span className="text-sm font-normal text-slate-500">({selected.size} selected · {totalMarks} marks)</span>
          </h2>
          <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {!bank?.length ? (
          <p className="text-sm text-slate-500">
            Your question bank is empty. <Link className="text-indigo-600" to="/questions">Add questions first</Link>.
          </p>
        ) : (
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {visible.map((q) => (
              <li key={q._id}>
                <label className="flex cursor-pointer items-start gap-3 py-2">
                  <input type="checkbox" className="mt-1" checked={selected.has(q._id)} onChange={() => toggle(q._id)} />
                  <span className="text-sm">
                    {q.text}
                    <span className="ml-2 text-xs text-slate-500">[{q.subject} · {q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
