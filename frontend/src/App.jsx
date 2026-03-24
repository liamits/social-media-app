import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Sidebar from './components/common/Sidebar';
import Feed from './features/feed/components/Feed';
import Suggestions from './features/feed/components/Suggestions';
import Explore from './features/explore/pages/Explore';
import Profile from './features/profile/pages/Profile';
import Login from './features/auth/pages/Login';
import Signup from './features/auth/pages/Signup';
import { useAuth } from './context/AuthContext';

function Home() {
  return (
    <div className="flex gap-8 p-8 max-w-[935px] w-full mx-auto">
      <Feed />
      <Suggestions />
    </div>
  );
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="flex">
        {user && <Sidebar />}
        <main className={user ? "main-content" : "auth-content"}>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/explore" element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
