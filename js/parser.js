/**
 * IziBook — разбор сырого текста в структуру абзац → предложения → слова.
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  function splitSentences(paragraph) {
    const parts = paragraph.match(/[^.!?…]+[.!?…]+["'»)\]]*|[^.!?…]+$/g) || [paragraph];
    return parts.map((x) => x.trim()).filter(Boolean);
  }

  /**
   * Нормализует переносы и строит дерево абзацев.
   * Пустая строка / отступ в начале строки → граница абзаца.
   */
  IB.parseText = function (text) {
    let t = text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
    t = t.replace(/\n[ \t]{2,}/g, '\n\n');
    t = t.replace(/\n{2,}/g, '\u0000');
    t = t.replace(/\n/g, ' ');
    t = t.replace(/\u0000/g, '\n\n');
    return t
      .split(/\n\s*\n/)
      .map((p) => p.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .map((p) => ({
        text: p,
        sentences: splitSentences(p).map((s) => s.split(' ').filter(Boolean))
      }));
  };

  /**
   * Эвристика заголовка главы для оглавления (RU/EN).
   * Не используем \b: в JS граница слова не учитывает кириллицу,
   * поэтому «Глава 1» раньше никогда не попадала в TOC.
   */
  IB.isChapterHeading = function (t) {
    return (
      /^(глава|часть|книга|раздел|том|пролог|эпилог|введение|заключение|chapter|part|prologue|epilogue)(?:\s|$|[.:—-])/i.test(
        t
      ) || /^\d{1,3}[.)]?$/.test(t)
    );
  };
})(window.IziBook);
