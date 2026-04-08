import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./EmojiPicker.module.css";
import emojiData from "unicode-emoji-json";
import orderedEmoji from "unicode-emoji-json/data-ordered-emoji.json";
import emojiKeywords from "emojilib";

const DEFAULT_CONFIG = {
  maxResults: 120,
  displayMode: "emoji-only",
  closeOnSelect: true,
  copyFormat: "emoji",
  initialQuery: "",
  placeholder: "Search emoji",
  modalTitle: "Pick an emoji",
  triggerLabel: "Emoji",
  emptyMessage: "No emoji found",
  recentLimit: 18,
};

const GROUP_SYNONYMS = {
  "Smileys & Emotion": [
    "smile",
    "smiley",
    "emotion",
    "face",
    "mood",
    "feeling",
    "happy",
    "sad",
  ],
  "People & Body": ["people", "person", "body", "hand", "gesture"],
  "Animals & Nature": [
    "animal",
    "nature",
    "plant",
    "tree",
    "flower",
    "weather",
  ],
  "Food & Drink": ["food", "drink", "fruit", "meal", "beverage"],
  Travel: ["travel", "transport", "vehicle", "car", "map", "place"],
  Activities: ["activity", "sport", "game", "hobby"],
  Objects: ["object", "tool", "item", "thing"],
  Symbols: ["symbol", "sign", "arrow", "mark"],
  Flags: ["flag", "country", "nation"],
};

const EMOJI_DATA = emojiData;
const EMOJI_KEYWORDS = emojiKeywords;
const EMOJI_ORDER = orderedEmoji;

function normaliseText(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s:+]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTerms(input) {
  return normaliseText(input)
    .split(" ")
    .map((term) => term.trim())
    .filter(Boolean);
}

function unicodeCodepoints(emoji) {
  return Array.from(emoji)
    .map((char) =>
      char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0"),
    )
    .filter(Boolean)
    .join(" ");
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildIndex() {
  const seen = new Set();
  const ordered = EMOJI_ORDER.filter((value) => {
    if (!EMOJI_DATA[value] || seen.has(value)) return false;
    seen.add(value);
    return true;
  });

  for (const emoji of Object.keys(EMOJI_DATA)) {
    if (!seen.has(emoji)) {
      ordered.push(emoji);
      seen.add(emoji);
    }
  }

  return ordered.map((emoji) => {
    const meta = EMOJI_DATA[emoji];
    const keywordList = EMOJI_KEYWORDS[emoji] ?? [];
    const aliasFromSlug = meta.slug.split("_");
    const aliasFromName = meta.name.split(" ");
    const groupHints = GROUP_SYNONYMS[meta.group] ?? [];
    const aliases = uniqueStrings([
      ...aliasFromSlug,
      ...aliasFromName,
      ...groupHints,
    ]);
    const keywords = uniqueStrings(keywordList);
    const searchText = normaliseText(
      [
        emoji,
        meta.name,
        meta.slug,
        meta.group,
        ...aliases,
        ...keywords,
        unicodeCodepoints(emoji),
      ].join(" "),
    );

    return {
      emoji,
      ...meta,
      aliases,
      keywords,
      searchText,
    };
  });
}

const EMOJI_INDEX = buildIndex();

function scoreEmoji(item, rawQuery) {
  const query = normaliseText(rawQuery);
  if (!query) return 1;

  const terms = splitTerms(query);
  if (terms.length === 0) return 1;

  const name = normaliseText(item.name);
  const slug = normaliseText(item.slug);
  const group = normaliseText(item.group);
  const keywords = item.keywords.map(normaliseText);
  const aliases = item.aliases.map(normaliseText);
  const haystack = item.searchText;

  let score = 0;

  if (item.emoji === rawQuery.trim()) score += 2000;
  if (name === query) score += 1500;
  if (slug === query) score += 1300;
  if (name.startsWith(query)) score += 900;
  if (slug.startsWith(query)) score += 800;
  if (group.includes(query)) score += 150;
  if (keywords.includes(query)) score += 850;
  if (aliases.includes(query)) score += 550;
  if (haystack.includes(query)) score += 120;

  for (const term of terms) {
    if (name === term) score += 500;
    if (slug === term) score += 420;
    if (name.startsWith(term)) score += 260;
    if (slug.startsWith(term)) score += 240;
    if (keywords.some((value) => value === term)) score += 280;
    if (aliases.some((value) => value === term)) score += 180;
    if (keywords.some((value) => value.startsWith(term))) score += 150;
    if (aliases.some((value) => value.startsWith(term))) score += 120;
    if (haystack.includes(term)) score += 40;
  }

  const allTermsPresent = terms.every((term) => haystack.includes(term));
  if (!allTermsPresent) return 0;

  score += Math.max(0, 40 - item.name.length);
  return score;
}

function useEmojiSearch(query, maxResults, recent) {
  return useMemo(() => {
    if (!query.trim()) {
      if (recent.length > 0) {
        const recentSet = new Set(recent);
        const prioritised = EMOJI_INDEX.filter((item) =>
          recentSet.has(item.emoji),
        );
        const rest = EMOJI_INDEX.filter((item) => !recentSet.has(item.emoji));
        return [...prioritised, ...rest].slice(0, maxResults);
      }
      return EMOJI_INDEX.slice(0, maxResults);
    }

    return EMOJI_INDEX.map((item) => ({ item, score: scoreEmoji(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name),
      )
      .slice(0, maxResults)
      .map((entry) => entry.item);
  }, [maxResults, query, recent]);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((value) => typeof value === "string")
        : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

export function EmojiPicker({ config, onCopy, onSelect, className }) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(mergedConfig.initialQuery);
  const [copiedEmoji, setCopiedEmoji] = useState(null);
  const [recent, setRecent] = useLocalStorageState(
    "minimal-emoji-picker-recents",
    [],
  );
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const titleId = useId();
  const results = useEmojiSearch(query, mergedConfig.maxResults, recent);

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function onMouseDown(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleSelect(item) {
    const copiedText =
      mergedConfig.copyFormat === "emoji-and-name"
        ? `${item.emoji} ${item.name}`
        : item.emoji;
    await copyText(copiedText);
    setCopiedEmoji(item.emoji);
    onSelect?.(item);
    onCopy?.({ emoji: item.emoji, name: item.name, copiedText });
    setRecent((current) =>
      [item.emoji, ...current.filter((value) => value !== item.emoji)].slice(
        0,
        mergedConfig.recentLimit,
      ),
    );
    window.setTimeout(
      () => setCopiedEmoji((value) => (value === item.emoji ? null : value)),
      1000,
    );

    if (mergedConfig.closeOnSelect) {
      setIsOpen(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        className={styles.epTrigger}
        onClick={() => setIsOpen(true)}
      >
        {/* <span aria-hidden="true"></span> */}
        <span>{mergedConfig.triggerLabel}</span>
      </button>

      {isOpen ? (
        <div className={styles.epOverlay} role="presentation">
          <div
            ref={modalRef}
            className={styles.epModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className={styles.epHeader}>
              <div>
                <h2 id={titleId} className={styles.epTitle}>
                  {mergedConfig.modalTitle}
                </h2>
                <p className={styles.epSubtitle}>
                  {query.trim()
                    ? `${results.length} result${results.length === 1 ? "" : "s"}`
                    : recent.length > 0
                      ? "Recent and common emoji"
                      : "Common emoji"}
                </p>
              </div>
              <button
                type="button"
                className={styles.epClose}
                aria-label="Close emoji picker"
                onClick={() => setIsOpen(false)}
              >
                ❌
              </button>
            </div>

            <div className={styles.epSearchWrap}>
              <input
                ref={inputRef}
                className={styles.epSearch}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={mergedConfig.placeholder}
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  className={styles.epClear}
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  Clear
                </button>
              ) : null}
            </div>

            {results.length > 0 ? (
              <div
                className={
                  mergedConfig.displayMode === "emoji-only"
                    ? styles.epGrid
                    : styles.epList
                }
              >
                {results.map((item) => {
                  const isCopied = copiedEmoji === item.emoji;
                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      className={
                        mergedConfig.displayMode === "emoji-only"
                          ? `${styles.epItem} ${styles.epItemGrid}`
                          : `${styles.epItem} ${styles.epItemList}`
                      }
                      onClick={() => void handleSelect(item)}
                      title={item.name}
                      aria-label={`Copy ${item.name}`}
                    >
                      <span className={styles.epEmoji} aria-hidden="true">
                        {item.emoji}
                      </span>
                      {mergedConfig.displayMode !== "emoji-only" ? (
                        <span className={styles.epMeta}>
                          <span className={styles.epName}>{item.name}</span>
                          {mergedConfig.displayMode === "emoji-name-unicode" ? (
                            <span className={styles.epCode}>
                              {unicodeCodepoints(item.emoji)}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                      {isCopied ? (
                        <span className={styles.epCopied}>Copied</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.epEmpty}>{mergedConfig.emptyMessage}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
