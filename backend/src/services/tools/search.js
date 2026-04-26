import config from "../../config.js";

export async function searchWeb(query) {
  const apiKey = config.tavilyApiKey;
  if (!apiKey) return "[Search Error: TAVILY_API_KEY not configured]";

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
    });
    if (!res.ok) return `[Search Error: HTTP ${res.status}]`;
    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return "[Search: No results found]";
    return results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${(r.content ?? "").slice(0, 300)}`)
      .join("\n\n");
  } catch (err) {
    return `[Search Error: ${err.message}]`;
  }
}
