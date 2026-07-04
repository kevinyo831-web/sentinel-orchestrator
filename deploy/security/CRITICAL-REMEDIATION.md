# Critical 漏洞逐台修補指南（2026-07-04 Wazuh 明細）

三台主機共 **348 筆 Critical**，但高度集中 — 其中 **312 筆（90%）只要
5 個動作**就能清掉：兩台 Ubuntu 換掉舊內核、HO5 移除 Thunderbird、
MacBook 更新 Chrome 與 macOS。

| 主機（agent） | Critical | 最大宗來源 |
|---|---|---|
| N200（kai0831-PRO-ADL-N-Cubi-N-MS-B0A9） | 174 | 舊內核映像 ×152、langchain ×3 |
| HO5（kai0831-HO5） | 144 | 舊內核映像 ×84、Thunderbird ×33 |
| MacBook（tracymacbook-air） | 30 | Chrome ×24、macOS、litellm |

## HO5（144 筆 Critical）

**① 舊內核映像（84 筆）** — `linux-image-7.0.0-22/-27` 兩個舊版本留在
機器上，每個帶著幾十個已修補的 CVE：

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot                      # 切到最新內核
uname -r                         # 確認已是新版本
sudo apt autoremove --purge -y   # 清除舊內核映像 → 84 筆告警消失
```

**② Thunderbird 140.12.1esr（33 筆）** — 含 CVE-2026-7321 / CVE-2026-8959
（沙箱逃逸）等。HO5 是伺服器，若根本沒在用郵件客戶端，直接移除最乾淨：

```bash
sudo apt purge -y thunderbird    # 有在用的話改成升級到最新 ESR
```

**③ 其餘零星（~27 筆）** — libraw、ffmpeg 系列、sssd 全家桶（CVE-2023-3326）
等，`full-upgrade` 會一併處理；若 HO5 沒接 AD/LDAP，sssd 也可直接
`sudo apt purge -y sssd-common` 縮小攻擊面。

## N200（174 筆 Critical）

**① 舊內核映像（152 筆）** — `linux-image-6.17.0-23/-35` 各 76 筆，
處理方式同 HO5：`full-upgrade` → `reboot` → `autoremove --purge`。

**② langchain（3 筆，值得特別注意）** — pip 裝的 `langchain-community
0.0.13` 與 `langchain-core 0.1.23` 非常舊：

- CVE-2025-2828：RequestsToolkit **SSRF**
- CVE-2025-68664：`dumps()/dumpd()` 序列化注入
- CVE-2024-2057：langchain_community 反序列化 RCE

N200 上如果有跑 AI 自動化（n8n / 自寫 agent），這是真實可利用面：

```bash
pip install -U langchain-community langchain-core   # 或不再使用就 pip uninstall
pip list --outdated | grep -Ei 'langchain|llm'      # 順手檢查同族套件
```

**③ 其餘零星** — ruby3.2（CVE-2026-42257 Net::IMAP）、ovmf、sssd，
`full-upgrade` 一併處理。

## MacBook（30 筆 Critical）

**① Chrome 150.0.7871.46（24 筆）** — 全部在 **150.0.7871.47** 修掉，
就差一個小版號（含多個 use-after-free 與沙箱逃逸鏈）。
Chrome → 設定 → 關於 Chrome → 更新後**重新啟動瀏覽器**。

**② macOS 26.5.1（1 筆）** — CVE-2026-39868，升級到 26.5.2：
`softwareupdate --install --all --restart`

**③ pip 套件（4 筆）**：

```bash
pip install -U cryptography litellm openclaw
```

- `litellm 1.83.4` 有 **CVE-2026-42208（proxy 金鑰檢查的查詢注入）** —
  和 HO5 網關同款軟體。HO5 上的網關是 Docker 映像（`main-stable`），
  在 HO5 執行 `docker compose pull && docker compose up -d` 一併更新。
- `openclaw 2026.4.2` 有 webhook 驗證繞過（CVE-2026-44109）與
  hook 事件注入（CVE-2026-43534），若有對外開 webhook 應立即更新。

## 修補後驗證

1. 各台跑完後執行 Wazuh agent 重新掃描（或等下一輪排程）
2. Dashboard → Vulnerability Detection 確認 Critical 歸零或只剩個位數
3. 殘餘的看 `-`（未評分）與 High 級距，再決定下一輪

## 防止再犯

- 兩台 Ubuntu：`harden-ubuntu.sh` 已啟用 unattended-upgrades，內核安全
  更新會自動裝，但**換內核仍需重開機** — 建議每月排一次維護重啟；
  舊內核用 `apt autoremove --purge` 定期清
- MacBook：`harden-macos.sh` 已開啟全部自動更新；Chrome 記得定期重啟
  瀏覽器讓更新生效
- pip 套件不在系統自動更新範圍 — langchain / litellm / openclaw 這類
  AI 工具鏈更新很快，建議每月 `pip list --outdated` 檢查一次
