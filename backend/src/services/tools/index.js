import { searchWeb } from "./search.js";
import { executePython } from "./python.js";

export const TOOLS_DEFINITION = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information. Use when the user asks about real-time data, news, prices, or anything requiring up-to-date information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "python_execute",
      description:
        "Execute Python 3 code and return stdout/stderr. Use for calculations, data processing, or tasks that benefit from running code.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Python 3 code to execute" },
        },
        required: ["code"],
      },
    },
  },
];

export async function executeTool(name, input) {
  if (name === "web_search") {
    return await searchWeb(input.query ?? "");
  }
  if (name === "python_execute") {
    const result = await executePython(input.code ?? "");
    if (result.timedOut) return "[Python Error: execution timed out after 10 seconds]";
    let output = "";
    if (result.stdout) output += `stdout:\n${result.stdout}`;
    if (result.stderr) output += `${output ? "\n" : ""}stderr:\n${result.stderr}`;
    return output.trim() || "(no output)";
  }
  return `[Tool Error: unknown tool "${name}"]`;
}
