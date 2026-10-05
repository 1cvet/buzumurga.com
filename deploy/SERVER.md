# buzumurga.com на VPS (Hetzner, Nginx, рядом с Kypito)

Это инструкция для Claude на сервере (или для человека с root-доступом).
Файлы, на которые она ссылается, лежат в этом репозитории.
Сайт полностью статический: никаких сервисов, баз данных и рантаймов на сервере ему не нужно, только Nginx и certbot.

## Жёсткие правила

- **Конфиги Kypito и других проектов не трогать.** Ни файлы, ни сертификаты, ни сервисы, ни порты.
- Перед каждым `systemctl reload nginx`: бэкап `/etc/nginx` и `nginx -t`. Если `nginx -t` падает, ничего не перезагружать.
- Секреты (приватные ключи) никогда не коммитить и не выводить целиком в отчёты.
- Этапы 1-3 выполнять только после «ок» владельца на отчёт по этапу 0.

Все команды ниже выполняются из корня копии репозитория на сервере, например:
`git clone https://github.com/1cvet/buzumurga.com.git /root/buzumurga.com-src && cd /root/buzumurga.com-src`
(репозиторий приватный: нужен токен с правом чтения или можно скачать ZIP ветки на GitHub и распаковать).
Для этапа 0 достаточно одного файла `deploy/audit.sh`.

---

## Этап 0. Аудит (только чтение)

```bash
bash deploy/audit.sh 2>&1 | tee /tmp/buzumurga-audit.txt
```

Скрипт ничего не меняет. Пришлите владельцу короткий отчёт:

1. ОС, версия Nginx (>= 1.25.1? есть ли brotli), есть ли IPv6.
2. Список server-блоков: какие домены и порты заняты, где конфиг Kypito (только путь, не трогать).
3. Certbot: установлен ли, как продлевается (timer / cron), есть ли `/etc/letsencrypt/options-ssl-nginx.conf`.
4. Firewall: открыты ли 80/443.
5. Есть ли `rsync` и `/usr/bin/rrsync`.
6. Куда сейчас указывают DNS-записи четырёх доменов.

Если в выводе `nginx -T` есть секреты (токены в заголовках, пароли), замаскируйте их перед отправкой.

План по итогам аудита - и ждать «ок».

---

## Этап 1. Установка (после «ок»)

### 1.1 Папки и пользователь deploy

```bash
cp -a /etc/nginx /root/nginx-backup-$(date +%F-%H%M)

adduser --disabled-password --gecos "" deploy
install -d -o deploy -g deploy -m 755 /var/www/buzumurga.com
install -d -m 755 /var/www/certbot

# ключ только для GitHub Actions; доступ ограничен папкой сайта через rrsync
ssh-keygen -t ed25519 -N "" -C "github-actions buzumurga.com" -f /root/buzumurga_deploy_key
install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
echo "command=\"/usr/bin/rrsync /var/www/buzumurga.com\",restrict $(cat /root/buzumurga_deploy_key.pub)" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
```

Если в `sshd_config` есть `AllowUsers`, добавьте `deploy` (только по согласованию с владельцем) и `sshd -t && systemctl reload ssh`.

Владельцу передать для GitHub (Settings → Secrets and variables → Actions):

| Секрет | Значение |
| --- | --- |
| `SSH_HOST` | публичный IP сервера |
| `SSH_USER` | `deploy` |
| `SSH_PORT` | порт SSH, если не 22 |
| `SSH_KEY` | содержимое `/root/buzumurga_deploy_key` (приватный ключ, целиком) |
| `SSH_KNOWN_HOSTS` | вывод `ssh-keyscan -t ed25519 -p <порт> <IP>` |

После того как владелец сохранил ключ в GitHub: `shred -u /root/buzumurga_deploy_key`.

### 1.2 Nginx: временный HTTP-конфиг

```bash
cp deploy/nginx/buzumurga-security-headers.conf deploy/nginx/buzumurga-blocklist.conf /etc/nginx/snippets/
cp deploy/nginx/buzumurga.com.bootstrap.conf /etc/nginx/sites-available/buzumurga.com.conf
ln -s /etc/nginx/sites-available/buzumurga.com.conf /etc/nginx/sites-enabled/buzumurga.com.conf
nginx -t && systemctl reload nginx
```

Нет IPv6 - удалить строки `listen [::]...`. Если на сервере `conf.d` вместо `sites-enabled`, положить файл туда.

### 1.3 Первая выкладка

Владелец добавляет секреты, переменную репозитория `DEPLOY_ENABLED=true` и запускает workflow **Deploy**
(Actions → Deploy → Run workflow на ветке master). Smoke test в конце будет жёлтым, пока DNS смотрит на старый хостинг, это нормально.

### 1.4 Проверка до смены DNS

```bash
IP=<публичный IP>
for p in / /ru/ /Buzumurga_Mikhail.pdf /docs/certificates/misis-agile.pdf /yandex_07a1f1746c93fd4e.html /googled640c1452a8ed5fe.html /sitemap.xml /nope; do
  printf '%-40s ' $p; curl -s -o /dev/null -w '%{http_code}\n' --resolve buzumurga.com:80:$IP http://buzumurga.com$p
done
# ожидается 200 везде, /nope -> 404
```

---

## Этап 2. DNS (меняет владелец)

За сутки до переключения снизить TTL записей до 300 секунд. Записи:

| Имя | Тип | Значение |
| --- | --- | --- |
| `buzumurga.com` | A | IPv4 сервера |
| `www.buzumurga.com` | A | IPv4 сервера |
| `buzumur.ga` | A | IPv4 сервера |
| `www.buzumur.ga` | A | IPv4 сервера |
| те же четыре | AAAA | IPv6 сервера (только если он есть и Nginx слушает `[::]`) |

Старые AAAA-записи, указывающие на старый хостинг, удалить, иначе часть посетителей уйдёт туда.
После переключения и проверки TTL можно вернуть на 3600. Старый хостинг не отключать ещё неделю.

---

## Этап 3. HTTPS (после того как DNS разошёлся)

```bash
for d in buzumurga.com www.buzumurga.com buzumur.ga www.buzumur.ga; do echo "$d $(dig +short A $d)"; done
# все должны показывать IP этого сервера; если какой-то домен не переключён - убрать его из -d ниже и из server_name

certbot certonly --webroot -w /var/www/certbot \
  -d buzumurga.com -d www.buzumurga.com -d buzumur.ga -d www.buzumur.ga \
  --deploy-hook "systemctl reload nginx"

cp -a /etc/nginx /root/nginx-backup-$(date +%F-%H%M)
cp deploy/nginx/buzumurga.com.conf /etc/nginx/sites-available/buzumurga.com.conf
# поправить по аудиту: IPv6, http2 (>= 1.25.1: "listen 443 ssl;" + "http2 on;")
nginx -t && systemctl reload nginx
certbot renew --dry-run
```

Если `/etc/letsencrypt/options-ssl-nginx.conf` нет (certbot без nginx-плагина), заменить include на:
`ssl_protocols TLSv1.2 TLSv1.3; ssl_prefer_server_ciphers off; ssl_session_cache shared:buzumurga:10m;`

Финальная проверка:

```bash
curl -sI https://buzumurga.com/ | grep -iE 'HTTP/|strict|content-security|cache'
curl -sI http://www.buzumurga.com/x | grep -i location     # -> https://buzumurga.com/x
curl -sI https://buzumur.ga/ru/ | grep -i location          # -> https://buzumurga.com/ru/
curl -sI https://buzumurga.com/Buzumurga_Mikhail.docx | grep -i location   # -> /Buzumurga_Mikhail.pdf
```

---

## Что где

| Путь на сервере | Что |
| --- | --- |
| `/var/www/buzumurga.com` | сайт (пишет только GitHub Actions от `deploy`) |
| `/var/www/certbot` | ACME-челленджи |
| `/etc/nginx/sites-available/buzumurga.com.conf` | конфиг сайта |
| `/etc/nginx/snippets/buzumurga-*.conf` | заголовки безопасности и блок-лист IP |
| `/var/log/nginx/buzumurga.com.*.log` | логи сайта |
