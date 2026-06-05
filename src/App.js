// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './auth/login/login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Register from './auth/register/register';

// Composant pour les routes protégées
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#020617',
        color: '#E2E8F0'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Composant pour rediriger selon le rôle
const DashboardRouter = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#020617',
        color: '#E2E8F0'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirection selon le rôle
  const role = user?.role?.toLowerCase();
  
  if (role === 'admin' || role === 'administrateur') {
    return <Navigate to="/admindashboard" replace />;
  } else if (role === 'developpeur' || role === 'dev' || role === 'graphiste' || role === 'designer') {
    return <Navigate to="/userdashboard" replace />;
  }
  
  // Par défaut, rediriger vers la page utilisateur
  return <Navigate to="/userdashboard" replace />;
};

// Composant pour rediriger si déjà connecté
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#020617',
        color: '#E2E8F0'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    // Rediriger vers le bon dashboard selon le rôle
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'administrateur') {
      return <Navigate to="/admindashboard" replace />;
    } else {
      return <Navigate to="/userdashboard" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Routes publiques */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Route de redirection par rôle */}
          <Route 
            path="/" 
            element={<DashboardRouter />} 
          />
          
          {/* Dashboard Admin - protégé */}
          <Route 
            path="/admindashboard/*" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Dashboard Utilisateur - protégé */}
          <Route 
            path="/userdashboard/*" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirection 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;