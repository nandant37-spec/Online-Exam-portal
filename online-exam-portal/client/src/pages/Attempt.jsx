import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Spinner } from '../components/ui';

const letters = ['A', 'B', 'C', 'D'];
const pad = (n) => String(n).padStart(2, '0');
const clock = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

export default function Attempt() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [fatal, setFatal] = useState('');
  const [answers, setAnswers] = useState({}); // questionId -> selected index
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const started = useRef(false);
  const submittedRef = useRef(false);
  const offset = useRef(0); // server time - client time
  const switches = useRef(0);

  // Start or resume the attempt
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api
      .post(`/attempts/start/${examId}`)
      .then(({ data }) => {
        offset.current = new Date(data.serverTime).getTime() - Date.now();
        setAnswers(Object.fromEntries(data.answers.filter((a) => a.selected !== null).map((a) => [a.question, a.selected])));
        setSession(data);
      })
      .catch((e) => setFatal(errMsg(e)));
  }, [examId]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current || !session) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const { data } = await api.post(`/attempts/${session.attemptId}/submit`, { auto, tabSwitches: switches.current });
        navigate(`/results/${data.id}`, { replace: true });
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        setSaveError(errMsg(e));
      }
    },
    [session, navigate]
  );

  // Countdown (based on the server deadline, so refreshing cannot reset it)
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(session.deadline).getTime() - (Date.now() + offset.current)) / 1000));
      setRemaining(left);
      if (left <= 0) submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session, submit]);

  // Anti-cheating: tab-switch detection + leave warning
  useEffect(() => {
    if (!session) return;
    const onHide = () => {
      if (!document.hidden || submittedRef.current) return;
      switches.current += 1;
      setWarning(`Warning: you left the exam tab (${switches.current} time${switches.current > 1 ? 's' : ''}). This is recorded and shown to your teacher.`);
      api.put(`/attempts/${session.attemptId}/tab-switch`).catch(() => {});
    };
    const onUnload = (e) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [session]);

  const choose = (qid, i) => {
    setAnswers((a) => ({ ...a, [qid]: i }));
    setSaveError('');
    api.put(`/attempts/${session.attemptId}/answer`, { question: qid, selected: i }).catch((e) => setSaveError(`Could not save your last answer: ${errMsg(e)}`));
  };

  const clear = (qid) => {
    setAnswers((a) => {
      const next = { ...a };
      delete next[qid];
      return next;
    });
    api.put(`/attempts/${session.attemptId}/answer`, { question: qid, selected: null }).catch(() => {});
  };

  const confirmSubmit = () => {
    const unanswered = session.questions.length - Object.keys(answers).length;
    const msg = unanswered > 0 ? `You have ${unanswered} unanswered question(s). Submit anyway?` : 'Submit your exam now?';
    if (window.confirm(msg)) submit(false);
  };

  if (fatal)
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="mb-2 text-3xl">⚠️</div>
          <p className="mb-4">{fatal}</p>
          <Link to="/exams" className="btn-primary">Back to exams</Link>
        </div>
      </div>
    );
  if (!session) return <Spinner text="Preparing your exam…" />;

  const q = session.questions[index];
  const answeredCount = Object.keys(answers).length;
  const low = remaining !== null && remaining <= 60;

  return (
    <div className="min-h-screen select-none">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="font-semibold">{session.exam.title}</div>
            <div className="text-xs text-slate-500">{answeredCount}/{session.questions.length} answered</div>
          </div>
          <div className={`rounded-lg px-4 py-2 font-mono text-lg font-bold ${low ? 'animate-pulse bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
            ⏱ {remaining === null ? '--:--:--' : clock(remaining)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1fr_16rem]">
        <section>
          {warning && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <span>{warning}</span>
              <button onClick={() => setWarning('')} className="font-bold">×</button>
            </div>
          )}
          {saveError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{saveError}</div>}

          <div className="card">
            <div className="mb-1 flex justify-between text-sm text-slate-500">
              <span>Question {index + 1} of {session.questions.length}</span>
              <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>
            <h2 className="mb-5 text-lg font-medium">{q.text}</h2>
            <div className="space-y-3">
              {q.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => choose(q.id, i)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                    answers[q.id] === i ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${answers[q.id] === i ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                    {letters[i]}
                  </span>
                  <span>{o}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <button className="btn-ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button>
              {answers[q.id] !== undefined && <button className="text-sm text-slate-500 hover:underline" onClick={() => clear(q.id)}>Clear answer</button>}
              {index < session.questions.length - 1 ? (
                <button className="btn-primary" onClick={() => setIndex(index + 1)}>Next →</button>
              ) : (
                <button className="btn-primary" disabled={submitting} onClick={confirmSubmit}>Submit exam</button>
              )}
            </div>
          </div>
        </section>

        <aside>
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold">Question palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {session.questions.map((x, i) => (
                <button
                  key={x.id}
                  onClick={() => setIndex(i)}
                  className={`h-9 rounded-lg text-sm font-medium ${
                    i === index
                      ? 'ring-2 ring-indigo-500 ring-offset-1'
                      : ''
                  } ${answers[x.id] !== undefined ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-green-500" />Answered</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-slate-200" />Not answered</span>
            </div>
            <button className="btn-danger mt-4 w-full" disabled={submitting} onClick={confirmSubmit}>
              {submitting ? 'Submitting…' : 'Submit exam'}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
