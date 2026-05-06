import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ToastProvider from './components/ui/Toast';
import AuthGuard from './components/AuthGuard';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import PostPage from './pages/PostPage';
import UserProfilePage from './pages/user/UserProfilePage';
import SearchPage from './pages/SearchPage';
import NewPostPage from './pages/NewPostPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import PostsPage from './pages/admin/PostsPage';
import ReportsPage from './pages/admin/ReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Main layout routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/board/:id" element={<BoardPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/u/:username" element={<UserProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/post/new"
              element={
                <AuthGuard>
                  <NewPostPage />
                </AuthGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthGuard>
                  <SettingsPage />
                </AuthGuard>
              }
            />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/posts" element={<PostsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
