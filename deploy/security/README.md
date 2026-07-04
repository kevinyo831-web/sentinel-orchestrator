# Wazuh Critical 告警加固包（MacBook / HO5 / N200）

針對 Wazuh 回報三台主機共 **349 筆 Critical** 告警（174 / 145 / 30）的防禦強化。

匯出的 CSV 只有加總數字、沒有告警明細，但個人主機上的 Wazuh Critical
告警幾乎都落在三類，本包對三類同時下手：

| 告警來源 | 佔比特徵 | 對策 |
|---|---|---|
| 未修補 CVE（漏洞偵測模組） | 通常是最大宗，一個過期套件可產生數十筆 | 自動安全更新 |
| SSH 暴力破解（公網掃描） | 持續性、來源 IP 分散 | sshd 加固 + fail2ban + SSH 收進 Tailscale |
| CIS/SCA 基準不合格 | 每次掃描重複出現 | 防火牆預設拒絕 + sysctl 內核加固 |

## 快速開始

### HO5 / N200（Ubuntu）

```bash
cd deploy/security
sudo ./harden-ubuntu.sh                 # 先跑檢查模式，看會動哪些東西
sudo APPLY=1 ./harden-ubuntu.sh         # 套用
# 確認能經 Tailscale SSH 進來之後，把 SSH 從公網收掉（最重要的一步）：
sudo APPLY=1 SSH_TAILSCALE_ONLY=1 ./harden-ubuntu.sh
```

做了什麼：安全更新 + 每日自動更新、sshd 加固（禁 root、限 3 次嘗試、
偵測到金鑰才停用密碼登入）、fail2ban（失敗 3 次封 1 小時，累犯加重）、
UFW 預設拒絕連入（放行 tailscale0 與 UDP 41641）、sysctl 內核加固，
最後輸出體檢報告（待更新數、公網監聽埠、SSH 失敗來源 TOP10）。

> ⚠️ `SSH_TAILSCALE_ONLY=1` 會把 SSH 限制在 100.64.0.0/10。
> 務必先驗證 `ssh <user>@<tailscale-ip>` 可用，再執行這步。

### MacBook（macOS）

```bash
sudo ./harden-macos.sh                  # 檢查模式
sudo APPLY=1 ./harden-macos.sh          # 套用
softwareupdate --install --all         # 立即補完待安裝更新
```

做了什麼：開啟全部自動更新（含快速安全回應）、應用程式防火牆 + 隱身
模式、關閉遠端登入與訪客帳號、睡眠 5 秒內要求密碼；FileVault / SIP /
Gatekeeper 只檢查回報，不強制改動。

### Wazuh Manager（跑 Wazuh 伺服器那台）

把 `wazuh-manager-snippets.xml` 的兩個區塊合併進
`/var/ossec/etc/ossec.conf`，重啟 `wazuh-manager`：

1. **漏洞偵測 + syscollector** — 之後的 Critical 告警會帶具體 CVE 編號
2. **主動回應** — SSH 暴力破解（rule 5710/5712/5763）觸發時，agent
   端自動 `firewall-drop` 封鎖來源 IP 30 分鐘

## 驗證加固成效

套用後等 Wazuh 跑完下一輪掃描（漏洞掃描預設間隔可在 manager 調整），
Critical 數量應明顯下降。快速自查：

```bash
# HO5 / N200
sudo fail2ban-client status sshd        # 封鎖統計
sudo ufw status verbose                 # 防火牆規則
apt list --upgradable 2>/dev/null | wc -l   # 剩餘待更新（應趨近 0）

# MacBook
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

## 第二輪：逐台修補 Critical 漏洞

已依 2026-07-04 匯出的漏洞明細（7,421 筆，Critical 348 筆）完成逐台
分析與修補指令，見 **[CRITICAL-REMEDIATION.md](CRITICAL-REMEDIATION.md)** —
90% 的 Critical 集中在 5 個動作：兩台 Ubuntu 清舊內核、HO5 移除
Thunderbird、MacBook 更新 Chrome 與 macOS。
