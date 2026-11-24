import { Link } from 'react-router-dom';
import { Badge, Empty, ErrorBox, PageHeader, Spinner, fmt, useFetch } from '../components/ui';

export default function MyResults() {
  const { data, loading, error } = useFetch('/attempts/mine');
  return (
    <>
      <PageHeader title="My results" subtitle="Your submitted exams" />
      <ErrorBox message={error} />
      {loading ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty>You have not submitted any exam yet. <Link className="text-indigo-600" to="/exams">Browse exams</Link></Empty>
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Link key={r.id} to={`/results/${r.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-indigo-300">
              <div>
                <div className="font-semibold">{r.exam.title}</div>
                <div className="text-sm text-slate-500">{r.exam.subject} · {fmt(r.submittedAt)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold">{r.score}/{r.totalMarks}</div>
                  <div className="text-sm text-slate-500">{r.percentage}%</div>
                </div>
                <Badge kind={r.passed ? 'pass' : 'fail'}>{r.passed ? 'Passed' : 'Failed'}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
