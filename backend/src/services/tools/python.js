import { spawn } from "child_process";

const MAX_TIMEOUT_MS = 10_000;
const MAX_BUFFER = 1024 * 1024; // 1MB

export function executePython(code) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const done = () => {
      if (settled) return;
      settled = true;
      resolve({
        stdout: stdout.slice(0, MAX_BUFFER),
        stderr: stderr.slice(0, MAX_BUFFER),
        timedOut,
      });
    };

    let proc;
    try {
      proc = spawn("python3", ["-c", code]);
    } catch {
      resolve({ stdout: "", stderr: "[Python Error: python3 not found]", timedOut: false });
      return;
    }

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
    }, MAX_TIMEOUT_MS);

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("error", (err) => {
      clearTimeout(timer);
      if (err.code === "ENOENT") {
        stderr = "[Python Error: python3 not found]";
      } else {
        stderr = `[Python Error: ${err.message}]`;
      }
      done();
    });

    proc.on("close", () => {
      clearTimeout(timer);
      done();
    });
  });
}
