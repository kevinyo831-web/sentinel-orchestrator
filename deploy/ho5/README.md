# HO5 AI 流量管理部署包

把上海 HO5 的 Ubuntu 主機打造成 Sentinel Orchestrator 的 **AI API 流量網關**：
統一出口、負載均衡、自動重試、響應緩存、流量整形，並透過 Tailscale 做安全隔離。

```
調用方（N200 / 手機 / n8n / 本 App）
        │  Tailscale 隧道（服務只監聽內網 IP）
        ▼
┌─ HO5 (Ubuntu) ────────────────────────────────┐
│  LiteLLM :4000 ── Redis 響應緩存（TTL 1h）      │
│    ├─ gemini / openai / perplexity / grok      │
│    ├─ nvidia / vertex（境外，帶重試+降級）      │
│    └─ local → Ollama（流量不出海）              │
│  tc + fq_codel 流量整形（跨境大流量限速 75%）   │
└────────────────────────────────────────────────┘
```

## 1. 部署 LiteLLM 網關（AI API 代理）

前置：HO5 已安裝 Docker 與 Docker Compose plugin。

```bash
cd deploy/ho5
cp .env.example .env
# 編輯 .env：填入各家 API 金鑰、改掉 LITELLM_MASTER_KEY、
# 把 HO5_BIND_IP 設成 Tailscale 內網 IP（tailscale ip -4）
docker compose up -d
```

驗證（在 Tailnet 內任一台設備）：

```bash
curl http://<HO5_TAILSCALE_IP>:4000/v1/chat/completions \
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini", "messages": [{"role": "user", "content": "ping"}]}'
```

網關層自帶的流量管理能力（設定見 `litellm-config.yaml`）：

- **重試**：跨境連線抽風時自動重試 3 次，底層腳本不會直接報錯崩潰
- **降級路由**：openai / grok / perplexity / vertex 失敗時自動退到 gemini，再退到本地 Ollama
- **緩存**：相同請求 1 小時內直接回 Redis 快取 — 流量不出海、Token 消耗歸零、回應毫秒級
- **統一金鑰**：調用方只需要一把 `LITELLM_MASTER_KEY`，各家真實金鑰只存在 HO5 上

Vertex AI（選用）：需要 GCP 服務帳號。把 JSON 憑證放到 `deploy/ho5/vertex-sa.json`，
在 `docker-compose.yml` 的 litellm 服務加上：

```yaml
    volumes:
      - ./vertex-sa.json:/app/vertex-sa.json:ro
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/app/vertex-sa.json
```

本地模型（選用）：在 HO5 宿主機安裝 [Ollama](https://ollama.com) 並 `ollama pull llama3.1`，
`local` 這個 model 就會生效。

## 2. 讓本 App 走 HO5 網關

在 App 的執行環境設定兩個變數（見根目錄 `.env.example`）：

```
HO5_GATEWAY_URL=http://<HO5_TAILSCALE_IP>:4000
HO5_GATEWAY_KEY=<LITELLM_MASTER_KEY>
```

設定後 `/api/chat` 的**所有** provider（含原本未整合的 grok / nvidia / vertex / local）
都會統一走網關；不設定則維持原本直連各家 API 的行為。

> 注意：部署在 Vercel 的實例連不到 Tailscale 內網 IP。此模式適用於
> 在 Tailnet 內自架的實例（例如直接跑在 HO5 或 N200 上 `npm run dev` / `npm start`）。
> 若一定要讓 Vercel 走 HO5，需用 `tailscale funnel` 把 4000 埠安全地暴露出去。

## 3. 跨境大流量整形（tc Traffic Shaping)

N200 ⇄ HO5 同步大數據集時，把 Tailscale（UDP 41641）限制在上行頻寬的 70%~80%，
避免觸發 ISP QoS 斷流：

```bash
# 例：上行 100mbit，Tailscale 限 75mbit
sudo ./traffic-shaping.sh apply eth0 100mbit 75mbit

sudo ./traffic-shaping.sh status eth0   # 查看統計
sudo ./traffic-shaping.sh clear eth0    # 移除規則
```

開機自動套用：加入 crontab（`sudo crontab -e`）：

```
@reboot /path/to/deploy/ho5/traffic-shaping.sh apply eth0 100mbit 75mbit
```

## 4. Tailscale 安全隔離

- `HO5_BIND_IP` 設為 Tailscale IP 後，網關**不監聽公網**，只有 Tailnet 內的設備能調用
- Redis 完全不對外開埠，只在 compose 內網供 LiteLLM 使用
- 建議再用 Tailscale ACL 限制哪些節點能存取 HO5 的 4000 埠
