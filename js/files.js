/**
 * IziBook — загрузка .txt (автокодировка) и .epub (JSZip с CDN).
 *
 * EPUB: упрощённый разбор OPF/spine без nav/NCX. DRM не поддерживается.
 * Для EPUB нужен интернет (подгрузка JSZip), пока библиотека не закэширована.
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

  IB.readTextFile = async function (file) {
    const buf = await file.arrayBuffer();
    const b = new Uint8Array(buf);
    if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
      return new TextDecoder('utf-16le').decode(buf);
    }
    if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
      return new TextDecoder('utf-16be').decode(buf);
    }
    if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
      return new TextDecoder('utf-8').decode(buf.slice(3));
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch (e) {
      /* fall through to legacy encodings */
    }
    const w = new TextDecoder('windows-1251').decode(buf);
    const i = new TextDecoder('ibm866').decode(buf);
    return IB.scoreCyrillic(i) > IB.scoreCyrillic(w) ? i : w;
  };

  function ensureJSZip() {
    if (typeof JSZip !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = JSZIP_URL;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Не удалось загрузить JSZip — для EPUB нужен интернет'));
      document.head.appendChild(s);
    });
  }

  IB.extractEpubText = async function (file) {
    await ensureJSZip();
    if (typeof JSZip === 'undefined') throw new Error('JSZip не загружен (проверьте интернет)');

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const containerPath = Object.keys(zip.files).find((p) => p.toLowerCase() === 'meta-inf/container.xml');
    if (!containerPath) throw new Error('Это не EPUB: нет META-INF/container.xml');

    const containerXml = await zip.file(containerPath).async('string');
    const opfPathMatch = containerXml.match(/full-path=["']([^"']+)["']/);
    if (!opfPathMatch) throw new Error('Не найден файл OPF внутри EPUB');

    const opfPath = opfPathMatch[1];
    const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfFile = zip.file(opfPath) || zip.file(opfPath.toLowerCase());
    if (!opfFile) throw new Error('Файл OPF не найден в архиве');
    const opfXml = await opfFile.async('string');

    const manifestItems = {};
    let m;
    const re1 = /<item\b[^>]*\bhref=["']([^"']+)["'][^>]*\bid=["']([^"']+)["'][^>]*>/g;
    while ((m = re1.exec(opfXml))) manifestItems[m[2]] = m[1];
    const re2 = /<item\b[^>]*\bid=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>/g;
    while ((m = re2.exec(opfXml))) manifestItems[m[1]] = m[2];

    const spineRegex = /<itemref\b[^>]*\bidref=["']([^"']+)["']/g;
    const order = [];
    while ((m = spineRegex.exec(opfXml))) order.push(m[1]);
    const ids = order.length ? order : Object.keys(manifestItems);

    let fullText = '';
    for (const id of ids) {
      const href = manifestItems[id];
      if (!href) continue;
      const cleanHref = decodeURIComponent(href.split('#')[0]);
      const path = opfDir + cleanHref;
      const fileEntry = zip.file(path) || zip.file(path.toLowerCase());
      if (!fileEntry) continue;
      let html = await fileEntry.async('string');
      html = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ');
      const txt = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.textContent;
      if (txt && txt.trim()) fullText += txt + '\n\n';
    }
    if (!fullText.trim()) throw new Error('В EPUB нет читаемого текста (возможно, DRM)');
    return fullText;
  };
})(window.IziBook);
