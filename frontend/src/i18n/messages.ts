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
  "header.ask": "提问",
  "header.accountSettings": "账户设置",
  "header.logout": "退出登录",
  "header.openAi": "打开 Aris",
  "header.closeAi": "关闭 Aris",
  "header.layoutForum": "论坛为主布局",
  "header.layoutBalanced": "均衡布局",
  "header.layoutAi": "Aris 为主布局",
  "header.ctxSep": "·",
  "header.ctxForum": "论坛",
  "header.ctxAi": "Aris",
  "header.ctxHome": "首页",
  "header.ctxPostView": "帖子",

  "ai.artifactsPlaceholder":
    "预览区（Artifacts）：长文档、代码与图纸将在此展示；接入对话流后可联动高亮。",

  "sidebar.navTitle": "导航",
  "sidebar.closeNav": "关闭导航",
  "sidebar.collapseRail": "收起侧栏（仅图标）",
  "sidebar.expandRail": "展开侧栏",
  "sidebar.home": "首页",
  "sidebar.knowledgeBase": "知识库",
  "sidebar.spaces": "空间",
  "sidebar.createSpace": "创建空间",

  "ai.name": "Aris",
  "ai.closeAria": "关闭 Aris",
  "ai.greeting": "你好！我是 Aris。今天我能帮你什么？",
  "ai.subtitle": "智能助手",
  "ai.footerNote": "由 ArcPilot 驱动",
  "ai.inputPlaceholder": "输入消息…",
  "ai.unavailable": "对话能力尚未接入服务端，请稍后再试。",

  "feed.loading": "正在加载帖子…",
  "feed.error": "加载失败，请稍后重试。",
  "feed.empty": "暂时还没有帖子，去发布第一条吧。",
  "feed.topicFilterLabel": "当前话题：",
  "feed.topicUnnamed": "所选话题",
  "feed.clearTopicFilter": "查看全部",
  "feed.topicNotFound": "该话题不存在或已删除。",
  "feed.topicEmptyFallback": "该话题下暂时没有帖子，已为你展示全站最新内容。",

  "quickPost.placeholder": "你想分享什么？",
  "quickPost.ask": "提问",
  "quickPost.answer": "回答",
  "quickPost.post": "发帖",

  "post.backHome": "返回主页",
  "post.sendToAi": "发送给 Aris",
  "post.sendToAiAria": "将本帖内容发送到右侧 Aris 对话",

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
  "post.menuFollow": "关注作者",
  "post.menuUnfollow": "取消关注",
  "post.copyDone": "链接已复制",
  "post.deleteMenu": "删除帖子",
  "post.deleteConfirmTitle": "删除这条帖子？",
  "post.deleteConfirmBody": "删除后其他人将无法在列表中看到；回复会随帖子一并隐藏展示。此操作不可从界面恢复。",
  "post.deleteConfirm": "删除",
  "post.deleteCancel": "取消",
  "post.deleteSuccess": "帖子已删除",

  "search.title": "搜索帖子",
  "search.hintTitleOnly": "当前仅匹配标题中的关键词（子串），不支持分词或语序调换。",
  "search.backHome": "返回首页",
  "search.loading": "正在搜索…",
  "search.error": "搜索失败，请稍后重试。",
  "search.emptyNoQuery": "在顶部搜索框输入关键词并回车，即可在此查看结果。",
  "search.emptyNoResults": "没有找到标题里包含该关键词的帖子。试试别的词，或浏览话题、发新帖。",
  "search.suggestTopics": "浏览话题",
  "search.suggestPost": "去发帖",

  "topics.title": "话题",
  "topics.subtitle": "浏览社区话题；新建话题请在发帖时添加。",
  "topics.official": "官方",
  "topics.empty": "暂无话题",
  "topics.loadMore": "加载更多",
  "topics.loadingMore": "加载中…",
  "topics.endOfList": "已显示全部话题",

  "knowledge.title": "知识库",
  "knowledge.subtitle":
    "集中管理文档与检索知识，可与 RAG / 向量检索等服务对接。",
  "knowledge.placeholder": "文档上传与检索能力开发中，敬请期待。",
  "knowledge.hubTitle": "知识库",
  "knowledge.hubSubtitle": "按协作空间浏览文档；仅空间成员可查看与搜索。",
  "knowledge.hubLoading": "正在加载协作空间…",
  "knowledge.hubError": "无法加载空间列表，请稍后重试。",
  "knowledge.hubEmpty": "暂无协作空间。请先创建或加入空间后再使用知识库。",
  "knowledge.hubOpen": "进入",
  "knowledge.backHub": "返回知识库首页",
  "knowledge.loadingSpace": "加载中…",
  "knowledge.spaceHint": "左侧为目录；⌘K / Ctrl+K 搜索。",
  "knowledge.searchShortcut": "搜索（⌘K）",
  "knowledge.navAria": "知识库目录",
  "knowledge.emptyDocs": "该空间下暂无文档。可由编辑者在后台创建（需 API）。",
  "knowledge.outlinePlaceholder": "大纲：后续可从标题解析 H2/H3。",
  "knowledge.searchTitle": "搜索知识库",
  "knowledge.searchPlaceholder": "输入关键词…",
  "knowledge.searchEmpty": "没有匹配结果。",
  "knowledge.welcomeLine": "选择左侧文档开始阅读，或使用快捷键搜索。",
  "knowledge.pickDoc": "内容来自服务端存储的 Markdown，与协作空间权限一致。",
  "knowledge.backToSpace": "返回协作空间详情",
  "knowledge.loadingDoc": "正在加载文档…",
  "knowledge.loadError": "加载失败",
  "knowledge.backSpace": "返回本空间知识库",
  "knowledge.version": "版本",

  "sidebar.browseTopics": "浏览话题",
  "sidebar.addTopicHint": "发帖时添加或新建",
  "sidebar.collabSpaces": "协作空间",
  "sidebar.collabSpacesHint": "成员与文件",

  "collabSpaces.title": "协作空间",
  "collabSpaces.listSubtitle": "与成员共享资料；仅成员可访问空间内资源。",
  "collabSpaces.create": "创建协作空间",
  "collabSpaces.name": "名称",
  "collabSpaces.description": "说明（可选）",
  "collabSpaces.quotaHint": "配额字节（可选，留空使用默认）",
  "collabSpaces.empty": "暂无协作空间。",
  "collabSpaces.usedQuota": "已用 {used} / {total}",
  "collabSpaces.yourRole": "你的角色",
  "collabSpaces.backList": "返回列表",
  "collabSpaces.tabAssets": "资源",
  "collabSpaces.tabMembers": "成员",
  "collabSpaces.tabInvite": "邀请码",
  "collabSpaces.inviteRole": "受邀角色",
  "collabSpaces.generateInvite": "生成邀请码",
  "collabSpaces.inviteCode": "邀请码",
  "collabSpaces.copy": "复制",
  "collabSpaces.joinByCode": "通过邀请码加入",
  "collabSpaces.inviteCodePlaceholder": "粘贴邀请码",
  "collabSpaces.join": "加入",
  "collabSpaces.upload": "上传",
  "collabSpaces.uploadHint": "选择文件后将直传至服务端（预签名流程）。",
  "collabSpaces.assetVersion": "版本",
  "collabSpaces.assetType": "类型",
  "collabSpaces.assetSize": "大小",
  "collabSpaces.delete": "删除",
  "collabSpaces.loading": "加载中…",
  "collabSpaces.error": "加载失败",
  "collabSpaces.noAssets": "暂无资源",
  "collabSpaces.inviteHint": "生成后邀请码会复制到剪贴板，并显示在提示中。",

  "composer.newTopic": "新建话题",
  "composer.newTopicName": "话题名称",
  "composer.newTopicDesc": "说明（可选）",
  "composer.createTopic": "创建并选用",
  "composer.similarTopics": "相似已有话题",
  "composer.topicLimit": "今日新建话题已达上限，请明日再试或选用已有话题",

  "settings.bioLabel": "个人简介",
  "settings.bioPlaceholder":
    "一句话介绍自己，会显示在帖子头像旁（最多 160 字）",

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
  "header.ask": "Ask",
  "header.accountSettings": "Account settings",
  "header.logout": "Log out",
  "header.openAi": "Open Aris",
  "header.closeAi": "Close Aris",
  "header.layoutForum": "Forum-first layout",
  "header.layoutBalanced": "Balanced layout",
  "header.layoutAi": "Aris-first layout",
  "header.ctxSep": "·",
  "header.ctxForum": "Forum",
  "header.ctxAi": "Aris",
  "header.ctxHome": "Home",
  "header.ctxPostView": "Post",

  "ai.artifactsPlaceholder":
    "Preview (Artifacts): long docs, code, and figures will appear here; link highlights when wired to chat.",

  "sidebar.navTitle": "Navigation",
  "sidebar.closeNav": "Close navigation",
  "sidebar.collapseRail": "Collapse sidebar (icons only)",
  "sidebar.expandRail": "Expand sidebar",
  "sidebar.home": "Home",
  "sidebar.knowledgeBase": "Knowledge base",
  "sidebar.spaces": "Spaces",
  "sidebar.createSpace": "Create Space",

  "ai.name": "Aris",
  "ai.closeAria": "Close Aris",
  "ai.greeting": "Hello! I'm Aris. How can I help you today?",
  "ai.subtitle": "Assistant",
  "ai.footerNote": "Powered by ArcPilot",
  "ai.inputPlaceholder": "Type your message…",
  "ai.unavailable": "Assistant is not connected yet. Please try again later.",

  "feed.loading": "Loading posts…",
  "feed.error": "Failed to load. Please try again.",
  "feed.empty": "No posts yet. Be the first to publish.",
  "feed.topicFilterLabel": "Topic:",
  "feed.topicUnnamed": "Selected topic",
  "feed.clearTopicFilter": "Show all",
  "feed.topicNotFound": "This topic does not exist or was removed.",
  "feed.topicEmptyFallback":
    "No posts in this topic yet. Showing the latest from the whole site.",

  "quickPost.placeholder": "What do you want to share?",
  "quickPost.ask": "Ask",
  "quickPost.answer": "Answer",
  "quickPost.post": "Post",

  "post.backHome": "Back to home",
  "post.sendToAi": "Send to Aris",
  "post.sendToAiAria": "Send this post to Aris on the right",

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
  "post.menuFollow": "Follow author",
  "post.menuUnfollow": "Unfollow",
  "post.copyDone": "Link copied",
  "post.deleteMenu": "Delete post",
  "post.deleteConfirmTitle": "Delete this post?",
  "post.deleteConfirmBody":
    "Others will no longer see it in feeds; replies stay hidden with the thread. You cannot undo this from the UI.",
  "post.deleteConfirm": "Delete",
  "post.deleteCancel": "Cancel",
  "post.deleteSuccess": "Post deleted",

  "search.title": "Search posts",
  "search.hintTitleOnly":
    "Matches substrings in titles only — no tokenization or word reordering.",
  "search.backHome": "Back to home",
  "search.loading": "Searching…",
  "search.error": "Search failed. Try again later.",
  "search.emptyNoQuery":
    "Type a keyword in the header search box and press Enter to see results here.",
  "search.emptyNoResults":
    "No posts with that keyword in the title. Try other words, browse topics, or create a post.",
  "search.suggestTopics": "Browse topics",
  "search.suggestPost": "Create a post",

  "topics.title": "Topics",
  "topics.subtitle":
    "Browse community topics. To create one, add it while posting.",
  "topics.official": "Official",
  "topics.empty": "No topics yet",
  "topics.loadMore": "Load more",
  "topics.loadingMore": "Loading…",
  "topics.endOfList": "End of list",

  "knowledge.title": "Knowledge base",
  "knowledge.subtitle":
    "Manage documents and retrieval; connect to RAG / vector search when ready.",
  "knowledge.placeholder": "Upload and search are coming soon — stay tuned.",
  "knowledge.hubTitle": "Knowledge base",
  "knowledge.hubSubtitle": "Browse by collab space; members only.",
  "knowledge.hubLoading": "Loading spaces…",
  "knowledge.hubError": "Could not load spaces. Try again later.",
  "knowledge.hubEmpty": "No collab spaces yet. Create or join a space first.",
  "knowledge.hubOpen": "Open",
  "knowledge.backHub": "Back to knowledge hub",
  "knowledge.loadingSpace": "Loading…",
  "knowledge.spaceHint": "Directory on the left; ⌘K / Ctrl+K to search.",
  "knowledge.searchShortcut": "Search (⌘K)",
  "knowledge.navAria": "Knowledge navigation",
  "knowledge.emptyDocs": "No documents in this space yet.",
  "knowledge.outlinePlaceholder": "Outline: H2/H3 extraction later.",
  "knowledge.searchTitle": "Search knowledge",
  "knowledge.searchPlaceholder": "Type a keyword…",
  "knowledge.searchEmpty": "No matches.",
  "knowledge.welcomeLine": "Pick a document on the left or press ⌘K to search.",
  "knowledge.pickDoc":
    "Content is Markdown from the API; permissions follow the space.",
  "knowledge.backToSpace": "Back to collab space",
  "knowledge.loadingDoc": "Loading document…",
  "knowledge.loadError": "Failed to load",
  "knowledge.backSpace": "Back to this space knowledge",
  "knowledge.version": "Version",

  "sidebar.browseTopics": "Browse topics",
  "sidebar.addTopicHint": "Add when posting",
  "sidebar.collabSpaces": "Collab spaces",
  "sidebar.collabSpacesHint": "Members & files",

  "collabSpaces.title": "Collab spaces",
  "collabSpaces.listSubtitle":
    "Share materials with members; only members can access assets.",
  "collabSpaces.create": "Create collab space",
  "collabSpaces.name": "Name",
  "collabSpaces.description": "Description (optional)",
  "collabSpaces.quotaHint": "Quota in bytes (optional, default if empty)",
  "collabSpaces.empty": "No collab spaces yet.",
  "collabSpaces.usedQuota": "Used {used} / {total}",
  "collabSpaces.yourRole": "Your role",
  "collabSpaces.backList": "Back to list",
  "collabSpaces.tabAssets": "Assets",
  "collabSpaces.tabMembers": "Members",
  "collabSpaces.tabInvite": "Invite code",
  "collabSpaces.inviteRole": "Invitee role",
  "collabSpaces.generateInvite": "Generate invite code",
  "collabSpaces.inviteCode": "Invite code",
  "collabSpaces.copy": "Copy",
  "collabSpaces.joinByCode": "Join with invite code",
  "collabSpaces.inviteCodePlaceholder": "Paste invite code",
  "collabSpaces.join": "Join",
  "collabSpaces.upload": "Upload",
  "collabSpaces.uploadHint": "Files are uploaded directly (presigned flow).",
  "collabSpaces.assetVersion": "Ver.",
  "collabSpaces.assetType": "Type",
  "collabSpaces.assetSize": "Size",
  "collabSpaces.delete": "Delete",
  "collabSpaces.loading": "Loading…",
  "collabSpaces.error": "Failed to load",
  "collabSpaces.noAssets": "No assets yet",
  "collabSpaces.inviteHint":
    "The invite code is copied to the clipboard and shown in a toast.",

  "composer.newTopic": "New topic",
  "composer.newTopicName": "Topic name",
  "composer.newTopicDesc": "Description (optional)",
  "composer.createTopic": "Create & attach",
  "composer.similarTopics": "Similar existing topics",
  "composer.topicLimit":
    "Daily limit reached — try tomorrow or pick an existing topic",

  "settings.bioLabel": "Bio",
  "settings.bioPlaceholder":
    "Short intro shown next to your name in feeds (max 160 characters)",

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

/** 详情页/回复：按东八区（Asia/Shanghai）显示绝对时间，避免直接展示 UTC ISO 串 */
export function formatChinaWallTime(iso: string, locale: Locale): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  if (locale === "zh") {
    const s = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d)
    return `${s}（北京时间）`
  }

  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
  return `${s} (GMT+8)`
}
