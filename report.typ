// ── Page & text setup ────────────────────────────────────────────────────────
#set page(paper: "a4", margin: (top: 1.6cm, bottom: 1.6cm, left: 2.2cm, right: 2.2cm))
#set text(font: "New Computer Modern", size: 10.5pt)
#set par(justify: true, leading: 0.6em)
#set heading(numbering: "1.")

#show heading.where(level: 1): it => {
  v(0.45em)
  block(text(size: 13pt, weight: "bold", it))
  v(0.2em)
}
#show heading.where(level: 2): it => {
  v(0.3em)
  block(text(size: 11pt, weight: "bold", it))
  v(0.1em)
}

// ── Diagram helpers (no external packages) ───────────────────────────────────
#let anode(body, bg: white, w: auto) = box(
  fill: bg,
  stroke: 0.5pt + luma(110),
  inset: (x: 8pt, y: 6pt),
  radius: 3pt,
  width: w,
  align(center, body),
)
#let layer-wrap(label-text, accent, body) = rect(
  fill: accent.lighten(88%),
  stroke: 0.5pt + accent.lighten(40%),
  inset: 9pt,
  radius: 3pt,
  width: 100%,
)[
  #text(size: 8pt, fill: accent.darken(10%), weight: "bold")[#label-text]
  #v(5pt)
  #body
]
#let dn = align(center, text(size: 13pt, fill: luma(100))[↓])
#let rt = box(inset: (x: 4pt), text(size: 12pt, fill: luma(90))[→])
#let brt = box(inset: (x: 4pt), text(size: 12pt, fill: luma(90))[↔])

// ════════════════════════════════════════════════════════════════════════════
//  TITLE BLOCK
// ════════════════════════════════════════════════════════════════════════════
#align(center)[
  #v(0.1cm)
  #text(size: 20pt, weight: "bold")[Custom ChatGPT]
  #v(0.15em)
  #text(size: 12pt, fill: luma(70))[HW2 — My very powerful Chatbot]
  #v(0.25em)
  #text(size: 10.5pt)[Li-Zhong Szu-Tu · 111550159]
  #v(0.25em)
  #line(length: 100%, stroke: 0.5pt + luma(170))
  #v(-0.15em)
]

// ════════════════════════════════════════════════════════════════════════════
//  SECTION 1  —  System Introduction                          (one page)
// ════════════════════════════════════════════════════════════════════════════
= System Introduction

Custom ChatGPT is a full-stack web application powered by multiple LLM providers. A *React + Vite* frontend streams responses from an *Express.js* backend routing to *Groq Cloud* or *NVIDIA NIM* — with intelligent auto-routing, long-term memory, agentic tool use, and multimodal vision built in.

== Key Features

#let feat(title, body) = rect(
  fill: luma(248),
  stroke: 0.4pt + luma(200),
  inset: (x: 8pt, y: 6pt),
  radius: 3pt,
)[
  *#title*\
  #text(size: 9pt)[#body]
]

#grid(
  columns: (1fr, 1fr),
  gutter: 6pt,
  feat(
    "Multi-Provider LLM Routing",
    [A unified router dispatches to Groq or NVIDIA NIM by model-ID prefix. Adding a new provider requires no frontend changes.],
  ),
  feat(
    "Intelligent Auto-Routing",
    [Rule-based routing selects vision models when an image is attached; otherwise an LLM call to `/api/route` picks the best model for the query automatically.],
  ),

  feat(
    "Long-term Memory",
    [An LLM automatically extracts key facts from each conversation and stores them server-side per user. Recalled memories are prepended to every subsequent system prompt.],
  ),
  feat(
    "Tool Use & Code Execution",
    [An agentic loop supports `python_execute` (sandboxed Python) and web search (Tavily). A dedicated 8B model drives tool selection; results feed back into the final response.],
  ),

  feat(
    "Multimodal Vision",
    [Images are compressed client-side (Canvas API, max 1920 px, JPEG 85 %) and sent in OpenAI vision array format. Non-vision models block attachment with a UI warning.],
  ),
  feat(
    "Group-Scoped RAG",
    [Sibling-conversation passages are embedded via NVIDIA NIM; top-K results by cosine similarity are prepended to the system prompt before each request.],
  ),

  feat(
    "Discord Mode",
    [Per-conversation toggle that queues messages on Enter. A batch-send button dispatches all queued messages and receives one unified streamed response.],
  ),
  feat(
    "Prompt Suggestion Engine",
    [`/api/suggest` rewrites the user's draft and returns structured template alternatives in a fixed JSON schema, powered by the same LLM infrastructure.],
  ),

  feat(
    "Real-Time SSE Streaming",
    [Tokens stream as Server-Sent Events and are appended live in the UI via `ReadableStream`. The backend always closes with `[DONE]` for clean error recovery.],
  ),
  feat(
    "Theming, i18n & Customisation",
    [Dark/light theme, Traditional Chinese / English localisation, custom sticker packs, per-conversation color labels, drag-and-drop group management.],
  ),
)

== Technology Stack

#table(
  columns: (2.2cm, 1fr),
  stroke: 0.4pt + luma(190),
  inset: 6pt,
  fill: (_, row) => if calc.odd(row) { luma(248) } else { white },
  table.header(text(weight: "bold", size: 9.5pt)[Layer], text(weight: "bold", size: 9.5pt)[Technologies]),
  text(size: 9.5pt)[Frontend],
  text(size: 9.5pt)[React 18, Vite, React Context + useReducer, \@dnd-kit, ReactMarkdown, rehype-highlight, pdfjs-dist],

  text(size: 9.5pt)[Backend], text(size: 9.5pt)[Node.js 20, Express.js, SSE streaming, CORS, dotenv],
  text(size: 9.5pt)[LLM APIs],
  text(size: 9.5pt)[Groq Cloud (Llama, Mixtral, Gemma …), NVIDIA NIM (Llama, Mistral, DeepSeek, Qwen …)],

  text(size: 9.5pt)[RAG],
  text(
    size: 9.5pt,
  )[NVIDIA NIM Embeddings (`nv-embedqa-e5-v5`), cosine-similarity ranking, group-scoped passage retrieval],

  text(size: 9.5pt)[Deployment],
  text(size: 9.5pt)[Backend → Render (Docker · `render.yaml`), Frontend → Vercel (static · `vercel.json`)],
)

#pagebreak()

// ════════════════════════════════════════════════════════════════════════════
//  SECTION 2  —  System Architecture Diagram
// ════════════════════════════════════════════════════════════════════════════
= System Architecture Diagram

#v(0.4em)

// ── CLIENT LAYER ─────────────────────────────────────────────────────────────
#layer-wrap("CLIENT LAYER", rgb("#0ea5e9"))[
  #grid(
    columns: (auto, auto, 1fr, auto, auto),
    gutter: 0pt,
    align: center + horizon,
    anode(
      [*User*\ #text(size: 8pt)[Browser]],
      bg: luma(225),
    ),
    rt,
    anode(
      [*React SPA* #h(1em) #text(size: 8pt, fill: luma(70))[(Vite)]\ #text(size: 8pt)[Context/useReducer · useChat · useRag\ InputBar · MessageList · ConversationSidebar]],
      bg: rgb("#dbeafe"),
      w: 100%,
    ),
    brt,
    anode(
      [*localStorage*\ #text(size: 8pt)[conversations · settings\ api keys · groups]],
      bg: rgb("#fef9c3"),
    ),
  )
]

#dn

// ── API LAYER ────────────────────────────────────────────────────────────────
#layer-wrap("API LAYER", rgb("#22c55e"))[
  #anode(
    [*Express.js Backend*\ #text(size: 8pt)[`/api/chat/stream` · `/api/route` · `/api/suggest` · `/api/rag/search` · `/api/memory`]],
    bg: rgb("#dcfce7"),
    w: 100%,
  )
]

// split arrows — 3 columns for 3 service sub-layers
#v(2pt)
#grid(
  columns: (1fr, 1fr, 1fr),
  align(center, text(size: 13pt, fill: luma(100))[↙]),
  align(center, text(size: 13pt, fill: luma(100))[↓]),
  align(center, text(size: 13pt, fill: luma(100))[↘]),
)
#v(-4pt)

// ── SERVICE LAYER ────────────────────────────────────────────────────────────
#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 8pt,

  layer-wrap("LLM ROUTING & AUTO-ROUTING", rgb("#a855f7"))[
    #anode(
      [*Auto-Router* #text(size: 8pt, fill: luma(70))[(/api/route)]\ #text(size: 8pt)[rule-based (vision) + LLM-based\ selects best model per query]],
      bg: rgb("#f3e8ff"),
      w: 100%,
    )
    #v(5pt)
    #anode(
      [*LLM Router* #text(size: 8pt, fill: luma(70))[(llm.js)]\ #text(size: 8pt)[prefix matching · streamChat()\ completeChat()]],
      bg: rgb("#f3e8ff"),
      w: 100%,
    )
    #v(5pt)
    #grid(
      columns: (1fr, 1fr),
      gutter: 4pt,
      anode(
        [*Groq*\ #text(size: 8pt)[Llama · Gemma\ Mixtral …]],
        bg: rgb("#fee2e2"),
        w: 100%,
      ),
      anode(
        [*NIM*\ #text(size: 8pt)[Llama · Mistral\ DeepSeek …]],
        bg: rgb("#ffedd5"),
        w: 100%,
      ),
    )
  ],

  layer-wrap("TOOL USE", rgb("#f59e0b"))[
    #anode(
      [*Tool Loop* #text(size: 8pt, fill: luma(70))[(routes/chat.js)]\ #text(size: 8pt)[agentic multi-turn loop\ 8B model drives tool calls]],
      bg: rgb("#fef3c7"),
      w: 100%,
    )
    #v(5pt)
    #anode(
      [*python_execute*\ #text(size: 8pt)[sandboxed Python\ in Docker container]],
      bg: rgb("#fef9c3"),
      w: 100%,
    )
    #v(5pt)
    #anode(
      [*Web Search*\ #text(size: 8pt)[Tavily Search API\ live web results]],
      bg: rgb("#fef9c3"),
      w: 100%,
    )
  ],

  layer-wrap("MEMORY & RAG", rgb("#0ea5e9"))[
    #anode(
      [*Long-term Memory* #text(size: 8pt, fill: luma(70))[(/api/memory)]\ #text(size: 8pt)[LLM-extracted facts per user\ prepended to system prompt]],
      bg: rgb("#e0f2fe"),
      w: 100%,
    )
    #v(5pt)
    #anode(
      [*RAG Orchestrator*\ #text(size: 8pt)[useRag.js + embeddings.js\ top-K cosine similarity]],
      bg: rgb("#e0f2fe"),
      w: 100%,
    )
    #v(5pt)
    #anode(
      [*NIM Embeddings*\ #text(size: 8pt)[nv-embedqa-e5-v5\ NVIDIA NIM API]],
      bg: rgb("#ffedd5"),
      w: 100%,
    )
  ],
)

#v(0.8em)

// ── Data-flow summary ─────────────────────────────────────────────────────────
#block(
  fill: luma(247),
  stroke: 0.4pt + luma(185),
  inset: 9pt,
  radius: 3pt,
  width: 100%,
)[
  #text(size: 9.5pt)[
    *Data-flow summary.* ①  The user sends a message; recalled long-term memories are fetched from `/api/memory` and prepended to the system prompt. ②  If `autoRouting` is on, `/api/route` selects the best model (rule-based for images, LLM-based otherwise). ③  When the conversation belongs to a RAG-enabled group, top-K passages are retrieved via `/api/rag/search` (NVIDIA NIM embeddings + cosine ranking). ④  `/api/chat/stream` is called; if tool use is enabled, an agentic loop lets a dedicated 8B model invoke `python_execute` or web search, feeding results back until the task is complete. ⑤  The final answer streams as SSE frames (`data: {"delta":"…"}`), appended live in the UI, and state is persisted to `localStorage` on completion.
  ]
]

// ════════════════════════════════════════════════════════════════════════════
//  SECTION 3  —  Related Links
// ════════════════════════════════════════════════════════════════════════════
= Related Links

#table(
  columns: (2.8cm, 1fr),
  stroke: 0.4pt + luma(190),
  inset: 8pt,
  fill: (_, row) => if calc.odd(row) { luma(248) } else { white },
  table.header(text(weight: "bold", size: 9.5pt)[Resource], text(weight: "bold", size: 9.5pt)[URL]),
  [GitHub Repository], link("https://github.com/Sytwu/Custom-ChatGPT")[https://github.com/Sytwu/Custom-ChatGPT],
  [Live Demo], link("https://custom-chat-gpt-psi.vercel.app/"),
)
