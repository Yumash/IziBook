/**
 * IziBook — построение RSVP-кадров (chunks) из paragraphs по текущему mode.
 *
 * Режимы:
 *   words    — фиксированное N слов
 *   auto     — «умный» шаг по длине и знакам
 *   sentence — целое предложение (длинные режутся)
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  function smartStep(wordsArr, i) {
    const MAX = 7;
    const MAXCHARS = 24;
    let step = 1;
    let chars = IB.letters(wordsArr[i]);
    for (let j = i + 1; j < wordsArr.length && j - i < MAX; j++) {
      const add = IB.letters(wordsArr[j]);
      if (chars + add > MAXCHARS) break;
      chars += add;
      step = j - i + 1;
      if (/[.!?…,;:—]$/.test(wordsArr[j])) break;
    }
    return step;
  }

  function splitLongSentence(wordsArr) {
    const MAX = 16;
    if (wordsArr.length <= MAX) return [wordsArr];
    const out = [];
    let cur = [];
    for (const w of wordsArr) {
      cur.push(w);
      if (cur.length >= MAX && /[,;:—]$/.test(w)) {
        out.push(cur);
        cur = [];
      } else if (cur.length >= MAX + 8) {
        out.push(cur);
        cur = [];
      }
    }
    if (cur.length) out.push(cur);
    return out;
  }

  function chunkWords(wordsArr) {
    const out = [];
    let i = 0;
    while (i < wordsArr.length) {
      const step = IB.state.mode === 'auto' ? smartStep(wordsArr, i) : IB.state.wordCount;
      out.push(wordsArr.slice(i, i + step));
      i += step;
    }
    return out;
  }

  /**
   * Пересобирает chunks/chapters. Старается сохранить позицию по номеру слова.
   * После вызова нужно обновить UI (IB.render).
   */
  IB.rebuildChunks = function () {
    const rt = IB.runtime;
    const oldWord = rt.chunks[rt.chunkIndex] ? rt.chunks[rt.chunkIndex].start : 0;
    rt.chunks = [];
    rt.chapters = [];
    let wordCursor = 0;

    rt.paragraphs.forEach((p, pi) => {
      if (IB.isChapterHeading(p.text)) {
        rt.chapters.push({ title: p.text.slice(0, 80), chunk: rt.chunks.length });
      }
      const paraStart = rt.chunks.length;
      p.sentences.forEach((wordsArr) => {
        const groups = IB.state.mode === 'sentence' ? splitLongSentence(wordsArr) : chunkWords(wordsArr);
        groups.forEach((grp, gi) => {
          const text = grp.join(' ');
          const last = gi === groups.length - 1;
          rt.chunks.push({
            text,
            count: grp.length,
            start: wordCursor,
            sentenceEnd: last,
            paraStart: false,
            paraEnd: false,
            para: pi
          });
          wordCursor += grp.length;
        });
      });
      if (rt.chunks.length > paraStart) {
        rt.chunks[paraStart].paraStart = true;
        rt.chunks[rt.chunks.length - 1].paraEnd = true;
        rt.chunks[rt.chunks.length - 1].sentenceEnd = true;
      }
    });

    rt.totalWords = wordCursor;
    const pos = Math.min(oldWord, Math.max(0, rt.totalWords - 1));
    rt.chunkIndex = rt.chunks.findIndex((c) => c.start <= pos && c.start + c.count > pos);
    if (rt.chunkIndex < 0) rt.chunkIndex = Math.max(0, rt.chunks.length - 1);
  };
})(window.IziBook);
