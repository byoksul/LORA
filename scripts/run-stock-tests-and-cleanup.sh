#!/usr/bin/env bash
set -euo pipefail

BASE="${API_URL:-http://localhost:5000}"
REPORT="/tmp/lora-stock-test-report.txt"
ORDER_IDS=()

log() { echo "$1" | tee -a "$REPORT"; }
api() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -X "$method" "$BASE$path" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d "$body"
  else
    curl -s -X "$method" "$BASE$path" -H "Authorization: Bearer $token"
  fi
}

: > "$REPORT"
log "=== LORA Stok Test Paketi — $(date) ==="
log "API: $BASE"
log ""

# Login
ADMIN_JSON=$(api POST /api/auth/login "" '{"username":"admin","password":"123456"}')
ADMIN_TOKEN=$(echo "$ADMIN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['token'] if d.get('success') else '')" 2>/dev/null || echo "")
CASHIER_JSON=$(api POST /api/auth/login "" '{"username":"kasiyer","password":"333333"}')
CASHIER_TOKEN=$(echo "$CASHIER_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['token'] if d.get('success') else '')" 2>/dev/null || echo "")

if [[ -z "$ADMIN_TOKEN" || -z "$CASHIER_TOKEN" ]]; then
  log "HATA: Giriş başarısız. API çalışıyor mu?"
  exit 1
fi
log "✓ 1. Admin ve kasiyer girişi başarılı"

STOCK_JSON=$(api GET /api/stock-items "$ADMIN_TOKEN")
SUT_ID=$(echo "$STOCK_JSON" | python3 -c "import sys,json; print(next(i['id'] for i in json.load(sys.stdin)['data'] if i['name']=='Süt'))")
PRODUCTS_JSON=$(api GET /api/products "$ADMIN_TOKEN")
ICE_LATTE_ID=$(echo "$PRODUCTS_JSON" | python3 -c "import sys,json; print(next(p['id'] for p in json.load(sys.stdin)['data'] if p['name']=='Ice Latte'))")
ICE_PRICE=$(echo "$PRODUCTS_JSON" | python3 -c "import sys,json; print(next(p['price'] for p in json.load(sys.stdin)['data'] if p['name']=='Ice Latte'))")
TOTAL=$(python3 -c "print($ICE_PRICE * 2)")

# 2. Adjustment 10
R=$(api POST "/api/stock-items/$SUT_ID/adjustment" "$ADMIN_TOKEN" '{"countedQuantity":10,"notes":"AUTO_TEST"}')
echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'] and d['data']['newQuantity']==10"
log "✓ 2. Süt adjustment → 10 lt"

# 3. Recipe
RECIPE=$(api GET "/api/products/$ICE_LATTE_ID/recipe" "$ADMIN_TOKEN")
SUT_QTY=$(echo "$RECIPE" | python3 -c "import sys,json; d=json.load(sys.stdin); i=next(x for x in d['data']['items'] if 'Süt' in x['stockItemName']); print(i['quantity'])")
[[ "$SUT_QTY" == "0.25" ]] || { log "HATA: Reçete Süt $SUT_QTY (beklenen 0.25)"; exit 1; }
log "✓ 3. Ice Latte reçete Süt = 0.25 lt"

# 4-5. Order
ORDER_JSON=$(api POST /api/orders "$CASHIER_TOKEN" "{\"items\":[{\"productId\":\"$ICE_LATTE_ID\",\"quantity\":2,\"sizeLabel\":\"Küçük\",\"milkType\":\"Regular\"}],\"payments\":[{\"paymentType\":\"Card\",\"amount\":$TOTAL}],\"discountType\":\"None\"}")
ORDER_ID=$(echo "$ORDER_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success']; print(d['data']['id'])")
ORDER_NUM=$(echo "$ORDER_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['orderNumber'])")
ORDER_IDS+=("$ORDER_ID")
SUT_AFTER=$(api GET /api/stock-items "$ADMIN_TOKEN" | python3 -c "import sys,json; print(next(i['currentQuantity'] for i in json.load(sys.stdin)['data'] if i['name']=='Süt'))")
[[ "$SUT_AFTER" == "9.5" ]] || { log "HATA: Süt $SUT_AFTER (beklenen 9.5)"; exit 1; }
log "✓ 4-5. Sipariş #$ORDER_NUM → Süt 9.5 lt"

# 6-7. Cancel
CANCEL=$(api PATCH "/api/orders/$ORDER_ID/status" "$ADMIN_TOKEN" '{"status":"Cancelled"}')
echo "$CANCEL" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'] and d['data']['status']=='Cancelled'"
SUT_CANCEL=$(api GET /api/stock-items "$ADMIN_TOKEN" | python3 -c "import sys,json; print(next(i['currentQuantity'] for i in json.load(sys.stdin)['data'] if i['name']=='Süt'))")
[[ "$SUT_CANCEL" == "10.0" ]] || [[ "$SUT_CANCEL" == "10" ]] || { log "HATA: İptal sonrası Süt $SUT_CANCEL"; exit 1; }
log "✓ 6-7. İptal → Süt 10 lt"

# 8-10. Insufficient stock
api POST "/api/stock-items/$SUT_ID/adjustment" "$ADMIN_TOKEN" '{"countedQuantity":0.2,"notes":"AUTO_TEST"}' > /dev/null
FAIL=$(api POST /api/orders "$CASHIER_TOKEN" "{\"items\":[{\"productId\":\"$ICE_LATTE_ID\",\"quantity\":2,\"sizeLabel\":\"Küçük\",\"milkType\":\"Regular\"}],\"payments\":[{\"paymentType\":\"Card\",\"amount\":$TOTAL}],\"discountType\":\"None\"}")
echo "$FAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); assert not d['success'] and 'Süt' in d.get('message','')"
log "✓ 8-10. Yetersiz stok engeli: $(echo "$FAIL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))")"

# 11. Waste — önce 2 lt, sonra 1 lt fire
api POST "/api/stock-items/$SUT_ID/adjustment" "$ADMIN_TOKEN" '{"countedQuantity":2,"notes":"AUTO_TEST fire prep"}' > /dev/null
WASTE_FAIL=$(api POST "/api/stock-items/$SUT_ID/waste" "$ADMIN_TOKEN" '{"quantity":1,"reason":"Döküldü","notes":"AUTO_TEST"}')
echo "$WASTE_FAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'] and d['data']['movementType']=='WasteOut'"
log "✓ 11. Fire 1 lt → WasteOut"

# 12. Movements
MOVES=$(api GET "/api/stock-items/$SUT_ID/movements" "$ADMIN_TOKEN")
echo "$MOVES" | python3 -c "import sys,json; d=json.load(sys.stdin); assert any(m['movementType']=='WasteOut' for m in d['data'])"
log "✓ 12. Hareket geçmişinde WasteOut görünüyor"

log ""
log "=== Tüm testler BAŞARILI ==="
log ""
log "=== Test verileri temizleniyor... ==="

ORDER_ID_LIST=$(printf "'%s'," "${ORDER_IDS[@]}" | sed 's/,$//')

docker exec lora-postgres psql -U loracoffee -d loracoffee -c "DELETE FROM \"Payments\" WHERE \"OrderId\" IN ($ORDER_ID_LIST);"
docker exec lora-postgres psql -U loracoffee -d loracoffee -c "DELETE FROM \"OrderItems\" WHERE \"OrderId\" IN ($ORDER_ID_LIST);"
docker exec lora-postgres psql -U loracoffee -d loracoffee -c "DELETE FROM \"OrderStatusHistories\" WHERE \"OrderId\" IN ($ORDER_ID_LIST);"
docker exec lora-postgres psql -U loracoffee -d loracoffee -c "DELETE FROM \"Orders\" WHERE \"Id\" IN ($ORDER_ID_LIST);"
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'DELETE FROM "PurchaseReceipts";'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'DELETE FROM "StockMovements";'

docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 15, "UpdatedDate" = NOW() WHERE "Name" = '\''Kahve çekirdeği'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 20, "UpdatedDate" = NOW() WHERE "Name" = '\''Süt'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 500, "UpdatedDate" = NOW() WHERE "Name" = '\''Bardak'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 400, "UpdatedDate" = NOW() WHERE "Name" = '\''Kapak'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 50, "UpdatedDate" = NOW() WHERE "Name" = '\''Buz'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 8, "UpdatedDate" = NOW() WHERE "Name" = '\''Şurup'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 5, "UpdatedDate" = NOW() WHERE "Name" = '\''Kakao'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 6, "UpdatedDate" = NOW() WHERE "Name" = '\''Çikolata sosu'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 30, "UpdatedDate" = NOW() WHERE "Name" = '\''Tatlı'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 15, "UpdatedDate" = NOW() WHERE "Name" = '\''Kahve'\'';'
docker exec lora-postgres psql -U loracoffee -d loracoffee -c 'UPDATE "StockItems" SET "CurrentQuantity" = 30, "UpdatedDate" = NOW() WHERE "Name" = '\''Tatlılar'\'';'

MOV_COUNT=$(docker exec lora-postgres psql -U loracoffee -d loracoffee -t -c 'SELECT COUNT(*) FROM "StockMovements";' | tr -d ' ')

# Verify cleanup
VERIFY=$(api GET /api/stock-items "$ADMIN_TOKEN")
SUT_FINAL=$(echo "$VERIFY" | python3 -c "import sys,json; print(next(i['currentQuantity'] for i in json.load(sys.stdin)['data'] if i['name']=='Süt'))")

log "✓ Stok hareketleri silindi (kalan: $MOV_COUNT)"
[[ "$SUT_FINAL" == "20.0" || "$SUT_FINAL" == "20" ]] && log "✓ Süt sıfırlandı: $SUT_FINAL lt" || log "⚠ Süt: $SUT_FINAL lt (hedef 20)"
log "✓ Test sipariş(ler) silindi: $ORDER_ID_LIST"
log ""
log "=== Temizlik tamamlandı ==="
log "Rapor: $REPORT"
