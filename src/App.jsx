import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './data/store.jsx';
import { useApp } from './data/context.js';
import { appsForRole } from './data/dockConfig.js';
import Login from './pages/Login';
import AppShell from './components/AppShell';

function homeForRole(role) {
  const prefix = role === 'dev' ? '/dev/apps' : '/pm/apps';
  return `${prefix}/dashboard`;
}

function RequireAuth({ children }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RedirectHome() {
  const { currentUser } = useApp();
  return <Navigate to={currentUser ? homeForRole(currentUser?.role) : '/login'} replace />;
}

function ShellRoute() {
  const { roleSegment, appId } = useParams();
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roleSegment !== currentUser.role) {
    return <Navigate to={homeForRole(currentUser.role)} replace />;
  }
  const apps = appsForRole(currentUser.role);
  if (!apps.some((a) => a.id === appId)) return <Navigate to={homeForRole(currentUser.role)} replace />;
  return <AppShell key={appId} initialApp={appId} />;
}

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* Backwards-compatible paths for existing bookmarks */}
        <Route path="/dashboard" element={<RedirectHome />} />
        <Route path="/developer" element={<RedirectHome />} />
        <Route path="/app/:appId" element={<RedirectHome />} />
        <Route
          path="/:roleSegment/apps/:appId"
          element={
            <RequireAuth>
              <ShellRoute />
            </RequireAuth>
          }
        />
        {/* Catch-all fallback redirect */}
        <Route path="*" element={<RedirectHome />} />
      </Routes>
    </AppProvider>
  );
}

export default App;