# Переезд xfluxdev.com (Extra Flow) на buzumurga.com/freelance/

Инструкция для Claude Code на сервере. Выполнять по порядку, после каждого этапа коротко отчитываться.
Общие правила сервера из `deploy/SERVER.md` действуют и здесь: Kypito и чужие конфиги не трогать,
перед `systemctl reload nginx` всегда бэкап `/etc/nginx` и `nginx -t`.

## Что уже сделано в ветке `claude/freelance-work`

- Новая страница `/freelance/` и `/ru/freelance/` (шаблон `src/freelance.mjs`, тексты в `content/*.json` → `freelance`,
  стили в `static/assets/css/style.css`, плеер `static/assets/js/freelance.js`). Страница в общем стиле сайта,
  со светлой и тёмной темой, проходит CSP из `deploy/nginx/buzumurga-security-headers.conf`.
- На главной в блоке «Web development (side projects)» карточка MYIDEM заменена карточкой-ссылкой на `/freelance/`.
- `build.mjs` собирает новые страницы и добавляет их в sitemap. Если не хватает медиа, сборка падает с подсказкой.
- `scripts/fetch-freelance-media.sh` скачивает 3 обложки и 10 записей экрана (около 8-10 МБ) с xfluxdev.com
  и cardinals.law в `static/assets/img/work/` и `static/assets/video/`.
- `deploy/nginx/xfluxdev.com.conf` - конфиг редиректа для этапа 3.

## Этап 1. Медиа и выкладка страницы (xfluxdev.com ещё должен работать)

```bash
git fetch origin && git checkout claude/freelance-work && git pull
bash scripts/fetch-freelance-media.sh        # должно закончиться строкой "Done."
node build.mjs
npm install --no-audit --no-fund && npm run check
```

1. Проверить, что скачалось 10 файлов `.mp4` и 3 обложки, и что обложки открываются (не HTML-страница с ошибкой):
   `file static/assets/img/work/* static/assets/video/*`.
2. Если обложки большие (больше 400 КБ) и нет ffmpeg - поставить `ffmpeg` и запустить скрипт ещё раз
   после удаления этих обложек, он сожмёт их в JPEG до 1200 px.
3. Закоммитить медиа в ту же ветку и отправить:
   ```bash
   git add static/assets/img/work static/assets/video
   git commit -m "Add covers and screen recordings for the freelance page"
   git push
   ```
4. Открыть PR `claude/freelance-work` → `master` (или обновить, если уже открыт), дождаться зелёного CI
   и слить. Деплой пойдёт сам через GitHub Actions.
5. Проверка после деплоя:
   ```bash
   for p in /freelance/ /ru/freelance/ /sitemap.xml; do printf '%-20s ' $p; curl -s -o /dev/null -w '%{http_code}\n' https://buzumurga.com$p; done
   curl -s https://buzumurga.com/freelance/ | grep -o '/assets/video/[^"&]*\.mp4' | head -1 | xargs -I{} curl -sI https://buzumurga.com{} | grep -iE 'HTTP/|content-type'
   ```
   Ожидается 200 и `content-type: video/mp4`.

## Этап 2. Бэкап старого сайта

Сначала выяснить, где живёт xfluxdev.com:

```bash
dig +short xfluxdev.com A; dig +short xfluxdev.com NS; curl -s ifconfig.me
```

- **Если xfluxdev.com на этом сервере** (IP совпадает): найти корень WordPress (`grep -rl xfluxdev /etc/nginx /etc/apache2 2>/dev/null`),
  сделать архив:
  ```bash
  mkdir -p /root/backups
  cd <корень WordPress>
  wp db export /root/backups/xfluxdev-db-$(date +%F).sql --allow-root   # или mysqldump по данным из wp-config.php
  tar czf /root/backups/xfluxdev-files-$(date +%F).tar.gz .
  ```
- **Если на другом хостинге:** остановиться и написать Михаилу, что бэкап надо сделать в панели хостинга
  (файлы `wp-content/uploads` + дамп базы) или через админку WordPress: Инструменты → Экспорт → «Всё содержимое».

Бэкапы не коммитить и не класть в папки сайтов.

## Этап 3. Редирект xfluxdev.com → https://buzumurga.com/ru/freelance/

Все адреса старого сайта ведут на одну страницу, 301.

**Вариант A. Домен переводим на этот сервер (рекомендуется, тогда старый хостинг можно отключить).**

1. Михаил меняет A-записи `xfluxdev.com` и `www.xfluxdev.com` на IP этого сервера (у регистратора или в Cloudflare).
   Дождаться: `dig +short xfluxdev.com` показывает IP сервера.
2. Поставить конфиг пока только с HTTP-блоком (HTTPS-блок закомментировать), выпустить сертификат, вернуть HTTPS-блок:
   ```bash
   cp -a /etc/nginx /root/nginx-backup-$(date +%F-%H%M)
   cp deploy/nginx/xfluxdev.com.conf /etc/nginx/sites-available/xfluxdev.com.conf
   # закомментировать второй server { ... } в /etc/nginx/sites-available/xfluxdev.com.conf
   ln -s /etc/nginx/sites-available/xfluxdev.com.conf /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   certbot certonly --webroot -w /var/www/html -d xfluxdev.com -d www.xfluxdev.com
   cp deploy/nginx/xfluxdev.com.conf /etc/nginx/sites-available/xfluxdev.com.conf   # полный конфиг
   nginx -t && systemctl reload nginx
   ```

**Вариант B. Домен остаётся на старом хостинге.** В корне сайта на хостинге заменить `.htaccess` на:

```apache
RewriteEngine On
RewriteRule ^ https://buzumurga.com/ru/freelance/ [R=301,L]
```

Если домен в Cloudflare, можно вместо этого сделать Redirect Rule (весь хост → `https://buzumurga.com/ru/freelance/`, 301).

**Проверка:**

```bash
for u in http://xfluxdev.com/ https://xfluxdev.com/ https://www.xfluxdev.com/works/ https://xfluxdev.com/wp-admin/; do
  printf '%-40s ' $u; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' $u
done
# ожидается 301 https://buzumurga.com/ru/freelance/ везде
```

## Этап 4. Что остаётся Михаилу (вручную)

- Отключить WordPress-хостинг xfluxdev только после того, как этап 3 проверен (в варианте B хостинг нужен для `.htaccess`).
- Продлить домен xfluxdev.com ещё на 1-2 года, пока поисковики переносят вес по редиректу.
- В описании YouTube-канала Extra Flow и в VK поменять ссылку на https://buzumurga.com/ru/freelance/.
- В футерах prodaykv23.ru и net-klopov.ru стоит ссылка «Сайт разработан в Extraflow.ru». Если домен extraflow.ru свой,
  настроить на нём такой же редирект; если нет, просто иметь в виду.
- Google Search Console и Яндекс Вебмастер: отправить обновлённый `https://buzumurga.com/sitemap.xml`.
