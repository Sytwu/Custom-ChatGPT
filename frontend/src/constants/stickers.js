/**
 * Sticker packs configuration.
 * Files live in frontend/public/stickers/<folder>/<file>
 * and are served as static assets at /stickers/<folder>/<file>.
 *
 * HOW TO ADD DESCRIPTIONS:
 *   Edit stickers.json — find the pack by "folder" and update the
 *   "descriptions" object. Keys are sticker numbers (as strings),
 *   values are short expressive captions, e.g.:
 *   "1": "waving cheerfully, happy greeting"
 *   "2": "crying dramatically, overwhelmed"
 */

import packsData from "./stickers.json";

function makePack({ id, label, folder, count, descriptions = {} }) {
  const stickers = [];
  for (let i = 1; i <= count; i++) {
    const file = String(i).padStart(2, "0") + ".png";
    stickers.push({
      file,
      description: descriptions[String(i)] ?? `${label} sticker ${i}`,
    });
  }
  return { id, label, folder, stickers };
}

export const STICKER_PACKS = packsData.map(makePack);

/** Returns the public URL for a sticker given its pack folder and filename */
export function stickerUrl(folder, file) {
  return `/stickers/${folder}/${file}`;
}
