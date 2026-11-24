import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, PageHeader, Spinner, fmt, useFetch } from '../components/ui';

export default function Users() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useFetch('/users');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [msg, setMsg] = useState('');

  const add = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'teacher' });
      reload();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    setMsg('');
    try {
      await api.delete(`/users/${u.id}`);
      reload();
    } catch (err) {
      setMsg(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Add teachers and manage accounts" />
      <ErrorBox message={error || msg} />
      <form onSubmit={add} className="card mb-6 grid gap-3 md:grid-cols-5">
        <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-primary">Add user</button>
      </form>
      {loading ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-slate-500">{fmt(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me.id && <button className="text-red-600 hover:underline" onClick={() => remove(u)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
