// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error("[Error]", err.message);

  // If SSE headers already sent, close the stream with an error event
  if (res.headersSent) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  res.status(err.status ?? 500).json({ error: err.message ?? "Internal server error" });
}
