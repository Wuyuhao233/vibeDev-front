import http from 'http';

const PORT = 8080;

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // CORS
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' });
    res.end();
    return;
  }

  // Boards
  if (url.pathname === '/api/boards' || url.pathname === '/api/v1/boards') {
    return json(res, { data: [{ id: 1, name: '综合讨论', slug: 'general', description: '各类话题的综合讨论区', icon: null, postCount: 128, sortOrder: 1, tags: [{ id: 1, name: '闲聊', slug: 'chat', sortOrder: 1 }, { id: 2, name: '求助', slug: 'help', sortOrder: 2 }, { id: 3, name: '教程', slug: 'tutorial', sortOrder: 3 }] }] });
  }

  // Post detail
  if (url.pathname === '/api/posts/1' || url.pathname === '/api/v1/posts/1') {
    return json(res, { data: {
      id: 1, title: 'React 18 最佳实践总结',
      content: `## 前言\n\nReact 18 带来了许多激动人心的新特性。本文将总结我们在实际项目中的**最佳实践**。\n\n### 1. 使用 Concurrent Features\n\n\`Suspense\` 和 \`useTransition\` 是 React 18 最重要的新增功能。\n\n\`\`\`tsx\nimport { Suspense, lazy } from 'react';\n\nconst HeavyComponent = lazy(() => import('./HeavyComponent'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Loading />}>\n      <HeavyComponent />\n    </Suspense>\n  );\n}\n\`\`\``,
      contentMarkdown: `## 前言\n\nReact 18 带来了许多激动人心的新特性。本文将总结我们在实际项目中的**最佳实践**。\n\n### 1. 使用 Concurrent Features\n\n\`Suspense\` 和 \`useTransition\` 是 React 18 最重要的新增功能。\n\n\`\`\`tsx\nimport { Suspense, lazy } from 'react';\n\nconst HeavyComponent = lazy(() => import('./HeavyComponent'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Loading />}>\n      <HeavyComponent />\n    </Suspense>\n  );\n}\n\`\`\``,
      author: { id: 1, username: 'react_master', avatar: null, level: 4 },
      board: { id: 1, name: '综合讨论', slug: 'general' },
      tags: [{ id: 1, name: 'React', slug: 'react' }, { id: 2, name: 'TypeScript', slug: 'typescript' }],
      likeCount: 42, replyCount: 8, collectCount: 15, viewCount: 356,
      isLiked: false, isCollected: false, isPinned: false, isEssence: true, version: 3,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      lastEditedAt: new Date(Date.now() - 1800000).toISOString(),
    } });
  }

  // Post view
  if (url.pathname.includes('/view')) {
    return json(res, { data: { success: true } });
  }

  // Replies
  if (url.pathname.includes('/replies')) {
    return json(res, { data: { items: [
      {
        id: 101, content: '写得很好！React 18 的 Concurrent Mode 确实改变了开发方式。',
        author: { id: 2, username: 'vue_fan', avatar: null, level: 3 },
        parentId: null, floorNumber: 1, likeCount: 12, isLiked: false, isDeleted: false, version: 1,
        createdAt: new Date(Date.now() - 5400000).toISOString(),
        updatedAt: new Date(Date.now() - 5400000).toISOString(),
      },
      {
        id: 102, content: '同意楼上！我们在项目中用 Suspense 之后体验非常好。',
        author: { id: 5, username: 'ts_lover', avatar: null, level: 2 },
        parentId: 101, floorNumber: 2, likeCount: 5, isLiked: false, isDeleted: false, version: 1,
        createdAt: new Date(Date.now() - 5000000).toISOString(),
        updatedAt: new Date(Date.now() - 5000000).toISOString(),
      },
      {
        id: 103, content: '对，特别是配合 ErrorBoundary 使用，错误处理也变得很优雅。',
        author: { id: 2, username: 'vue_fan', avatar: null, level: 3 },
        parentId: 102, floorNumber: 3, likeCount: 3, isLiked: false, isDeleted: false, version: 1,
        createdAt: new Date(Date.now() - 4600000).toISOString(),
        updatedAt: new Date(Date.now() - 4600000).toISOString(),
      },
      {
        id: 104, content: '补充一点：`useDeferredValue` 在处理大量数据渲染时也非常有用。\n\n```tsx\nconst deferredQuery = useDeferredValue(query);\n```',
        author: { id: 3, username: 'js_dev', avatar: null, level: 2 },
        parentId: null, floorNumber: 4, likeCount: 8, isLiked: false, isDeleted: false, version: 1,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 105, content: '好补充！useDeferredValue + Suspense 组合确实强大。',
        author: { id: 6, username: 'react_fan', avatar: null, level: 1 },
        parentId: 104, floorNumber: 5, likeCount: 2, isLiked: false, isDeleted: false, version: 1,
        createdAt: new Date(Date.now() - 3200000).toISOString(),
        updatedAt: new Date(Date.now() - 3200000).toISOString(),
      },
      {
        id: 106, content: '感谢分享，收藏了！',
        author: { id: 4, username: 'beginner', avatar: null, level: 1 },
        parentId: null, floorNumber: 6, likeCount: 3, isLiked: false, isDeleted: false, version: 1,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ], total: 8 } });
  }

  // Sensitive words
  if (url.pathname.includes('sensitive')) {
    return json(res, { data: [] });
  }

  // 404 for other posts
  if (url.pathname.match(/\/api\/.*posts\/999/)) {
    return json(res, { errorCode: 'NOT_FOUND (30001)', message: '帖子不存在' }, 404);
  }

  // Fallback
  json(res, { data: {} });
});

server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
