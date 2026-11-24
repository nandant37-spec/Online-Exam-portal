import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg } from '../api';
import { ErrorBox } from '../components/ui';

const demo = [
  ['Admin', 'admin@exam.com', 'admin123'],
  ['Teacher', 'teacher@exam.com', 'teacher123'],
  ['Student', 'student1@exam.com', 'student123'],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-4xl">📝</div>
          <h1 className="mt-2 text-2xl font-bold">Online Exam Portal</h1>
          <p className="text-sm text-slate-500">Sign in to continue</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <ErrorBox message={error} />
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="text-center text-sm text-slate-500">
            New student? <Link className="font-medium text-indigo-600" to="/register">Create an account</Link>
          </p>
        </form>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="mb-2 font-medium text-slate-600">Demo accounts (click to fill)</div>
          <div className="flex flex-wrap gap-2">
            {demo.map(([role, email, password]) => (
              <button key={role} type="button" className="btn-ghost !py-1" onClick={() => setForm({ email, password })}>
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
