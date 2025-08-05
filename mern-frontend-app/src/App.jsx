import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link
} from 'react-router-dom';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  const onLogin = () => {
    setToken(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
  };

  return (
    <Router>
      <nav style={{ padding: 10, borderBottom: '1px solid #ccc' }}>
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout} style={{ marginLeft: '10px' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <LoginForm onLogin={onLogin} />}
        />

        <Route
          path="/dashboard"
          element={token ? <Dashboard token={token} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/"
          element={<Navigate to={token ? '/dashboard' : '/login'} replace />}
        />

        {/* Optional: catch all unknown routes and redirect */}
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
