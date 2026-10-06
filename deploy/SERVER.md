# buzumurga.com на VPS (Hetzner, Nginx, рядом с Kypito)

Сайт статический: GitHub Actions собирает его и выкладывает по rsync. Формы обратной связи и серверного кода нет,
связь через email и LinkedIn на странице.

## Жёсткие правила

- **Конфиги Kypito и других проектов не трогать.** Ни файлы, ни сертификаты, ни сервисы, ни порты.
- Перед каждым `systemctl reload nginx`: бэкап `/etc/nginx` и `nginx -t`. Если `nginx -t` падает, ничего не перезагружать.
- Приватные ключи никогда не коммитить и не выводить в отчёты.
- Сайты на этом сервере живут в `/var/sites/<домен>`, не в `/var/www`: `/var/www` это корень WordPress Kypito,
  всё внутри него видно через w.kypito.com.

## Что где

- `/var/sites/buzumurga.com` - сайт, владелец `deploy`, пишет только GitHub Actions.
- `/etc/nginx/sites-available/buzumurga.com.conf` - конфиг сайта (копия `deploy/nginx/buzumurga.com.conf`).
- `/etc/nginx/snippets/buzumurga-security-headers.conf`, `buzumurga-blocklist.conf` - заголовки безопасности и блок-лист IP.
- `/etc/letsencrypt/live/buzumurga.com/` - сертификат на buzumurga.com, www.buzumurga.com, buzumur.ga, www.buzumur.ga
  (webroot `/var/www/html`, продлевается certbot по таймеру).
- `/home/deploy/.ssh/authorized_keys` - ключ GitHub Actions, ограничен папкой сайта через
  `command="/usr/bin/rrsync /var/sites/buzumurga.com",restrict`.
- `/var/log/nginx/buzumurga.com.*.log` - логи сайта.

## Выкладка

Любой push в `master` (или Actions → Deploy → Run workflow) собирает сайт, проверяет и выкладывает.
Нужны секреты репозитория `SSH_HOST`, `SSH_USER` (`deploy`), `SSH_KEY`, `SSH_KNOWN_HOSTS` и переменная `DEPLOY_ENABLED=true`.

Сменить ключ деплоя:

```bash
ssh-keygen -q -t ed25519 -N "" -C "github-actions buzumurga.com" -f /root/buzumurga_deploy_key
echo "command=\"/usr/bin/rrsync /var/sites/buzumurga.com\",restrict $(cat /root/buzumurga_deploy_key.pub)" > /home/deploy/.ssh/authorized_keys
gh secret set SSH_KEY -R 1cvet/buzumurga.com < /root/buzumurga_deploy_key
shred -u /root/buzumurga_deploy_key
```

## Изменить конфиг Nginx

```bash
cp -a /etc/nginx /root/nginx-backup-$(date +%F-%H%M)
cp deploy/nginx/buzumurga.com.conf /etc/nginx/sites-available/buzumurga.com.conf
nginx -t && systemctl reload nginx
```

На сервере nginx 1.24: `listen 443 ssl http2` (форма `http2 on;` появилась только в 1.25.1).

## Проверка

```bash
for p in / /ru/ /Buzumurga_Mikhail.pdf /docs/certificates/misis-agile.pdf /yandex_07a1f1746c93fd4e.html /googled640c1452a8ed5fe.html /sitemap.xml /nope; do
  printf '%-40s ' $p; curl -s -o /dev/null -w '%{http_code}\n' https://buzumurga.com$p
done
# ожидается 200 везде, /nope -> 404
curl -sI https://buzumurga.com/ | grep -iE 'HTTP/|strict|content-security|cache'
curl -sI http://www.buzumurga.com/x | grep -i location     # -> https://buzumurga.com/x
curl -sI https://buzumur.ga/ru/ | grep -i location          # -> https://buzumurga.com/ru/
curl -sI https://buzumurga.com/Buzumurga_Mikhail.docx | grep -i location   # -> /Buzumurga_Mikhail.pdf
```

Скрипт `deploy/audit.sh` (только чтение) снимает состояние сервера, если нужно разобраться заново.
