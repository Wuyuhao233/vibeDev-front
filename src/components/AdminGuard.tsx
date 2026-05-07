import { useAuthStore } from '../store/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-10 bg-white rounded-lg shadow-card max-w-md">
          <div className="text-6xl text-gray-300 mb-4">403</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">无访问权限</h2>
          <p className="text-sm text-gray-500 mb-6">
            你没有权限访问管理后台。如需访问，请联系管理员。
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
