# IziBook — инструкции для AI-агента

Читай этот файл **в начале любой сессии** по репозиторию.  
Детали архитектуры: [ARCHITECTURE.md](ARCHITECTURE.md). Для людей: [README.md](README.md).

## Что это

Статический RSVP-ридер (скорочтение). Без бэкенда, без React/Vite.  
Онлайн: GitHub Pages → `index.html` в корне ветки `main`.

## Жёсткие правила (не нарушать)

1. **Не переносить** рабочий вход из корня (`index.html`, `css/`, `js/`) в `dist/`/`src/` без смены настроек Pages — сайт сломается. Pages = ветка `main`, папка `/`.
2. **Не класть** новые версии файлами в корень (`IziBook-v4.html`). Версии = git tags `vX.Y.Z` + GitHub Releases.
3. **Не вводить** обязательный бандлер для разработки. Модули — обычные `<script src>` (работают с Pages и с `file://`).
4. **Не менять** ключи localStorage (`izibook-v3-settings`, `izibook-v3-pos-*`) без миграции — сотрётся прогресс у пользователей.
5. Старые монолиты только в `archive/`. Демо-книги только в `samples/`.

## Карта кода

```
файл/текст → files → parser → chunks → player → экран
                         ↑ storage
                         ↑ ui / main / pwa
```

| Путь | Роль |
|------|------|
| `index.html` | Разметка + подключение css/js |
| `css/app.css` | Стили |
| `js/state.js` | Версия `IziBook.VERSION`, настройки, runtime |
| `js/parser.js` | Текст → абзацы → предложения → слова |
| `js/chunks.js` | Режимы кадра → RSVP-чанки + главы |
| `js/player.js` | Таймер WPM, рендер, навигация |
| `js/storage.js` | localStorage |
| `js/files.js` | .txt (кодировки), .epub (JSZip с CDN) |
| `js/ui.js` / `main.js` / `pwa.js` | UI, события, PWA-лайт |
| `scripts/bundle.mjs` | Сборка **одного** HTML для Release (не для Pages) |
| `.github/workflows/release.yml` | По тегу `v*` → Release + артефакты |

Namespace: `window.IziBook`. Порядок скриптов в `index.html` = граф зависимостей.

## Когда пользователь просит «сделай релиз» / «выпусти версию»

Следуй чеклисту ниже. Не создавай копий HTML в корне.

### Чеклист релиза

1. Убедись, что нужные фиксы уже в `main` (или в текущей ветке, которую мержат в `main`).
2. Выбери semver относительно текущего `package.json` → `version`:
   - patch `3.2.1` — фикс
   - minor `3.3.0` — фича без ломки
   - major `4.0.0` — ломка совместимости
3. Синхронизируй номер в **двух** местах:
   - `package.json` → `"version"`
   - `js/state.js` → `IB.VERSION`
   - при желании строку версии в `README.md`
4. Закоммить, например: `Release v3.2.1: краткое зачем`.
5. Создай и запушь **аннотированный** тег с префиксом `v`:

```bash
git tag -a v3.2.1 -m "IziBook v3.2.1"
git push origin main
git push origin v3.2.1
```

6. Дождись Actions: workflow **Release** соберёт:
   - `IziBook-vX.Y.Z.html` (single-file через `npm run bundle`)
   - `IziBook-samples.zip`
7. Проверь страницу Releases на GitHub. Pages обновятся сами с `main` (отдельно деплоить не нужно).

### Локально собрать один HTML без тега

```bash
npm run bundle
# → dist/IziBook-vX.Y.Z.html
```

## Типичные задачи → куда лезть

| Задача | Файлы |
|--------|--------|
| Скорость / паузы / play | `js/player.js` |
| Режимы «1 слово / авто / предложение» | `js/chunks.js` |
| Разбор текста, главы в TOC | `js/parser.js` (+ `isChapterHeading`) |
| EPUB / кодировки txt | `js/files.js` |
| Настройки, шторки, старт чтения | `js/ui.js`, `js/main.js` |
| Тема, ORP-стили | `css/app.css` |
| Новый релиз | этот файл, § «релиз» |

## Чего агенту не делать без явной просьбы

- Не переписывать на фреймворк
- Не добавлять Service Worker «заодно»
- Не force-push в `main`
- Не менять upstream Pages settings через API
