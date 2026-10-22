/**
 * IziBook — сохранение настроек и позиции чтения.
 *
 * Позиция ключуется hash(первые 5KB текста + длина). Возможны редкие коллизии
 * у разных книг с похожим началом — тогда прогресс может «перепутаться».
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  IB.saveSettings = function () {
    const s = IB.state;
    const payload = {
      wpm: s.wpm,
      mode: s.mode,
      wordCount: s.wordCount,
      fontSize: s.fontSize,
      pauses: s.pauses,
      dark: s.dark,
      font: s.font,
      highlight: s.highlight
    };
    try {
      localStorage.setItem(IB.LS_SETTINGS, JSON.stringify(payload));
    } catch (e) {
      /* quota / private mode */
    }
  };

  IB.loadSettings = function () {
    try {
      const s = JSON.parse(localStorage.getItem(IB.LS_SETTINGS) || 'null');
      if (s && typeof s === 'object') Object.assign(IB.state, s);
    } catch (e) {
      /* ignore corrupt */
    }
  };

  IB.savePos = function () {
    const rt = IB.runtime;
    if (!rt.bookHash) return;
    try {
      localStorage.setItem(
        IB.LS_POS + rt.bookHash,
        JSON.stringify({ idx: rt.chunkIndex, total: rt.totalWords })
      );
    } catch (e) {
      /* ignore */
    }
  };

  IB.loadPos = function () {
    try {
      return JSON.parse(localStorage.getItem(IB.LS_POS + IB.runtime.bookHash) || 'null');
    } catch (e) {
      return null;
    }
  };

  IB.clearPos = function () {
    const rt = IB.runtime;
    if (rt.bookHash) {
      try {
        localStorage.removeItem(IB.LS_POS + rt.bookHash);
      } catch (e) {
        /* ignore */
      }
    }
    rt.chunkIndex = 0;
    if (typeof IB.render === 'function') IB.render();
    IB.savePos();
  };
})(window.IziBook);
