import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Toaster } from './components/ui/sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CreateQuizPage from './pages/CreateQuizPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import GalleryPage from './pages/GalleryPage';
import EditQuizPage from './pages/EditQuizPage';
import Navbar from './components/layout/Navbar';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/quiz/:quizId" element={<QuizPage />} />
              
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } />
              <Route path="/edit/:quizId" element={
                <PrivateRoute>
                  <EditQuizPage />
                </PrivateRoute>
              } />
              <Route path="/create" element={
                <PrivateRoute>
                  <CreateQuizPage />
                </PrivateRoute>
              } />
              <Route path="/results/:quizId" element={
                <PrivateRoute>
                  <ResultsPage />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } />
            </Routes>
          </main>
          <Toaster position="top-center" />
        </div>
      </Router>
    </AuthProvider>
  );
}
