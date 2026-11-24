import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export const Spinner = ({ text = 'Loading…' }) => <div className="py-10 text-center text-slate-500">{text}</div>;

export const ErrorBox = ({ message }) =>
  message ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{message}</div> : null;

export const Empty = ({ children }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-slate-500">{children}</div>
);

/** Fetch a URL on mount; returns { data, loading, error, reload } */
export function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    return api
      .get(url)
      .then((r) => setState({ data: r.data, loading: false, error: '' }))
      .catch((e) => setState({ data: null, loading: false, error: errMsg(e) }));
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load };
}

const statusStyle = {
  live: 'bg-green-100 text-green-700',
  upcoming: 'bg-amber-100 text-amber-700',
  ended: 'bg-slate-200 text-slate-600',
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
};
export const Badge = ({ kind, children }) => <span className={`badge ${statusStyle[kind]}`}>{children}</span>;

export const fmt = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
