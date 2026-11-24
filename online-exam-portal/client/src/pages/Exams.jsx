import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { Badge, Empty, ErrorBox, PageHeader, Spinner, fmt, useFetch } from '../components/ui';

function StudentAction({ exam }) {
  const a = exam.attempt;
  if (a?.status === 'submitted')
    return (
      <div className="flex items-center gap-2">
        <Badge kind={a.passed ? 'pass' : 'fail'}>{a.percentage}% · {a.passed ? 'Passed' : 'Failed'}</Badge>
        <Link to="/results" className="btn-ghost">View result</Link>
      </div>
    );
  if (a?.status === 'in_progress') return <Link to={`/attempt/${exam.id}`} className="btn-primary">Resume exam</Link>;
  if (exam.status === 'live') return <Link to={`/attempt/${exam.id}`} className="btn-primary">Start exam</Link>;
  return <span className="text-sm text-slate-500">{exam.status === 'upcoming' ? 'Not started yet' : 'Exam closed'}</span>;
}

export default function Exams() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/exams');
  const [msg, setMsg] = useState('');
  const staff = user.role !== 'student';

  const remove = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}" and all its attempts?`)) return;
    try {
      await api.delete(`/exams/${exam.id}`);
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title={staff ? 'Exams' : 'Available exams'} subtitle={staff ? 'Create and manage exams' : 'Start an exam when it is live'}>
        {staff && <Link to="/exams/new" className="btn-primary">+ New exam</Link>}
      </PageHeader>
      <ErrorBox message={error || msg} />
      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty>{staff ? 'No exams yet. Create your first one.' : 'No exams available right now.'}</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((e) => (
            <div key={e.id} className="card flex flex-col">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{e.title}</h2>
                  <p className="text-sm text-slate-500">{e.subject}{staff && e.createdBy ? ` · by ${e.createdBy}` : ''}</p>
                </div>
                <Badge kind={e.status}>{e.status}</Badge>
              </div>
              {e.description && <p className="mb-3 text-sm text-slate-600">{e.description}</p>}
              <dl className="mb-4 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-slate-500">Duration</dt><dd className="font-medium">{e.durationMinutes} min</dd></div>
                <div><dt className="text-slate-500">Questions</dt><dd className="font-medium">{e.questionCount}</dd></div>
                <div><dt className="text-slate-500">Marks</dt><dd className="font-medium">{e.totalMarks} (pass {e.passPercent}%)</dd></div>
              </dl>
              <p className="mb-4 text-xs text-slate-500">Window: {fmt(e.startTime)} → {fmt(e.endTime)}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                {staff ? (
                  <>
                    <Link to={`/exams/${e.id}/results`} className="btn-ghost">Results</Link>
                    <Link to={`/exams/${e.id}/edit`} className="btn-ghost">Edit</Link>
                    <button onClick={() => remove(e)} className="btn-ghost !text-red-600">Delete</button>
                  </>
                ) : (
                  <StudentAction exam={e} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
