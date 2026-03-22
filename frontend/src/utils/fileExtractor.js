import * as pdfjsLib from "pdfjs-dist";

// Point the worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const MAX_CHARS = 50_000;

export async function extractFromFile(file) {
  try {
    if (file.type === "application/pdf") {
      return await extractPDF(file);
    }
    return await extractText(file);
  } catch (e) {
    return { name: file.name, text: null, error: e.message };
  }
}

async function extractPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => item.str.trim())
      .filter(Boolean)
      .join(" ");
    if (pageText) text += pageText + "\n\n";
  }
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }
  return { name: file.name, text, truncated };
}

async function extractText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result;
      let truncated = false;
      if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
        truncated = true;
      }
      resolve({ name: file.name, text, truncated });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
