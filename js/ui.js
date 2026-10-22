/**
 * IziBook — UI: настройки, шторки, TOC, применение state → DOM.
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  IB.setStatus = function (msg, isError) {
    const statusEl = IB.$('status');
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('error', !!isError);
  };

  IB.applyFont = function () {
    const wordEl = IB.$('word');
    const fontSeg = IB.$('fontSeg');
    wordEl.classList.toggle('serif', IB.state.font === 'serif');
    [...fontSeg.querySelectorAll('button')].forEach((b) => {
      b.classList.toggle('active', b.dataset.font === IB.state.font);
    });
  };

  IB.applyMetaTheme = function () {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = IB.state.dark ? '#0f1712' : '#f2f5ef';
  };

  IB.updateSeg = function () {
    const chunkSeg = IB.$('chunkSeg');
    [...chunkSeg.querySelectorAll('button')].forEach((b) => {
      const active =
        b.dataset.mode === IB.state.mode &&
        (b.dataset.mode !== 'words' || parseInt(b.dataset.words, 10) === IB.state.wordCount);
      b.classList.toggle('active', active);
    });
  };

  IB.applySettingsToUI = function () {
    const s = IB.state;
    IB.$('speed').value = s.wpm;
    IB.$('speedVal').textContent = s.wpm;
    IB.$('wpmVal').textContent = s.wpm;
    IB.$('fontSize').value = s.fontSize;
    IB.$('fontVal').textContent = s.fontSize;
    IB.$('word').style.fontSize = s.fontSize + 'px';
    IB.$('focusLine').style.fontSize = s.fontSize + 'px';
    IB.$('pauseToggle').checked = s.pauses;
    IB.$('themeToggle').checked = s.dark;
    document.body.classList.toggle('light', !s.dark);
    IB.applyFont();
    IB.applyHighlight();
    IB.applyMetaTheme();
    IB.updateSeg();
  };

  IB.openDrawer = function (d) {
    if (d === 'settings') {
      IB.$('settingsDrawer').classList.add('open');
    }
    if (d === 'toc') {
      IB.$('tocDrawer').classList.add('open');
      IB.renderToc();
    }
    IB.$('backdrop').classList.add('show');
  };

  IB.closeDrawers = function () {
    IB.$('settingsDrawer').classList.remove('open');
    IB.$('tocDrawer').classList.remove('open');
    IB.$('backdrop').classList.remove('show');
  };

  IB.renderToc = function () {
    const tocList = IB.$('tocList');
    const rt = IB.runtime;
    tocList.innerHTML = '';
    if (!rt.chapters.length) {
      tocList.innerHTML = '<div class="toc-empty">Главы не найдены</div>';
      return;
    }
    rt.chapters.forEach((ch) => {
      const el = document.createElement('button');
      el.className = 'toc-item';
      const pct = rt.chunks.length ? Math.round((ch.chunk / rt.chunks.length) * 100) : 0;
      el.innerHTML = `<span>${IB.escapeHtml(ch.title)}</span><span class="toc-pct">${pct}%</span>`;
      el.addEventListener('click', () => {
        IB.stop();
        rt.chunkIndex = ch.chunk;
        IB.render();
        IB.savePos();
        IB.closeDrawers();
      });
      tocList.appendChild(el);
    });
  };

  /**
   * Старт сессии чтения: парсинг → чанки → восстановление позиции → экран reader.
   */
  IB.startReading = function (text, name) {
    const rt = IB.runtime;
    rt.paragraphs = IB.parseText(text);
    if (!rt.paragraphs.length || !rt.paragraphs.some((p) => p.sentences.some((s) => s.length))) {
      IB.setStatus('Не удалось найти слова в тексте', true);
      return;
    }
    rt.bookName = name || 'Вставленный текст';
    IB.$('title').textContent = rt.bookName;
    // Формула hash как в v3.1 — чтобы не сбросить прогресс у существующих пользователей.
    rt.bookHash = IB.hashStr(text.slice(0, 5000) + text.length);
    IB.setStatus('');
    IB.loadSettings();
    IB.applySettingsToUI();
    IB.rebuildChunks();
    IB.render();
    const saved = IB.loadPos();
    if (saved && saved.total === rt.totalWords && saved.idx >= 0 && saved.idx < rt.chunks.length) {
      rt.chunkIndex = saved.idx;
    } else {
      rt.chunkIndex = 0;
    }
    IB.$('loader').style.display = 'none';
    IB.$('reader').classList.add('active');
    IB.render();
  };
})(window.IziBook);
