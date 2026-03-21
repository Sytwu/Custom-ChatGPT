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

    // Discord Mode
    discordModeBeta: "Discord 模式 (beta)",
    discordModeDesc: "模擬 Discord 聊天介面，支援回覆與 Emoji 反應",
    createChat: "建立對話",
    replyingTo: "回覆",
    cancelReply: "取消",
    addReaction: "新增反應",
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

    // Discord Mode
    discordModeBeta: "Discord Mode (beta)",
    discordModeDesc: "Discord-style chat with replies and emoji reactions",
    createChat: "Create Chat",
    replyingTo: "Replying to",
    cancelReply: "Cancel",
    addReaction: "Add Reaction",
  },
};
