/**
 * IziBook — чистые утилиты без DOM-зависимостей (кроме $).
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  IB.$ = function (id) {
    return document.getElementById(id);
  };

  IB.escapeHtml = function (s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  /** djb2 → base36; достаточно для ключа позиции, не криптостойкий. */
  IB.hashStr = function (s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  };

  /** Число букв/цифр в слове (без пунктуации) — для «умного» шага. */
  IB.letters = function (w) {
    return w.replace(/[^\p{L}\p{N}]/gu, '').length;
  };

  /**
   * Индекс символа ORP (optimal recognition point) ближе к центру строки.
   * Пробелы пропускаем — подсветка только на «видимой» букве.
   */
  IB.centerCharIndex = function (text) {
    const chars = Array.from(text);
    const n = chars.length;
    if (!n) return 0;
    const center = n / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (/\s/.test(chars[i])) continue;
      const dist = Math.abs(i + 0.5 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  /** Эвристика «насколько текст похож на русскую кириллицу» для выбора кодировки. */
  IB.scoreCyrillic = function (s) {
    let good = 0;
    let bad = 0;
    for (const ch of s) {
      const c = ch.codePointAt(0);
      const ru = (c >= 0x0410 && c <= 0x044f) || c === 0x0401 || c === 0x0451;
      if (ru) good++;
      else if ((c >= 0x0400 && c <= 0x04ff) || /[\p{S}\p{C}]/u.test(ch)) bad++;
    }
    return good - bad * 3;
  };
})(window.IziBook);
