
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import Admin from './pages/Admin';

// Fix: Define interface for route guard props with optional children to satisfy TypeScript JSX validation
interface RouteGuardProps {
  children?: React.ReactNode;
  user: User | null;
}

// Fix: Moved ProtectedRoute outside the App component and used interface to resolve type inference issues
const ProtectedRoute: React.FC<RouteGuardProps> = ({ children, user }) => {
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

// Fix: Moved AdminRoute outside the App component and used interface to resolve type inference issues
const AdminRoute: React.FC<RouteGuardProps> = ({ children, user }) => {
  const isAdmin = user?.email === 'hh527924@gmail.com';
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200">
      {user && <Navbar user={user} />}
      <div className={user ? "pt-20 pb-10 max-w-6xl mx-auto px-4" : ""}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          {/* Fix: Pass user prop explicitly to route guards to satisfy TypeScript requirements */}
          <Route path="/" element={<ProtectedRoute user={user}><Feed /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute user={user}><Groups /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute user={user}><Admin /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
