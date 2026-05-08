# 搜索 V1.2 — E2E 截图

搜索建议/自动补全、相关度排序指示、搜索耗时展示、热门搜索侧栏和客户端关键词高亮回退。

## 截图清单

| 文件 | 页面/状态 | 说明 |
|------|-----------|------|
| `search-suggestions-dropdown.png` | 搜索建议 — 输入时下拉 | 在搜索框输入 "React" 后触发搜索建议 API，下拉面板显示「搜索建议」标题和 5 条建议词（React Hooks、React Router、React Native 等） |
| `search-relevance-indicator.png` | 搜索结果 — 相关度排序 | 搜索结果页展示「共 42 条结果」+「按相关度排序」徽章 +「搜索耗时 0.42s」，结果列表含高亮关键词、精华和置顶徽章 |
| `search-trending-sidebar.png` | 搜索结果 — 热门搜索侧栏 | 搜索结果右侧显示 240px 「热门搜索」侧栏，列出 8 个热门搜索词（带排名和搜索次数），词条可点击发起搜索 |
| `search-client-highlight.png` | 搜索结果 — 客户端高亮回退 | 当服务端未返回高亮 HTML 时，客户端对 plain text 内容执行关键词高亮（`<mark class="search-highlight">`），标题和摘要中的 "vue" 以黄色高亮显示 |
