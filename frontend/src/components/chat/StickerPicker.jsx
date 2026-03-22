import React, { useState } from "react";
import { STICKER_PACKS, stickerUrl } from "../../constants/stickers.js";

export function StickerPicker({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const pack = STICKER_PACKS[activeTab];

  return (
    <div className="sticker-picker">
      {/* Tab bar */}
      <div className="sticker-tabs">
        {STICKER_PACKS.map((p, i) => (
          <button
            key={p.id}
            className={`sticker-tab-btn${activeTab === i ? " active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sticker grid + attribution, scrollable */}
      <div className="sticker-content">
        <div className="sticker-grid">
          {pack.stickers.map((s) => {
            const url = stickerUrl(pack.folder, s.file);
            return (
              <button
                key={s.file}
                className="sticker-item"
                title={s.description}
                onClick={() => {
                  onSelect({ url, description: s.description });
                  onClose();
                }}
              >
                <img src={url} alt={s.description} className="sticker-thumb" />
              </button>
            );
          })}
        </div>
        <div className="sticker-attribution">
          <a
            href="https://circlecan.blogspot.com/p/blue-archive-cat-png.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            趙元館 (circlecan | shin5575)
          </a>
        </div>
      </div>
    </div>
  );
}
