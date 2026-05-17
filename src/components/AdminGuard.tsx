import { useAuthStore } from '../store/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center p-10 bg-card rounded-lg shadow-card max-w-md">
          <div className="text-6xl text-muted-foreground mb-4">403</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">无访问权限</h2>
          <p className="text-sm text-muted-foreground mb-6">
            你没有权限访问管理后台。如需访问，请联系管理员。
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
