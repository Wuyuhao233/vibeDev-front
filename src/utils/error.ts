export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'UNAUTHORIZED (10001)': '请先登录',
    'TOKEN_EXPIRED (10002)': '登录已过期，请重新登录',
    'ACCOUNT_LOCKED (10003)': '账号已锁定，请 15 分钟后重试',
    'ACCOUNT_NOT_ACTIVATED (10004)': '账号未激活，请检查邮箱中的验证邮件',
    'PASSWORD_WRONG (10005)': '密码不正确',
    'USERNAME_TAKEN (10006)': '用户名已被占用',
    'EMAIL_TAKEN (10007)': '邮箱已被注册',
    'ACCOUNT_DEACTIVATED (10008)': '账号已注销（但可恢复）',
    'DEACTIVATION_EXPIRED (10009)': '注销恢复期限已过',
    'CAS_ALREADY_BOUND (10010)': 'CAS 账号已被其他用户绑定',
    'PASSWORD_TOO_SIMILAR (10011)': '新密码与用户名/邮箱过于相似',
    'EMAIL_SEND_FAILED (10012)': '邮件发送失败',
    'EXPORT_IN_PROGRESS (10013)': '已有导出任务正在处理中',
    'EXPORT_NOT_READY (10014)': '导出文件尚未生成',
    'FORBIDDEN (20001)': '没有权限执行此操作',
    'BANNED (20002)': '已被禁言/封禁，无法执行此操作',
    'INSUFFICIENT_LEVEL (20003)': '等级不足，升级后解锁此功能',
    'NOT_MODERATOR_OF_BOARD (20004)': '只能管理所辖版块的内容',
    'NOT_FOUND (30001)': '内容不存在或已被删除',
    'POST_DELETED (30002)': '帖子已被删除',
    'RATE_LIMITED (40001)': '操作过于频繁，请稍后重试',
    'DUPLICATE_SUBMIT (40002)': '请勿重复提交',
    'SENSITIVE_WORD_HIT (40003)': '内容包含违规词汇，请修改后重试',
    'VERSION_CONFLICT (50001)': '内容已被他人编辑，请刷新后重试',
    'AUDIT_LOCKED (50002)': '该内容正在被审核处理中，请稍后',
  };
  return messages[code] || '发生未知错误，请稍后重试';
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || getErrorMessage(code));
    this.code = code;
  }
}
