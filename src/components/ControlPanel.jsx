import React, { useState } from "react";
import { EmojiPicker } from "./EmojiPicker";

export function ControlPanel({ state, fontOptions, onFieldChange }) {
  const [lastCopied, setLastCopied] = useState("Nothing copied yet");

  return (
    <aside className="panel controls-panel">
      <section className="control-group">
        <h2 className="section-title">Glyph</h2>
        <label className="field field-text">
          <span className="field-label">
            Content (🔗
            <a
              target="_blank"
              href="https://emojipedia.org/"
              title="Emojipedia is a comprehensive resource for emoji characters, providing detailed information about their meanings, usage, and variations."
            >
              Emojipedia
            </a>{" "}
            ,{" "}
            <a
              target="_blank"
              href="https://graphemica.com/"
              title="Graphemica is a comprehensive resource for Unicode characters, providing detailed information about their meanings, usage, and variations."
            >
              Graphemica
            </a>
            )
          </span>
          <div className="field-input field-input-emoji-picker">
            <input
              type="text"
              value={state.content}
              placeholder="Enter a letter or symbol"
              onChange={onFieldChange("content")}
            />
            <EmojiPicker
              config={{
                maxResults: 96,
                displayMode: "emoji-only",
                triggerLabel: "🔎",
                modalTitle: "Emoji picker",
                placeholder: "Search: e.g smile, sad, heart",
              }}
              onCopy={({ copiedText, name }) =>
                setLastCopied(`Copied ${copiedText} (${name})`)
              }
              onSelect={(item) => {
                // Insert the picked emoji into the glyph input by calling
                // the parent's onFieldChange handler for `content`.
                const setContent = onFieldChange("content");
                setContent({ target: { value: item.emoji, type: "text" } });
                setLastCopied(`Copied ${item.emoji} (${item.name})`);
              }}
            />
          </div>
        </label>

        <label className="field field-range">
          <div className="field-head">
            <span className="field-label">Font size</span>
            <span className="field-value">{state.fontSize}</span>
          </div>
          <input
            type="range"
            min="72"
            max="200"
            step="1"
            value={state.fontSize}
            onChange={onFieldChange("fontSize")}
          />
        </label>

        <label className="field field-range">
          <div className="field-head">
            <span className="field-label">X</span>
            <span className="field-value">{state.x}</span>
          </div>
          <input
            type="range"
            min="0"
            max="128"
            step="1"
            value={state.x}
            onChange={onFieldChange("x")}
          />
        </label>

        <label className="field field-range">
          <div className="field-head">
            <span className="field-label">Y</span>
            <span className="field-value">{state.y}</span>
          </div>
          <input
            type="range"
            min="0"
            max="128"
            step="1"
            value={state.y}
            onChange={onFieldChange("y")}
          />
        </label>
      </section>

      <section className="control-group">
        <h2 className="section-title">Typography</h2>
        <label className="field field-inline">
          <span className="field-label">Font family</span>
          <select
            value={state.fontFamily}
            onChange={onFieldChange("fontFamily")}
          >
            {fontOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field-inline">
          <span className="field-label">Bold</span>
          <input
            type="checkbox"
            checked={state.bold}
            onChange={onFieldChange("bold")}
          />
        </label>

        <label className="field field-inline">
          <span className="field-label">Fill</span>
          <input
            type="color"
            value={state.fill}
            onChange={onFieldChange("fill")}
          />
        </label>
      </section>

      <section className="control-group">
        <h2 className="section-title">Backdrop</h2>
        <label className="field field-inline">
          <span className="field-label">Use background</span>
          <input
            type="checkbox"
            checked={state.useBackground}
            onChange={onFieldChange("useBackground")}
          />
        </label>

        <label className="field field-inline">
          <span className="field-label">Background shape</span>
          <select
            value={state.backgroundShape}
            onChange={onFieldChange("backgroundShape")}
            disabled={!state.useBackground}
          >
            <option value="rect">Rectangle</option>
            <option value="circle">Circle</option>
          </select>
        </label>

        <label className="field field-inline">
          <span className="field-label">Background color</span>
          <input
            type="color"
            value={state.background}
            onChange={onFieldChange("background")}
            disabled={!state.useBackground}
          />
        </label>
      </section>

      {/* toggle whether PWA, as these use additional files */}
      <section className="control-group">
        <h2 className="section-title">Other</h2>
        <label className="field field-inline">
          <span className="field-label">Include PWA assets</span>
          <input
            type="checkbox"
            checked={state.includePwa}
            onChange={onFieldChange("includePwa")}
          />
        </label>
      </section>
    </aside>
  );
}
