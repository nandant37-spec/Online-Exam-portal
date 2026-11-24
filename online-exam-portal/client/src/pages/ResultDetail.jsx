import { Link, useParams } from 'react-router-dom';
import { Badge, ErrorBox, PageHeader, Spinner, useFetch } from '../components/ui';

const letters = ['A', 'B', 'C', 'D'];

export default function ResultDetail() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/attempts/${id}`);

  if (loading) return <Spinner />;
  if (error) return <><ErrorBox message={error} /><Link to="/results" className="btn-ghost">← Back</Link></>;

  const correct = data.review.filter((q) => q.selected === q.correctIndex).length;
  const skipped = data.review.filter((q) => q.selected === null).length;

  return (
    <>
      <PageHeader title={data.exam.title} subtitle={data.exam.subject}>
        <Link to="/results" className="btn-ghost">← All results</Link>
      </PageHeader>

      <div className={`card mb-6 text-center ${data.passed ? '!border-green-300 !bg-green-50' : '!border-red-300 !bg-red-50'}`}>
        <div className="text-5xl font-bold">{data.percentage}%</div>
        <div className="mt-1 text-slate-600">Score: {data.score} / {data.totalMarks}</div>
        <div className="mt-2"><Badge kind={data.passed ? 'pass' : 'fail'}>{data.passed ? 'Passed 🎉' : 'Not passed'}</Badge></div>
        <div className="mt-3 text-sm text-slate-600">
          {correct} correct · {data.review.length - correct - skipped} wrong · {skipped} skipped
          {data.autoSubmitted && ' · auto-submitted when time ended'}
          {data.tabSwitches > 0 && ` · ${data.tabSwitches} tab switch(es) recorded`}
        </div>
      </div>

      <h2 className="mb-3 font-semibold">Answer review</h2>
      <div className="space-y-4">
        {data.review.map((q, n) => (
          <div key={q.id} className="card">
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-medium">{n + 1}. {q.text}</p>
              <Badge kind={q.selected === q.correctIndex ? 'pass' : 'fail'}>
                {q.selected === q.correctIndex ? `+${q.marks}` : q.selected === null ? 'Skipped' : 'Wrong'}
              </Badge>
            </div>
            <ul className="space-y-2 text-sm">
              {q.options.map((o, i) => {
                const isCorrect = i === q.correctIndex;
                const isPicked = i === q.selected;
                return (
                  <li
                    key={i}
                    className={`rounded-lg border px-3 py-2 ${
                      isCorrect ? 'border-green-300 bg-green-50' : isPicked ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  >
                    {letters[i]}. {o}
                    {isCorrect && <span className="ml-2 text-green-700">✓ Correct answer</span>}
                    {isPicked && !isCorrect && <span className="ml-2 text-red-700">Your answer</span>}
                    {isPicked && isCorrect && <span className="ml-2 text-green-700">(your answer)</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
