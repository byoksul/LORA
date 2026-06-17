#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL yedekleme scripti
# Kullanım: ./scripts/backup-postgres.sh [yedek_dizini]
#
# Ortam değişkenleri:
#   POSTGRES_USER     (varsayılan: loracoffee)
#   POSTGRES_PASSWORD (zorunlu)
#   POSTGRES_DB       (varsayılan: loracoffee)
#   POSTGRES_HOST     (varsayılan: localhost)
#   POSTGRES_PORT     (varsayılan: 5433)

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
POSTGRES_USER="${POSTGRES_USER:-loracoffee}"
POSTGRES_DB="${POSTGRES_DB:-loracoffee}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "HATA: POSTGRES_PASSWORD ortam değişkeni ayarlanmalıdır."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="${BACKUP_DIR}/loracoffee_${TIMESTAMP}.sql.gz"

echo "Yedekleme başlıyor: ${BACKUP_FILE}"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -p "$POSTGRES_PORT" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_FILE"

echo "Yedekleme tamamlandı: ${BACKUP_FILE}"
echo "Boyut: $(du -h "$BACKUP_FILE" | cut -f1)"

# 30 günden eski yedekleri temizle
find "$BACKUP_DIR" -name "loracoffee_*.sql.gz" -mtime +30 -delete 2>/dev/null || true
