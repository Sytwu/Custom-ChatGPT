export const translations = {
  "zh-TW": {
    // App header
    appTitle: "Custom ChatGPT",

    // Conversation sidebar
    chats: "對話",
    expandChats: "展開對話列表",
    collapseChats: "收起對話列表",
    newChat: "+ 新對話",
    newGroup: "新群組",
    groupNamePlaceholder: "群組名稱…",
    deleteThisChat: "刪除此對話？",
    delete: "刪除",
    cancel: "取消",
    today: "今天",
    yesterday: "昨天",

    // Group row
    deleteGroup: "刪除群組",
    ragEnabled: "群組 RAG 已啟用",
    enableGroupRag: "啟用群組 RAG",
    disableGroupRag: "停用群組 RAG",
    renameGroup: "重新命名群組",
    deleteGroupBtn: "刪除群組",
    groupColour: "群組顏色",
    expand: "展開",
    collapse: "收起",

    // Settings sidebar
    settings: "設定",
    expandSettings: "展開設定",
    collapseSettings: "收起設定",

    // API Keys
    groqApiKey: "Groq API Key",
    nvidiaApiKey: "NVIDIA API Key",
    apiKeyPlaceholder: "輸入您的 API 金鑰",
    showKey: "顯示金鑰",
    hideKey: "隱藏金鑰",

    // Model selector
    model: "模型",

    // System prompt
    systemPrompt: "系統提示詞",
    systemPromptPlaceholder: "You are a helpful assistant.",

    // Temperature
    temperature: "溫度",
    precise: "精確 (0)",
    creative: "創意 (2)",

    // Max tokens
    maxTokens: "最大 Token 數",

    // Memory controls
    shortTermMemory: "短期記憶",
    keepLastTurns: "保留最近",
    turns: "輪對話",
    memoryHint: (n) => `1 輪 = 1 問答。每次請求最多傳送 ${n * 2} 則訊息。`,
    memoryOffHint: "記憶已關閉 — 僅傳送當前訊息。",

    // Input bar
    inputPlaceholder: "輸入訊息… (Enter 傳送，Shift+Enter 換行)",
    discordInputPlaceholder: "輸入訊息… (Enter 加入佇列，Shift+Enter 換行)",
    attachFile: "附加檔案（PDF、TXT、程式碼…）",
    stop: "⏹ 停止",
    send: "傳送",
    stopGeneration: "停止生成",
    imageNotSupported: "目前模型不支援圖片，請換用 Vision 模型",
    visionModelRequired: "圖片需要 Vision 模型",

    // File attachment
    truncated: "已截斷",

    // Prompt suggestions panel
    suggestImproved: "改善建議",
    applyImproved: "套用",
    suggestTemplates: "Prompt 模板",
    loadingSuggestions: "建議中…",
    suggestError: "無法取得建議",
    suggestBtn: "✨ 改善",

    // Conversation actions
    colour: "顏色",
    rename: "重新命名",
    deleteConv: "刪除",
    compressConv: "壓縮對話",
    compressing: "壓縮中…",
    compressConfirm: "壓縮後舊訊息將刪除，確定嗎？",
    compressFailed: "壓縮失敗，請稍後再試",

    // Discord Mode
    discordModeBeta: "Discord 模式 (beta)",
    discordModeDesc: "模擬 Discord 聊天介面，支援回覆與 Emoji 反應",
    createChat: "建立對話",
    replyingTo: "回覆",
    cancelReply: "取消",
    addReaction: "新增反應",
    addToQueue: "加入佇列",
    sendAll: "全部送出",
    stickers: "貼圖",
    clearQueue: "清空佇列",

    // Auth
    loginWithGoogle: "使用 Google 登入",
    logout: "登出",
    loginRequired: "請先登入以使用記憶功能",
    loggedInAs: "已登入：",

    // Memory extraction
    extractMemory: "萃取記憶",
    memoryExtracted: (n) => `已新增 ${n} 條記憶`,
    noNewMemory: "未找到新記憶",
    memoryExtractFailed: "萃取失敗，請稍後再試",
    memoryLimitReached: "記憶已達上限（50 條），請刪除舊記憶後再試",
    memoryError: "操作失敗，請稍後再試",

    // Memory settings
    memory: "長期記憶",
    memoryList: "記憶列表",
    addMemory: "新增記憶",
    memoryPlaceholder: "輸入要記住的事實…",
    sourceManual: "手動",
    sourceAuto: "自動",
    deleteMemory: "刪除此記憶",
    noMemories: "尚無記憶。對話後按「萃取記憶」可自動新增。",
  },

  en: {
    // App header
    appTitle: "Custom ChatGPT",

    // Conversation sidebar
    chats: "Chats",
    expandChats: "Expand chats",
    collapseChats: "Collapse chats",
    newChat: "+ New Chat",
    newGroup: "New group",
    groupNamePlaceholder: "Group name…",
    deleteThisChat: "Delete this chat?",
    delete: "Delete",
    cancel: "Cancel",
    today: "Today",
    yesterday: "Yesterday",

    // Group row
    deleteGroup: "Delete group",
    ragEnabled: "Group RAG enabled",
    enableGroupRag: "Enable group RAG",
    disableGroupRag: "Disable group RAG",
    renameGroup: "Rename group",
    deleteGroupBtn: "Delete group",
    groupColour: "Group colour",
    expand: "Expand",
    collapse: "Collapse",

    // Settings sidebar
    settings: "Settings",
    expandSettings: "Expand settings",
    collapseSettings: "Collapse settings",

    // API Keys
    groqApiKey: "Groq API Key",
    nvidiaApiKey: "NVIDIA API Key",
    apiKeyPlaceholder: "Enter your API key here",
    showKey: "Show key",
    hideKey: "Hide key",

    // Model selector
    model: "Model",

    // System prompt
    systemPrompt: "System Prompt",
    systemPromptPlaceholder: "You are a helpful assistant.",

    // Temperature
    temperature: "Temperature",
    precise: "Precise (0)",
    creative: "Creative (2)",

    // Max tokens
    maxTokens: "Max Tokens",

    // Memory controls
    shortTermMemory: "Short-term Memory",
    keepLastTurns: "Keep last",
    turns: "turns",
    memoryHint: (n) => `1 turn = 1 Q&A pair. Max ${n * 2} messages sent per request.`,
    memoryOffHint: "Memory off — only the current message is sent.",

    // Input bar
    inputPlaceholder: "Type a message… (Enter to send, Shift+Enter for newline)",
    discordInputPlaceholder: "Type a message… (Enter to queue, Shift+Enter for newline)",
    attachFile: "Attach file (PDF, TXT, code files…)",
    stop: "⏹ Stop",
    send: "Send",
    stopGeneration: "Stop generation",
    imageNotSupported: "Current model doesn't support images. Switch to a Vision model.",
    visionModelRequired: "Vision model required for images",

    // File attachment
    truncated: "truncated",

    // Prompt suggestions panel
    suggestImproved: "Improved Version",
    applyImproved: "Apply",
    suggestTemplates: "Prompt Templates",
    loadingSuggestions: "Suggesting…",
    suggestError: "Unable to get suggestions",
    suggestBtn: "✨ Improve",

    // Conversation actions
    colour: "Colour",
    rename: "Rename",
    deleteConv: "Delete",
    compressConv: "Compress",
    compressing: "Compressing…",
    compressConfirm: "Compressing will delete old messages. Continue?",
    compressFailed: "Compress failed, please try again",

    // Discord Mode
    discordModeBeta: "Discord Mode (beta)",
    discordModeDesc: "Discord-style chat with replies and emoji reactions",
    createChat: "Create Chat",
    replyingTo: "Replying to",
    cancelReply: "Cancel",
    addReaction: "Add Reaction",
    addToQueue: "Add to Queue",
    sendAll: "Send All",
    stickers: "Stickers",
    clearQueue: "Clear Queue",

    // Auth
    loginWithGoogle: "Sign in with Google",
    logout: "Sign out",
    loginRequired: "Sign in to use memory features",
    loggedInAs: "Signed in as ",

    // Memory extraction
    extractMemory: "Extract Memory",
    memoryExtracted: (n) => `Added ${n} memory item${n !== 1 ? "s" : ""}`,
    noNewMemory: "No new memories found",
    memoryExtractFailed: "Extract failed, please try again",
    memoryLimitReached: "Memory limit reached (50). Please delete old memories first.",
    memoryError: "Operation failed, please try again",

    // Memory settings
    memory: "Memory",
    memoryList: "Memory List",
    addMemory: "Add",
    memoryPlaceholder: "Enter a fact…",
    sourceManual: "Manual",
    sourceAuto: "Auto",
    deleteMemory: "Delete",
    noMemories: "No memories yet. Extract memory after a conversation to add some.",
  },
};
