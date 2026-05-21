import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ThemeInitializer from './components/ThemeInitializer';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import PostPage from './pages/PostPage';
import UserProfilePage from './pages/user/UserProfilePage';
import SearchPage from './pages/SearchPage';
import NewPostPage from './pages/NewPostPage';
import EditPostPage from './pages/EditPostPage';
import NotificationPage from './pages/NotificationPage';
import SettingsPage from './pages/SettingsPage';
import LeaderboardPage from './pages/LeaderboardPage';
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
import ReportDetailPage from './pages/admin/AdminReportDetail';
import BoardsPage from './pages/admin/AdminBoards';
import SensitiveWordsPage from './pages/admin/AdminSensitiveWords';
import SettingsPageAdmin from './pages/admin/AdminSettings';
import ReviewQueuePage from './pages/admin/ReviewQueuePage';
import ReviewStatsPage from './pages/admin/ReviewStatsPage';
import ModeratorAssignmentPage from './pages/admin/ModeratorAssignmentPage';
import AppealQueuePage from './pages/admin/AppealQueuePage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInitializer />
      <Toaster position="top-center" richColors />
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
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route
              path="/post/new"
              element={
                <AuthGuard>
                  <NewPostPage />
                </AuthGuard>
              }
            />
            <Route
              path="/post/edit/:id"
              element={
                <AuthGuard>
                  <EditPostPage />
                </AuthGuard>
              }
            />
            <Route
              path="/notifications"
              element={
                <AuthGuard>
                  <NotificationPage />
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
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              </AuthGuard>
            }
          >
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/boards" element={<BoardsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/posts" element={<PostsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/reports/:id" element={<ReportDetailPage />} />
            <Route path="/admin/sensitive-words" element={<SensitiveWordsPage />} />
            <Route path="/admin/settings" element={<SettingsPageAdmin />} />
            <Route path="/admin/review-queue" element={<ReviewQueuePage />} />
            <Route path="/admin/review-stats" element={<ReviewStatsPage />} />
            <Route path="/admin/moderator-assignment" element={<ModeratorAssignmentPage />} />
            <Route path="/admin/appeals" element={<AppealQueuePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </BrowserRouter>
  );
}
