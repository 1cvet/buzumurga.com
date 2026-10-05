# buzumurga.com

Личный сайт-резюме Михаила Бузумурги. Статичный HTML/CSS/JS, форма обратной связи на PHP.

## Структура

| Путь | Что это |
| --- | --- |
| `index.html` | Вся страница сайта |
| `css/style.css`, `js/main.js` | Стили и скрипты (без jQuery и сторонних библиотек) |
| `inc/sendEmail.php` | Обработчик формы обратной связи (адрес получателя - в начале файла) |
| `fonts/` | Шрифты Montserrat и Libre Baskerville (свои, без Google Fonts) |
| `docs/certificates/` | Сертификаты |
| `Buzumurga_Mikhail.pdf`, `.docx` | Резюме (ссылки на них сохранены по старым адресам) |
| `.htaccess` | Блокировка IP (перенесена со старого сайта), кэш, сжатие, 404 |
| `yandex_*.html`, `google*.html` | Подтверждение прав в Яндекс.Вебмастере и Google Search Console |

## Выкладка на хостинг

**Вариант 1 - вручную.** Загрузить содержимое этой папки в корень сайта на хостинге
(файловый менеджер панели хостинга или FTP-клиент, например FileZilla) с заменой файлов.

**Вариант 2 - через GitHub Actions.** Добавить секреты `FTP_SERVER`, `FTP_USERNAME`,
`FTP_PASSWORD`, `FTP_SERVER_DIR` в настройках репозитория и запустить workflow
*Deploy buzumurga.com* во вкладке Actions. Описание - в `.github/workflows/deploy-buzumurga.yml`.

После выкладки старые файлы шаблона (`css/main.css`, `js/plugins.js`, `blog.html`, `styles.html`,
`images/portfolio/` и т.д.) можно удалить с сервера - новый сайт их не использует.

## Как обновить

- Опыт работы, проекты, тексты - в `index.html`.
- Новое резюме - заменить `Buzumurga_Mikhail.pdf` файлом с тем же именем.
- После правки CSS/JS увеличить `?v=2` в ссылках в `index.html`, чтобы браузеры загрузили новую версию.
