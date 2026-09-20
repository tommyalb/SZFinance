import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AuthGuard from './components/AuthGuard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}