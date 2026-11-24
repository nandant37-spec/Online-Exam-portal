import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import ExamForm from './pages/ExamForm';
import ExamResults from './pages/ExamResults';
import Questions from './pages/Questions';
import Users from './pages/Users';
import Attempt from './pages/Attempt';
import MyResults from './pages/MyResults';
import ResultDetail from './pages/ResultDetail';

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const staff = ['teacher', 'admin'];

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      {/* The exam screen is full-screen (no navbar) so students stay focused */}
      <Route path="/attempt/:examId" element={<Guard roles={['student']}><Attempt /></Guard>} />

      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exams/new" element={<Guard roles={staff}><ExamForm /></Guard>} />
        <Route path="exams/:id/edit" element={<Guard roles={staff}><ExamForm /></Guard>} />
        <Route path="exams/:id/results" element={<Guard roles={staff}><ExamResults /></Guard>} />
        <Route path="questions" element={<Guard roles={staff}><Questions /></Guard>} />
        <Route path="users" element={<Guard roles={['admin']}><Users /></Guard>} />
        <Route path="results" element={<Guard roles={['student']}><MyResults /></Guard>} />
        <Route path="results/:id" element={<Guard roles={['student']}><ResultDetail /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
