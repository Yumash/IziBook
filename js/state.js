/**
 * IziBook — общее состояние приложения.
 * Настройки (state) сохраняются в localStorage; runtime — только на сессию.
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  IB.VERSION = '3.2.0';

  /** Ключи localStorage. Префикс v3 сохранён для совместимости с прогрессом пользователей. */
  IB.LS_SETTINGS = 'izibook-v3-settings';
  IB.LS_POS = 'izibook-v3-pos-';

  /** Пользовательские настройки (персистентные). */
  IB.state = {
    mode: 'words',       // 'words' | 'auto' | 'sentence'
    wordCount: 1,        // слов в кадре при mode === 'words'
    wpm: 300,
    fontSize: 56,
    pauses: true,        // удлинять паузу на знаках препинания
    dark: true,
    font: 'sans',        // 'sans' | 'serif'
    highlight: 'all'     // 'all' | 'letter' | 'line' | 'none'
  };

  /**
   * Рабочие данные текущей книги (не в localStorage целиком).
   * paragraphs: { text, sentences: string[][] }[]
   * chunks: { text, count, start, sentenceEnd, paraStart, paraEnd, para }[]
   * chapters: { title, chunk }[]
   */
  IB.runtime = {
    paragraphs: [],
    chunks: [],
    chapters: [],
    chunkIndex: 0,
    totalWords: 0,
    playing: false,
    timer: null,
    bookHash: '',
    bookName: ''
  };
})(window.IziBook);
