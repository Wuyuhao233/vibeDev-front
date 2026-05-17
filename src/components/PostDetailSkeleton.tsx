export default function PostDetailSkeleton() {
  return (
    <div className="animate-shimmer space-y-6">
      {/* Tags breadcrumb */}
      <div className="flex gap-2">
        <div className="w-20 h-5 bg-muted rounded" />
        <div className="w-16 h-5 bg-muted rounded" />
      </div>

      {/* Author header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-full" />
        <div>
          <div className="w-24 h-5 bg-muted rounded mb-2" />
          <div className="w-40 h-4 bg-muted rounded" />
        </div>
      </div>

      {/* Title */}
      <div className="w-2/3 h-7 bg-muted rounded" />

      {/* Content */}
      <div className="space-y-3">
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-5/6 h-4 bg-muted rounded" />
        <div className="w-full h-4 bg-muted rounded" />
        <div className="w-4/6 h-4 bg-muted rounded" />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-6">
        <div className="w-16 h-5 bg-muted rounded" />
        <div className="w-16 h-5 bg-muted rounded" />
        <div className="w-16 h-5 bg-muted rounded" />
      </div>

      {/* Reply section */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="w-32 h-6 bg-muted rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-4 border-b border-border">
            <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-20 h-3.5 bg-muted rounded" />
                <div className="w-12 h-3.5 bg-muted rounded" />
              </div>
              <div className="w-full h-4 bg-muted rounded mb-2" />
              <div className="w-2/3 h-4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
