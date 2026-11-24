import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { ErrorBox, PageHeader, Spinner, useFetch } from '../components/ui';

const labels = {
  totalExams: 'Total exams',
  totalAttempts: 'Submitted attempts',
  averageScore: 'Average score (%)',
  questionBank: 'Questions in bank',
  students: 'Students',
  teachers: 'Teachers',
  examsTaken: 'Exams taken',
  passed: 'Exams passed',
};

function BarChart({ data, title }) {
  if (!data.length) return <p className="text-sm text-slate-500">No data yet. Results will appear here once exams are submitted.</p>;
  return (
    <div>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="truncate pr-2">{d.label}</span>
              <span className="font-medium">{d.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, d.value)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch('/stats');

  if (loading) return <Spinner />;
  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]} 👋`} subtitle={`Signed in as ${user.role}`}>
        {user.role === 'student' ? (
          <Link to="/exams" className="btn-primary">View exams</Link>
        ) : (
          <Link to="/exams/new" className="btn-primary">+ New exam</Link>
        )}
      </PageHeader>
      <ErrorBox message={error} />
      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(data.cards).map(([k, v]) => (
              <div key={k} className="card">
                <div className="text-3xl font-bold text-indigo-600">{v}</div>
                <div className="mt-1 text-sm text-slate-500">{labels[k] || k}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <BarChart
              data={data.chart}
              title={user.role === 'student' ? 'Your scores by exam' : 'Average score by exam'}
            />
          </div>
        </>
      )}
    </>
  );
}
