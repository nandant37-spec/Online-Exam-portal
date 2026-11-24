import { Link, useParams } from 'react-router-dom';
import { Badge, Empty, ErrorBox, PageHeader, Spinner, fmt, useFetch } from '../components/ui';

export default function ExamResults() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/exams/${id}/results`);

  if (loading) return <Spinner />;
  const results = data?.results || [];
  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  const passRate = results.length ? Math.round((results.filter((r) => r.passed).length / results.length) * 100) : 0;

  return (
    <>
      <PageHeader title={data?.exam?.title || 'Results'} subtitle={data ? `${data.exam.subject} · ${data.exam.totalMarks} marks` : ''}>
        <Link to="/exams" className="btn-ghost">← Back</Link>
      </PageHeader>
      <ErrorBox message={error} />
      {data && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="card"><div className="text-3xl font-bold text-indigo-600">{results.length}</div><div className="text-sm text-slate-500">Submissions</div></div>
            <div className="card"><div className="text-3xl font-bold text-indigo-600">{avg}%</div><div className="text-sm text-slate-500">Average score</div></div>
            <div className="card"><div className="text-3xl font-bold text-indigo-600">{passRate}%</div><div className="text-sm text-slate-500">Pass rate</div></div>
          </div>
          {!results.length ? (
            <Empty>No student has submitted this exam yet.</Empty>
          ) : (
            <div className="card overflow-x-auto !p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">%</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Tab switches</th>
                    <th className="px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3"><div className="font-medium">{r.student.name}</div><div className="text-xs text-slate-500">{r.student.email}</div></td>
                      <td className="px-4 py-3">{r.score}/{r.totalMarks}</td>
                      <td className="px-4 py-3">{r.percentage}%</td>
                      <td className="px-4 py-3"><Badge kind={r.passed ? 'pass' : 'fail'}>{r.passed ? 'Pass' : 'Fail'}</Badge></td>
                      <td className={`px-4 py-3 ${r.tabSwitches > 0 ? 'font-medium text-amber-700' : ''}`}>{r.tabSwitches}</td>
                      <td className="px-4 py-3 text-slate-500">{fmt(r.submittedAt)}{r.autoSubmitted ? ' (auto)' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
