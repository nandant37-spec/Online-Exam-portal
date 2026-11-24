import { useMemo, useState } from 'react';
import api, { errMsg } from '../api';
import { Empty, ErrorBox, PageHeader, Spinner, useFetch } from '../components/ui';

const blank = { subject: '', topic: '', text: '', options: ['', '', '', ''], correctIndex: 0, marks: 1 };
const letters = ['A', 'B', 'C', 'D'];

function QuestionForm({ initial, onSaved, onCancel, subjects }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setOpt = (i, v) => setForm({ ...form, options: form.options.map((o, idx) => (idx === i ? v : o)) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, marks: Number(form.marks) };
      if (initial._id) await api.put(`/questions/${initial._id}`, payload);
      else await api.post('/questions', payload);
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mb-6 space-y-4">
      <h2 className="font-semibold">{initial._id ? 'Edit question' : 'Add question'}</h2>
      <ErrorBox message={error} />
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Subject</label>
          <input className="input" required list="q-subjects" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <datalist id="q-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label className="label">Topic (optional)</label>
          <input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        </div>
        <div>
          <label className="label">Marks</label>
          <input className="input" type="number" min={1} required value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Question</label>
        <textarea className="input" rows={2} required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {form.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              title="Mark as correct answer"
              checked={form.correctIndex === i}
              onChange={() => setForm({ ...form, correctIndex: i })}
            />
            <span className="w-4 text-sm font-medium">{letters[i]}</span>
            <input className="input" required placeholder={`Option ${letters[i]}`} value={o} onChange={(e) => setOpt(i, e.target.value)} />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Select the radio button next to the correct option.</p>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save question'}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Questions() {
  const { data, loading, error, reload } = useFetch('/questions');
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState('');

  const subjects = useMemo(() => [...new Set((data || []).map((q) => q.subject))], [data]);
  const list = (data || []).filter((q) => !filter || q.subject === filter);

  const remove = async (q) => {
    if (!window.confirm('Delete this question?')) return;
    setMsg('');
    try {
      await api.delete(`/questions/${q._id}`);
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Question bank" subtitle={`${data?.length ?? 0} multiple-choice questions`}>
        {!editing && <button className="btn-primary" onClick={() => setEditing(blank)}>+ Add question</button>}
      </PageHeader>
      <ErrorBox message={error || msg} />
      {editing && (
        <QuestionForm
          key={editing._id || 'new'}
          initial={editing}
          subjects={subjects}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty>No questions yet. Click "Add question" to create one.</Empty>
      ) : (
        <>
          <div className="mb-3">
            <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {list.map((q) => (
              <div key={q._id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{q.text}</p>
                    <p className="text-xs text-slate-500">{q.subject}{q.topic ? ` · ${q.topic}` : ''} · {q.marks} mark{q.marks > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button className="btn-ghost !py-1" onClick={() => { setEditing(q); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                    <button className="btn-ghost !py-1 !text-red-600" onClick={() => remove(q)}>Delete</button>
                  </div>
                </div>
                <ul className="mt-3 grid gap-1 text-sm md:grid-cols-2">
                  {q.options.map((o, i) => (
                    <li key={i} className={i === q.correctIndex ? 'font-medium text-green-700' : 'text-slate-600'}>
                      {letters[i]}. {o} {i === q.correctIndex && '✓'}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
