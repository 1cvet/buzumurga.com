#!/bin/bash
# READ-ONLY audit of the VPS before installing buzumurga.com.
# Changes nothing. Run as root (or with sudo) and send the whole output back.
#   bash audit.sh 2>&1 | tee /tmp/buzumurga-audit.txt
section() { printf '\n===== %s =====\n' "$1"; }

section "system"
uname -a; cat /etc/os-release 2>/dev/null | head -4; uptime
section "disk / memory"
df -h / /var 2>/dev/null; free -h
section "network"
ip -br addr 2>/dev/null; echo; curl -s -4 --max-time 5 https://ifconfig.me; echo " (public IPv4)"; curl -s -6 --max-time 5 https://ifconfig.me; echo " (public IPv6)"

section "nginx"
nginx -v 2>&1; nginx -V 2>&1 | tr ' ' '\n' | grep -E 'brotli|http_v2|http_v3' || true
systemctl is-active nginx; nginx -t 2>&1
section "nginx server blocks (server_name / listen / root)"
nginx -T 2>/dev/null | grep -nE '^\s*(# configuration file|server_name|listen|root|proxy_pass|limit_req_zone|ssl_certificate )' | sed 's/^\s*//'
section "nginx sites"
ls -la /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ /etc/nginx/snippets/ 2>/dev/null
section "full nginx -T (for reference)"
nginx -T 2>/dev/null

section "certbot"
certbot --version 2>&1; certbot certificates 2>&1 | grep -E 'Certificate Name|Domains|Expiry|Path' ; systemctl list-timers 2>/dev/null | grep -i certbot
ls /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem 2>&1

section "runtimes"
for b in node npm php php-fpm python3 pm2 docker; do printf '%-8s ' "$b"; command -v $b >/dev/null && ($b --version 2>&1 | head -1) || echo "-"; done
systemctl list-units --type=service --state=running 2>/dev/null | grep -iE 'node|php|python|pm2|gunicorn|uvicorn|docker|kypito' || true
pm2 ls 2>/dev/null || true

section "listening ports"
ss -ltnp 2>/dev/null

section "firewall"
ufw status verbose 2>/dev/null || true; nft list ruleset 2>/dev/null | head -60 || iptables -S 2>/dev/null | head -60

section "web roots and users"
ls -la /var/www/ 2>/dev/null; id deploy 2>&1; getent passwd | awk -F: '$3>=1000 {print $1, $6, $7}'
section "ssh"
sshd -T 2>/dev/null | grep -E '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|allowusers) '

section "outbound SMTP (Hetzner usually blocks 25/465)"
for port in 25 465 587; do timeout 5 bash -c "</dev/tcp/smtp.gmail.com/$port" 2>/dev/null && echo "$port open" || echo "$port blocked"; done
section "Telegram API reachable"
curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 https://api.telegram.org/

section "DNS today"
for d in buzumurga.com www.buzumurga.com buzumur.ga www.buzumur.ga; do printf '%-20s A: %s  AAAA: %s\n' $d "$(dig +short A $d | tr '\n' ' ')" "$(dig +short AAAA $d | tr '\n' ' ')"; done
