# 用户系统 V1.1 — E2E 截图

CAS 统一认证登录及账号绑定的页面级截图。

## 截图清单

| 文件 | 页面/状态 | 说明 |
|------|-----------|------|
| `login-cas-button.png` | 登录页（CAS 按钮） | 表单下方展示 CAS 登录入口和分割线 |
| `login-cas-loading.png` | 登录页（CAS 回调） | 携带 ticket 参数时展示加载状态 |
| `settings-cas-unbound.png` | 设置页（CAS 未绑定） | 安全设置 Tab 展示绑定 CAS 账号按钮 |
| `settings-cas-bound.png` | 设置页（CAS 已绑定） | 安全设置 Tab 展示已绑定的 CAS 用户名 + 解绑按钮 |
| `settings-debug.png` | 设置页（调试） | 解绑按钮未找到时的调试截图 |

## 脚本说明

- `screenshots.mjs` — Playwright 截图脚本，mock API 后对上述状态截图
- `debug-login.mjs` — 登录流程调试脚本，mock 登录 API 并检查表单交互
