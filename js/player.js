/**
 * IziBook — RSVP-плеер: рендер кадра, таймер, навигация по чанкам/абзацам.
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  function showLetter() {
    return IB.state.highlight === 'all' || IB.state.highlight === 'letter';
  }

  function showLine() {
    return IB.state.highlight === 'all' || IB.state.highlight === 'line';
  }

  IB.applyHighlight = function () {
    const seg = IB.$('highlightSeg');
    if (seg) {
      [...seg.querySelectorAll('button')].forEach((b) => {
        b.classList.toggle('active', b.dataset.hl === IB.state.highlight);
      });
    }
    const focusLine = IB.$('focusLine');
    if (focusLine) focusLine.style.display = showLine() ? '' : 'none';
  };

  function setChunkHtml(text, hiCharIdx) {
    const wordEl = IB.$('word');
    wordEl.replaceChildren();
    if (showLetter()) {
      const chars = Array.from(text);
      const c = chars[hiCharIdx];
      if (c !== undefined) {
        wordEl.append(document.createTextNode(chars.slice(0, hiCharIdx).join('')));
        const s = document.createElement('span');
        s.className = 'orp';
        s.textContent = c;
        wordEl.append(s);
        wordEl.append(document.createTextNode(chars.slice(hiCharIdx + 1).join('')));
        return;
      }
    }
    wordEl.textContent = text;
  }

  IB.updatePlayBtn = function () {
    const playBtn = IB.$('playBtn');
    const playing = IB.runtime.playing;
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.title = playing ? 'Пауза (Пробел)' : 'Старт (Пробел)';
  };

  IB.render = function () {
    const rt = IB.runtime;
    const wordEl = IB.$('word');
    const progressFill = IB.$('progressFill');
    const wordCounter = IB.$('wordCounter');
    const c = rt.chunks[rt.chunkIndex];

    if (!c) {
      wordEl.textContent = '✓ Конец';
      progressFill.style.width = '100%';
      wordCounter.textContent = `${rt.totalWords} / ${rt.totalWords}`;
      IB.stop();
      return;
    }

    setChunkHtml(c.text, IB.centerCharIndex(c.text));

    const done = c.start + c.count;
    const pct = rt.totalWords ? Math.round((done / rt.totalWords) * 100) : 0;
    const etaMin = IB.state.wpm ? (rt.totalWords - done) / IB.state.wpm : 0;
    wordCounter.textContent =
      `${done} / ${rt.totalWords} · ${pct}%` + (etaMin > 0 ? ` · ~${Math.ceil(etaMin)} мин` : '');

    progressFill.style.width = (rt.totalWords ? (done / rt.totalWords) * 100 : 0) + '%';
  };

  function schedule() {
    const rt = IB.runtime;
    clearTimeout(rt.timer);
    if (!rt.playing) return;
    const c = rt.chunks[rt.chunkIndex];
    if (!c) {
      IB.stop();
      return;
    }
    let delay = (c.count / IB.state.wpm) * 60000;
    if (IB.state.pauses) {
      if (c.sentenceEnd) delay *= 1.7;
      else if (/[,;:—]["'»\)\]]?$/.test(c.text)) delay *= 1.3;
    }
    rt.timer = setTimeout(() => {
      rt.chunkIndex++;
      if (rt.chunkIndex >= rt.chunks.length) {
        IB.stop();
        IB.render();
        return;
      }
      IB.render();
      IB.savePos();
      schedule();
    }, delay);
  }

  IB.play = function () {
    const rt = IB.runtime;
    if (!rt.chunks.length) return;
    if (rt.chunkIndex >= rt.chunks.length) rt.chunkIndex = 0;
    rt.playing = true;
    IB.updatePlayBtn();
    schedule();
  };

  IB.stop = function () {
    const rt = IB.runtime;
    rt.playing = false;
    clearTimeout(rt.timer);
    IB.updatePlayBtn();
  };

  IB.goChunk = function (delta) {
    const rt = IB.runtime;
    IB.stop();
    rt.chunkIndex = Math.max(0, Math.min(rt.chunks.length - 1, rt.chunkIndex + delta));
    IB.render();
    IB.savePos();
  };

  IB.goParagraph = function (delta) {
    const rt = IB.runtime;
    IB.stop();
    const cur = rt.chunks[rt.chunkIndex] ? rt.chunks[rt.chunkIndex].para : 0;
    let i = rt.chunkIndex;
    let found = -1;
    while (i >= 0 && i < rt.chunks.length) {
      i += delta;
      if (i < 0 || i >= rt.chunks.length) break;
      if (delta < 0 ? rt.chunks[i].paraStart : rt.chunks[i].para > cur) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      rt.chunkIndex = found;
      IB.render();
      IB.savePos();
    }
  };

  IB.setWpm = function (v) {
    IB.state.wpm = Math.max(100, Math.min(1000, Math.round(v / 10) * 10));
    const speedSlider = IB.$('speed');
    const speedVal = IB.$('speedVal');
    const wpmVal = IB.$('wpmVal');
    if (speedSlider) speedSlider.value = IB.state.wpm;
    if (speedVal) speedVal.textContent = IB.state.wpm;
    if (wpmVal) wpmVal.textContent = IB.state.wpm;
    if (IB.runtime.playing) schedule();
    IB.saveSettings();
  };

})(window.IziBook);
