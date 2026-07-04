#!/usr/bin/env bash
# HO5 / N200（Ubuntu）安全加固腳本
#
# 針對 Wazuh Critical 告警的三大來源：
#   1. 未修補 CVE        → 自動安全更新（unattended-upgrades）
#   2. SSH 暴力破解      → sshd 加固 + fail2ban + 防火牆收口
#   3. CIS/SCA 不合格項  → UFW 預設拒絕、sysctl 內核加固、關閉多餘服務
#
# 用法：
#   sudo ./harden-ubuntu.sh                          # 檢查模式，只報告不改動
#   sudo APPLY=1 ./harden-ubuntu.sh                  # 實際套用
#   sudo APPLY=1 SSH_TAILSCALE_ONLY=1 ./harden-ubuntu.sh
#     ↑ SSH 只允許從 Tailscale 網段（100.64.0.0/10）連入。
#       ⚠️ 確認你能經 Tailscale SSH 進來後再開這個，否則會把自己鎖在門外。
#
# 冪等：重複執行安全。

set -euo pipefail

APPLY="${APPLY:-0}"
SSH_TAILSCALE_ONLY="${SSH_TAILSCALE_ONLY:-0}"

[ "$(id -u)" -eq 0 ] || { echo "請用 sudo 執行" >&2; exit 1; }

log()  { echo -e "\n== $* =="; }
run()  { if [ "$APPLY" = "1" ]; then echo "  + $*"; "$@"; else echo "  [檢查模式] $*"; fi; }

if [ "$APPLY" != "1" ]; then
  echo "############################################################"
  echo "# 檢查模式：只顯示將執行的動作。加 APPLY=1 才會實際套用。 #"
  echo "############################################################"
fi

# ── 1. 系統修補：清掉大宗 CVE 告警 ──────────────────────────────
log "1. 套用安全更新 + 啟用自動更新"
run apt-get update -qq
run apt-get -y upgrade
run apt-get -y install unattended-upgrades fail2ban ufw
if [ "$APPLY" = "1" ]; then
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
  echo "  已啟用每日自動安全更新"
fi

# ── 2. SSH 加固：擋掉暴力破解面 ────────────────────────────────
log "2. sshd 加固"
SSHD_DROPIN=/etc/ssh/sshd_config.d/99-hardening.conf

# 只有確認機器上存在可用的 authorized_keys 才關閉密碼登入，避免鎖死
HAS_KEYS=0
for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do
  [ -s "$f" ] && HAS_KEYS=1 && break
done

if [ "$APPLY" = "1" ]; then
  {
    echo "PermitRootLogin no"
    echo "MaxAuthTries 3"
    echo "LoginGraceTime 20"
    echo "X11Forwarding no"
    echo "AllowTcpForwarding yes"
    if [ "$HAS_KEYS" = "1" ]; then
      echo "PasswordAuthentication no"
      echo "KbdInteractiveAuthentication no"
    fi
  } > "$SSHD_DROPIN"
  sshd -t && systemctl reload ssh 2>/dev/null || systemctl reload sshd
  echo "  已寫入 $SSHD_DROPIN（密碼登入：$([ "$HAS_KEYS" = 1 ] && echo 已停用 || echo 保留，因未偵測到 authorized_keys)）"
else
  echo "  [檢查模式] 將寫入 $SSHD_DROPIN（禁 root 登入、限 3 次嘗試$([ "$HAS_KEYS" = 1 ] && echo 、停用密碼登入)）"
fi

# ── 3. fail2ban：自動封鎖暴力破解來源 IP ───────────────────────
log "3. fail2ban（SSH 失敗 3 次封 1 小時，累犯自動加重）"
if [ "$APPLY" = "1" ]; then
  cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 3
bantime.increment = true

[sshd]
enabled = true
EOF
  systemctl enable --now fail2ban
  systemctl restart fail2ban
  echo "  fail2ban 已啟用"
else
  echo "  [檢查模式] 將啟用 fail2ban sshd jail"
fi

# ── 4. 防火牆：預設拒絕，服務只留 Tailscale 內網 ───────────────
log "4. UFW 防火牆"
if [ "$APPLY" = "1" ]; then
  ufw default deny incoming
  ufw default allow outgoing
  # Tailscale 介面全放行（網關、內網服務都走這裡）
  ufw allow in on tailscale0
  # Tailscale 的 P2P 打洞埠
  ufw allow 41641/udp
  if [ "$SSH_TAILSCALE_ONLY" = "1" ]; then
    ufw delete allow OpenSSH 2>/dev/null || true
    ufw delete allow 22/tcp 2>/dev/null || true
    ufw allow from 100.64.0.0/10 to any port 22 proto tcp
    echo "  SSH 已收口：只允許 Tailscale 網段連入"
  else
    ufw allow OpenSSH
    echo "  SSH 仍對外開放（確認 Tailscale SSH 可用後，用 SSH_TAILSCALE_ONLY=1 收口）"
  fi
  ufw --force enable
else
  echo "  [檢查模式] 預設拒絕連入；放行 tailscale0、UDP 41641$([ "$SSH_TAILSCALE_ONLY" = 1 ] && echo '；SSH 僅限 100.64.0.0/10' || echo '；SSH 暫時保留公網')"
fi

# ── 5. 內核網路加固（對應多數 CIS/SCA 網路類不合格項）──────────
log "5. sysctl 內核加固"
if [ "$APPLY" = "1" ]; then
  cat > /etc/sysctl.d/99-hardening.conf <<'EOF'
# 防 IP 欺騙
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
# 防 SYN flood
net.ipv4.tcp_syncookies = 1
# 不接受 / 不發送 ICMP 重導向（非路由器不需要）
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
# 不接受來源路由封包
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
# 記錄可疑封包
net.ipv4.conf.all.log_martians = 1
# 限制內核指標洩漏與非特權 BPF
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.unprivileged_bpf_disabled = 1
net.core.bpf_jit_harden = 2
EOF
  sysctl --system > /dev/null
  echo "  已套用 /etc/sysctl.d/99-hardening.conf"
else
  echo "  [檢查模式] 將寫入 /etc/sysctl.d/99-hardening.conf（rp_filter、syncookies、禁 redirects 等）"
fi

# ── 6. 現況體檢報告 ────────────────────────────────────────────
log "6. 體檢報告"
echo "-- 待安裝的安全更新 --"
apt-get -s upgrade 2>/dev/null | grep -ci ^inst || true
echo "-- 對外監聽的埠（公網面）--"
ss -tulnp | grep -Ev '127\.0\.0\.1|::1|100\.' || echo "（無）"
echo "-- 近期 SSH 登入失敗來源 TOP10 --"
journalctl -u ssh -u sshd --since "7 days ago" 2>/dev/null \
  | grep -oP 'Failed password.*from \K[0-9.]+' | sort | uniq -c | sort -rn | head -10 || echo "（無記錄）"
echo "-- 需要重開機？ --"
[ -f /var/run/reboot-required ] && cat /var/run/reboot-required || echo "不需要"

echo
echo "完成。$([ "$APPLY" = 1 ] && echo '已套用加固。' || echo '以上為檢查模式，確認後加 APPLY=1 重跑。')"
