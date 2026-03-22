import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

const rehypePlugins = [rehypeHighlight];

const components = {
  pre({ children, ...props }) {
    const codeEl = React.Children.toArray(children).find(
      (c) => c?.type === "code"
    );
    const code = codeEl
      ? String(codeEl.props?.children ?? "").replace(/\n$/, "")
      : "";
    return (
      <div className="code-block-wrapper">
        <CopyButton code={code} />
        <pre {...props}>{children}</pre>
      </div>
    );
  },
};

export function MarkdownContent({ content }) {
  const normalized = content.replace(/\n{3,}/g, "\n\n");
  return (
    <div className="markdown-body">
      <ReactMarkdown rehypePlugins={rehypePlugins} components={components}>
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
