/**
 * IziBook — точка входа: связывание DOM-событий с модулями.
 * Порядок скриптов в index.html важен (см. ARCHITECTURE.md).
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  function bindEvents() {
    const fileInput = IB.$('fileInput');
    const pasteArea = IB.$('pasteArea');
    const startBtn = IB.$('startBtn');
    const playBtn = IB.$('playBtn');
    const stage = IB.$('stage');
    const wordEl = IB.$('word');
    const reader = IB.$('reader');

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      IB.setStatus('Обработка файла...');
      try {
        let text;
        if (file.name.toLowerCase().endsWith('.epub') || file.type === 'application/epub+zip') {
          text = await IB.extractEpubText(file);
        } else {
          text = await IB.readTextFile(file);
        }
        IB.startReading(text, file.name.replace(/\.(txt|epub)$/i, ''));
      } catch (err) {
        console.error(err);
        IB.setStatus('Ошибка: ' + err.message, true);
      }
      fileInput.value = '';
    });

    startBtn.addEventListener('click', () => {
      const text = pasteArea.value.trim();
      if (!text) {
        IB.setStatus('Вставьте текст или выберите файл!', true);
        return;
      }
      IB.startReading(text);
    });

    IB.$('backBtn').addEventListener('click', () => {
      IB.stop();
      IB.closeDrawers();
      reader.classList.remove('active');
      IB.$('loader').style.display = 'flex';
    });

    playBtn.addEventListener('click', () => (IB.runtime.playing ? IB.stop() : IB.play()));
    stage.addEventListener('click', (e) => {
      if (e.target === stage || e.target === wordEl || e.target.closest('#word')) {
        IB.runtime.playing ? IB.stop() : IB.play();
      }
    });

    IB.$('prevChunkBtn').addEventListener('click', () => IB.goChunk(-1));
    IB.$('nextChunkBtn').addEventListener('click', () => IB.goChunk(1));
    IB.$('prevParaBtn').addEventListener('click', () => IB.goParagraph(-1));
    IB.$('nextParaBtn').addEventListener('click', () => IB.goParagraph(1));

    IB.$('wpmMinus').addEventListener('click', () => IB.setWpm(IB.state.wpm - 25));
    IB.$('wpmPlus').addEventListener('click', () => IB.setWpm(IB.state.wpm + 25));
    IB.$('speed').addEventListener('input', () => IB.setWpm(parseInt(IB.$('speed').value, 10)));
    [...document.querySelectorAll('.presets button')].forEach((b) => {
      b.addEventListener('click', () => IB.setWpm(parseInt(b.dataset.wpm, 10)));
    });

    IB.$('chunkSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      IB.stop();
      IB.state.mode = b.dataset.mode;
      if (IB.state.mode === 'words') IB.state.wordCount = parseInt(b.dataset.words, 10);
      IB.updateSeg();
      IB.rebuildChunks();
      IB.render();
      IB.saveSettings();
    });

    IB.$('fontSize').addEventListener('input', () => {
      IB.state.fontSize = parseInt(IB.$('fontSize').value, 10);
      IB.$('fontVal').textContent = IB.state.fontSize;
      wordEl.style.fontSize = IB.state.fontSize + 'px';
      IB.$('focusLine').style.fontSize = IB.state.fontSize + 'px';
      IB.saveSettings();
    });

    IB.$('pauseToggle').addEventListener('change', () => {
      IB.state.pauses = IB.$('pauseToggle').checked;
      IB.saveSettings();
    });

    IB.$('highlightSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      IB.state.highlight = b.dataset.hl;
      IB.applyHighlight();
      IB.render();
      IB.saveSettings();
    });

    IB.$('themeToggle').addEventListener('change', () => {
      IB.state.dark = IB.$('themeToggle').checked;
      document.body.classList.toggle('light', !IB.state.dark);
      IB.applyMetaTheme();
      IB.saveSettings();
    });

    IB.$('clearPosBtn').addEventListener('click', () => {
      IB.clearPos();
      IB.closeDrawers();
    });

    IB.$('fontSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      IB.state.font = b.dataset.font;
      IB.applyFont();
      IB.saveSettings();
    });

    IB.$('settingsBtn').addEventListener('click', () => IB.openDrawer('settings'));
    IB.$('tocBtn').addEventListener('click', () => IB.openDrawer('toc'));
    IB.$('backdrop').addEventListener('click', IB.closeDrawers);
    [...document.querySelectorAll('[data-close]')].forEach((b) => {
      b.addEventListener('click', IB.closeDrawers);
    });

    document.addEventListener('keydown', (e) => {
      if (!reader.classList.contains('active')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        IB.runtime.playing ? IB.stop() : IB.play();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        IB.goChunk(1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        IB.goChunk(-1);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        IB.setWpm(IB.state.wpm + 25);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        IB.setWpm(IB.state.wpm - 25);
      } else if (e.code === 'PageDown') {
        e.preventDefault();
        IB.goParagraph(1);
      } else if (e.code === 'PageUp') {
        e.preventDefault();
        IB.goParagraph(-1);
      } else if (e.code === 'Home') {
        e.preventDefault();
        IB.stop();
        IB.runtime.chunkIndex = 0;
        IB.render();
        IB.savePos();
      } else if (e.code === 'KeyO') {
        const order = ['all', 'letter', 'line', 'none'];
        IB.state.highlight = order[(order.indexOf(IB.state.highlight) + 1) % order.length];
        IB.applyHighlight();
        IB.render();
        IB.saveSettings();
      } else if (e.code === 'Escape') {
        const settingsOpen = IB.$('settingsDrawer').classList.contains('open');
        const tocOpen = IB.$('tocDrawer').classList.contains('open');
        if (settingsOpen || tocOpen) IB.closeDrawers();
        else IB.$('backBtn').click();
      }
    });
  }

  function init() {
    bindEvents();
    IB.initPwa();
    try {
      IB.loadSettings();
      IB.applySettingsToUI();
    } catch (e) {
      console.warn('init:', e);
    }
    const ver = document.querySelector('[data-version]');
    if (ver) ver.textContent = 'v' + IB.VERSION;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.IziBook);
