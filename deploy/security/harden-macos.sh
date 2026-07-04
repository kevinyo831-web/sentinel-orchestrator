#!/usr/bin/env bash
# MacBook（macOS）安全加固腳本
#
# 針對 Wazuh 在 macOS 上常見的 Critical 告警：系統/瀏覽器 CVE 未修補、
# 防火牆未開、FileVault 未加密、遠端服務暴露。
#
# 用法：
#   sudo ./harden-macos.sh              # 檢查模式，只報告不改動
#   sudo APPLY=1 ./harden-macos.sh      # 實際套用
#
# 冪等：重複執行安全。

set -euo pipefail

APPLY="${APPLY:-0}"
[ "$(id -u)" -eq 0 ] || { echo "請用 sudo 執行" >&2; exit 1; }

log() { echo -e "\n== $* =="; }
FW=/usr/libexec/ApplicationFirewall/socketfilterfw

if [ "$APPLY" != "1" ]; then
  echo "#########################################################"
  echo "# 檢查模式：只顯示現況與將執行的動作，加 APPLY=1 套用。 #"
  echo "#########################################################"
fi

# ── 1. 系統與 App 自動更新：清掉大宗 CVE 告警 ──────────────────
log "1. 自動更新"
if [ "$APPLY" = "1" ]; then
  defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled -bool true
  defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticDownload -bool true
  defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticallyInstallMacOSUpdates -bool true
  defaults write /Library/Preferences/com.apple.SoftwareUpdate CriticalUpdateInstall -bool true
  defaults write /Library/Preferences/com.apple.SoftwareUpdate ConfigDataInstall -bool true
  defaults write /Library/Preferences/com.apple.commerce AutoUpdate -bool true
  echo "  已開啟：自動檢查/下載/安裝 macOS 更新、安全性回應、App Store 自動更新"
  echo "  （建議另手動跑一次：softwareupdate --install --all）"
else
  echo "  現況 AutomaticCheckEnabled: $(defaults read /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled 2>/dev/null || echo 未設定)"
  echo "  [檢查模式] 將開啟全部自動更新選項"
fi

# ── 2. 應用程式防火牆 + 隱身模式 ───────────────────────────────
log "2. 防火牆"
echo "  現況：$($FW --getglobalstate)"
if [ "$APPLY" = "1" ]; then
  $FW --setglobalstate on
  $FW --setstealthmode on          # 不回應 ping/埠掃描
  $FW --setallowsigned on
  echo "  已開啟防火牆 + 隱身模式"
else
  echo "  [檢查模式] 將開啟防火牆與隱身模式"
fi

# ── 3. 磁碟加密與 Gatekeeper（只檢查，不強制）─────────────────
log "3. FileVault / Gatekeeper / SIP 狀態"
echo "  FileVault: $(fdesetup status)"
echo "  Gatekeeper: $(spctl --status 2>&1)"
echo "  SIP: $(csrutil status 2>&1)"
fdesetup status | grep -q "is On" || \
  echo "  ⚠️ FileVault 未開啟 → 系統設定 › 隱私權與安全性 › FileVault 手動開啟（需保管復原金鑰）"

# ── 4. 收掉遠端攻擊面 ──────────────────────────────────────────
log "4. 遠端服務"
echo "  遠端登入(SSH): $(systemsetup -getremotelogin 2>/dev/null || echo '無法讀取')"
if [ "$APPLY" = "1" ]; then
  # MacBook 通常是客戶端；若你需要 SSH 進 MacBook，請改用 Tailscale SSH 再關這裡
  systemsetup -setremotelogin off 2>/dev/null || true
  defaults write /Library/Preferences/com.apple.loginwindow GuestEnabled -bool false
  echo "  已關閉遠端登入、停用訪客帳號"
else
  echo "  [檢查模式] 將關閉遠端登入(SSH)與訪客帳號（需要遠端進 MacBook 時改走 Tailscale SSH）"
fi

# ── 5. 螢幕鎖定 ────────────────────────────────────────────────
log "5. 螢幕鎖定"
if [ "$APPLY" = "1" ]; then
  # 進入螢幕保護/睡眠後 5 秒內要求密碼
  sysadminctl -screenLock 5seconds -password - 2>/dev/null \
    || echo "  ⚠️ 此 macOS 版本需手動設定：系統設定 › 鎖定畫面 › 立即要求密碼"
else
  echo "  [檢查模式] 將設定睡眠後 5 秒內要求密碼"
fi

echo
echo "完成。$([ "$APPLY" = 1 ] && echo '已套用加固；FileVault 如未開啟請依上方提示手動處理。' || echo '以上為檢查模式，確認後加 APPLY=1 重跑。')"
