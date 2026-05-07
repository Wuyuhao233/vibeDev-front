import { forwardRef } from 'react';

export interface ShareCardData {
  title: string;
  authorName: string;
  authorAvatar: string | null;
  boardName: string;
  excerpt: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
}

const ShareCard = forwardRef<HTMLDivElement, { data: ShareCardData }>(
  function ShareCard({ data }, ref) {
    const displayDate = new Date(data.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return (
      <div
        ref={ref}
        className="share-card"
        style={{
          width: 600,
          height: 340,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* White content card */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            right: 30,
            bottom: 70,
            background: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
          {/* Board tag */}
          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              padding: '2px 10px',
              background: '#eff6ff',
              color: '#3b82f6',
              fontSize: 12,
              borderRadius: 4,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            {data.boardName}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.4,
              marginBottom: 16,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.title}
          </div>

          {/* Excerpt */}
          {data.excerpt && (
            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                lineHeight: 1.6,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {data.excerpt}
            </div>
          )}

          {/* Author + meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: data.authorAvatar
                    ? `url(${data.authorAvatar}) center/cover`
                    : '#e5e7eb',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                {data.authorName}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#9ca3af' }}>
              <span>{displayDate}</span>
              {data.replyCount > 0 && <span>{data.replyCount} 回复</span>}
              {data.likeCount > 0 && <span>{data.likeCount} 点赞</span>}
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            vibeDev
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            · 开发者社区
          </span>
        </div>
      </div>
    );
  },
);

export default ShareCard;
