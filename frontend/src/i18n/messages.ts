export type Locale = "zh" | "en"

export const LOCALE_STORAGE_KEY = "arcpilot-locale"

export function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw === "zh" || raw === "en") return raw
  } catch {
    // ignore
  }
  return "zh"
}

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "zh", label: "简体中文" },
  { value: "en", label: "English" },
]

const zh = {
  "header.searchPlaceholder": "Search Arcpilot",
  "header.navOpen": "打开导航菜单",
  "header.navClose": "关闭导航菜单",
  "header.language": "语言",
  "header.notifications": "通知",
  "header.ask": "提问",
  "header.accountSettings": "账户设置",
  "header.logout": "退出登录",

  "sidebar.navTitle": "导航",
  "sidebar.closeNav": "关闭导航",
  "sidebar.home": "首页",
  "sidebar.following": "关注",
  "sidebar.answer": "回答",
  "sidebar.notifications": "通知",
  "sidebar.spaces": "空间",
  "sidebar.createSpace": "创建空间",

  "ai.closeAria": "关闭 AI 助手",
  "ai.greeting":
    "你好！我是 Arcpilot AI。今天我能帮你什么？",
  "ai.subtitle": "智能助手",
  "ai.inputPlaceholder": "输入消息…",

  "feed.loading": "正在加载帖子…",
  "feed.error": "加载失败，请稍后重试。",
  "feed.empty": "暂时还没有帖子，去发布第一条吧。",

  "quickPost.placeholder": "你想分享什么？",
  "quickPost.ask": "提问",
  "quickPost.answer": "回答",
  "quickPost.post": "发帖",

  "post.backHome": "返回主页",
  "post.sendToAi": "发送到 AI 助手",
  "post.sendToAiAria": "将本帖内容发送到右侧 AI 对话框",

  "profile.loading": "加载资料中…",
  "profile.notFound": "用户不存在或已删除。",
  "profile.follow": "关注",
  "profile.unfollow": "取消关注",
  "profile.followers": "粉丝",
  "profile.following": "关注",
  "profile.tabPosts": "发布的帖子",
  "profile.tabAnswered": "回答过的帖子",
  "profile.selfHint": "这是你的主页",

  "post.menuMore": "更多操作",
  "post.menuCopyLink": "复制链接",
  "post.menuReport": "举报",
  "post.menuFollow": "关注作者",
  "post.menuUnfollow": "取消关注",
  "post.menuNotInterested": "不感兴趣",
  "post.copyDone": "链接已复制",
  "post.reportThanks": "感谢反馈，我们会尽快处理",
  "post.hiddenToast": "将减少展示类似内容",

  "topics.title": "话题",
  "topics.subtitle": "浏览社区话题；新建话题请在发帖时添加。",
  "topics.official": "官方",
  "topics.empty": "暂无话题",

  "sidebar.browseTopics": "浏览话题",
  "sidebar.addTopicHint": "发帖时添加或新建",

  "composer.newTopic": "新建话题",
  "composer.newTopicName": "话题名称",
  "composer.newTopicDesc": "说明（可选）",
  "composer.createTopic": "创建并选用",
  "composer.similarTopics": "相似已有话题",
  "composer.topicLimit": "今日新建话题已达上限，请明日再试或选用已有话题",

  "settings.bioLabel": "个人简介",
  "settings.bioPlaceholder": "一句话介绍自己，会显示在帖子头像旁（最多 160 字）",

  "time.justNow": "刚刚",
  "time.minutesAgo": "{n} 分钟前",
  "time.hoursAgo": "{n} 小时前",
  "time.daysAgo": "{n} 天前",
} as const

const en = {
  "header.searchPlaceholder": "Search Arcpilot",
  "header.navOpen": "Open navigation",
  "header.navClose": "Close navigation",
  "header.language": "Language",
  "header.notifications": "Notifications",
  "header.ask": "Ask",
  "header.accountSettings": "Account settings",
  "header.logout": "Log out",

  "sidebar.navTitle": "Navigation",
  "sidebar.closeNav": "Close navigation",
  "sidebar.home": "Home",
  "sidebar.following": "Following",
  "sidebar.answer": "Answer",
  "sidebar.notifications": "Notifications",
  "sidebar.spaces": "Spaces",
  "sidebar.createSpace": "Create Space",

  "ai.closeAria": "Close AI assistant",
  "ai.greeting": "Hello! I'm Arcpilot AI. How can I help you today?",
  "ai.subtitle": "Intelligent Assistant",
  "ai.inputPlaceholder": "Type your message…",

  "feed.loading": "Loading posts…",
  "feed.error": "Failed to load. Please try again.",
  "feed.empty": "No posts yet. Be the first to publish.",

  "quickPost.placeholder": "What do you want to share?",
  "quickPost.ask": "Ask",
  "quickPost.answer": "Answer",
  "quickPost.post": "Post",

  "post.backHome": "Back to home",
  "post.sendToAi": "Send to AI",
  "post.sendToAiAria": "Send this post to the AI panel on the right",

  "profile.loading": "Loading profile…",
  "profile.notFound": "User not found.",
  "profile.follow": "Follow",
  "profile.unfollow": "Unfollow",
  "profile.followers": "Followers",
  "profile.following": "Following",
  "profile.tabPosts": "Posts",
  "profile.tabAnswered": "Answered posts",
  "profile.selfHint": "This is your profile",

  "post.menuMore": "More",
  "post.menuCopyLink": "Copy link",
  "post.menuReport": "Report",
  "post.menuFollow": "Follow author",
  "post.menuUnfollow": "Unfollow",
  "post.menuNotInterested": "Not interested",
  "post.copyDone": "Link copied",
  "post.reportThanks": "Thanks — we'll review it",
  "post.hiddenToast": "We'll show fewer posts like this",

  "topics.title": "Topics",
  "topics.subtitle": "Browse community topics. To create one, add it while posting.",
  "topics.official": "Official",
  "topics.empty": "No topics yet",

  "sidebar.browseTopics": "Browse topics",
  "sidebar.addTopicHint": "Add when posting",

  "composer.newTopic": "New topic",
  "composer.newTopicName": "Topic name",
  "composer.newTopicDesc": "Description (optional)",
  "composer.createTopic": "Create & attach",
  "composer.similarTopics": "Similar existing topics",
  "composer.topicLimit": "Daily limit reached — try tomorrow or pick an existing topic",

  "settings.bioLabel": "Bio",
  "settings.bioPlaceholder": "Short intro shown next to your name in feeds (max 160 characters)",

  "time.justNow": "just now",
  "time.minutesAgo": "{n} min ago",
  "time.hoursAgo": "{n} h ago",
  "time.daysAgo": "{n} d ago",
} as const

export type MessageKey = keyof typeof zh

const tables: Record<Locale, Record<MessageKey, string>> = { zh, en }

export function getMessage(locale: Locale, key: MessageKey): string {
  return tables[locale][key]
}

/** 模板里用 {n} 占位 */
export function getMessageWith(
  locale: Locale,
  key: MessageKey,
  vars: Record<string, string | number>,
): string {
  let s = getMessage(locale, key)
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
  }
  return s
}

export function formatRelativeTime(iso: string, locale: Locale): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return getMessage(locale, "time.justNow")

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return getMessageWith(locale, "time.minutesAgo", { n: diffMin })
  }

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) {
    return getMessageWith(locale, "time.hoursAgo", { n: diffHour })
  }

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) {
    return getMessageWith(locale, "time.daysAgo", { n: diffDay })
  }

  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")
}

export function buildAiMockReply(locale: Locale, userInput: string): string {
  if (locale === "zh") {
    return (
      `这是一个模拟的流式输出示例，用于演示 ArcPilot 的打字机效果。\n\n` +
      `你的问题是：「${userInput}」。下面是一些思路：\n` +
      `1. 明确 GIS 任务目标与数据范围；\n` +
      `2. 选用合适的数据结构与空间分析工具；\n` +
      `3. 逐步验证结果并可视化输出。`
    )
  }
  return (
    `This is a mock streamed reply to demonstrate ArcPilot's typewriter effect.\n\n` +
    `Your question: "${userInput}". Here are some ideas:\n` +
    `1. Clarify the GIS goal and data scope;\n` +
    `2. Pick appropriate structures and spatial tools;\n` +
    `3. Validate incrementally and visualize results.`
  )
}
