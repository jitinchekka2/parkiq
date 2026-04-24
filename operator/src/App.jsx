import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useAuth } from './store/auth';

function App() {
  const { user, token, logout } = useAuth();

  if (!token) {
    return <Login />;
  }

  if (!['OPERATOR', 'ADMIN'].includes(user?.role)) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 22 }}>Access denied</h2>
          <p style={{ marginTop: 0, marginBottom: 16, color: '#666' }}>
            This account is not allowed to access Operator dashboard.
          </p>
          <button
            onClick={logout}
            style={{ width: '100%', background: '#0A0A0F', color: 'white', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
