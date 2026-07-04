#!/usr/bin/env bash
# HO5 跨境大流量整形（Traffic Shaping）
#
# 用途：N200 ⇄ HO5 之間定期同步幾十 GB 數據集時，跨境 UDP 流量太滿
# 容易觸發 ISP 的 QoS「特別照顧」直接斷流。把 Tailscale 流量硬性限制
# 在上行頻寬的 70%~80%，換取更持久、穩定的總體傳輸量。
#
# 原理：HTB 分兩個 class —
#   1:10 一般流量：可用滿頻寬
#   1:20 Tailscale（UDP 41641）大流量：限制在 BULK_RATE
# 兩個 class 都掛 fq_codel 做隊列管理，抑制 bufferbloat。
#
# 用法：
#   sudo ./traffic-shaping.sh apply  [介面] [總頻寬] [Tailscale限速]
#   sudo ./traffic-shaping.sh clear  [介面]
#   sudo ./traffic-shaping.sh status [介面]
# 例：
#   sudo ./traffic-shaping.sh apply eth0 100mbit 75mbit

set -euo pipefail

ACTION="${1:-status}"
IFACE="${2:-eth0}"
LINK_RATE="${3:-100mbit}"   # 實際上行頻寬上限
BULK_RATE="${4:-75mbit}"    # Tailscale 大流量限速（建議為上行的 70%~80%）
TS_PORT=41641               # Tailscale 預設 UDP 埠（tailscale netcheck 可確認）

apply() {
  # 先清掉舊規則，重複執行也安全
  tc qdisc del dev "$IFACE" root 2>/dev/null || true

  tc qdisc add dev "$IFACE" root handle 1: htb default 10
  tc class add dev "$IFACE" parent 1: classid 1:1 htb rate "$LINK_RATE" ceil "$LINK_RATE"

  # 一般流量：可借用整條頻寬
  tc class add dev "$IFACE" parent 1:1 classid 1:10 htb rate "$LINK_RATE" ceil "$LINK_RATE"
  tc qdisc add dev "$IFACE" parent 1:10 fq_codel

  # Tailscale 大流量：硬性限速，避免觸發 ISP QoS
  tc class add dev "$IFACE" parent 1:1 classid 1:20 htb rate "$BULK_RATE" ceil "$BULK_RATE"
  tc qdisc add dev "$IFACE" parent 1:20 fq_codel

  # 把來源或目的為 Tailscale UDP 埠的封包導進 1:20
  tc filter add dev "$IFACE" parent 1: protocol ip prio 1 u32 \
    match ip protocol 17 0xff match ip dport $TS_PORT 0xffff flowid 1:20
  tc filter add dev "$IFACE" parent 1: protocol ip prio 1 u32 \
    match ip protocol 17 0xff match ip sport $TS_PORT 0xffff flowid 1:20

  echo "已套用：$IFACE 總頻寬 $LINK_RATE，Tailscale(UDP $TS_PORT) 限速 $BULK_RATE"
}

clear_rules() {
  tc qdisc del dev "$IFACE" root 2>/dev/null || true
  echo "已清除 $IFACE 上的整形規則"
}

status() {
  echo "== qdisc =="; tc -s qdisc show dev "$IFACE"
  echo "== class =="; tc -s class show dev "$IFACE"
}

case "$ACTION" in
  apply)  apply ;;
  clear)  clear_rules ;;
  status) status ;;
  *) echo "用法: $0 {apply|clear|status} [介面] [總頻寬] [Tailscale限速]" >&2; exit 1 ;;
esac
