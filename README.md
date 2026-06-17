# LORA Coffee OS

Premium kafe yönetim sistemi — POS, Kitchen Display, Admin Panel ve QR Menü.

## Teknolojiler

**Frontend:** React, TypeScript, Vite, TailwindCSS, TanStack Query, Zustand, SignalR  
**Backend:** .NET 8, Clean Architecture, CQRS (MediatR), EF Core, PostgreSQL, JWT  
**Container:** Docker, Docker Compose

## Hızlı Başlangıç (Geliştirme)

### Docker ile

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

### Manuel Geliştirme

Mac'te yerel PostgreSQL 5432 kullanıyorsa Docker Postgres host portu **5433** olarak publish edilir.

```bash
# PostgreSQL
docker compose up postgres -d

# Backend
cd backend/LoraCoffee.API
dotnet run --launch-profile http

# Frontend
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
API / Swagger: http://localhost:5000/swagger

### Geliştirme Demo Hesapları

Yalnızca `Development` ortamında seed ile oluşturulur:

| Rol | Kullanıcı adı | PIN |
|-----|---------------|-----|
| SuperAdmin | admin | 123456 |
| Manager | manager | 222222 |
| Cashier | kasiyer | 333333 |
| Barista | barista | 444444 |

## Production Deploy

### 1. Ortam değişkenlerini hazırlayın

```bash
cp docker/.env.prod.example docker/.env.prod
# docker/.env.prod dosyasını düzenleyin — şifreleri ve domain'i ayarlayın
```

Gerekli değişkenler:

| Değişken | Açıklama |
|----------|----------|
| `POSTGRES_PASSWORD` | PostgreSQL şifresi |
| `JWT_KEY` | En az 32 karakter JWT secret |
| `CORS_ORIGINS` | `https://yourdomain.com` (virgülle ayrılmış) |
| `VITE_API_URL` | Boş bırakın (nginx proxy) |
| `VITE_HUB_URL` | Boş bırakın (nginx proxy) |

### 2. SSL sertifikalarını yerleştirin

```bash
# Self-signed test (geliştirme)
mkdir -p docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/privkey.pem -out docker/ssl/fullchain.pem \
  -subj "/CN=localhost"

# Production: Let's Encrypt veya CA sertifikalarını docker/ssl/ altına koyun
#   - fullchain.pem
#   - privkey.pem
```

### 3. Production stack'i başlatın

```bash
docker compose -f docker-compose.prod.yml --env-file docker/.env.prod up --build -d
```

- HTTP: port 80 (HTTPS'e yönlendirir)
- HTTPS: port 443
- Health check: `https://yourdomain.com/health`

### 4. İlk kullanıcı oluşturma

Production ortamında demo kullanıcılar otomatik oluşturulmaz. İlk SuperAdmin'i manuel ekleyin veya geçici olarak Development seed kullanıp şifreleri değiştirin.

### 5. PostgreSQL yedekleme

```bash
chmod +x scripts/backup-postgres.sh
export POSTGRES_PASSWORD=your-password
./scripts/backup-postgres.sh ./backups
```

Cron örneği (günlük 02:00):

```cron
0 2 * * * POSTGRES_PASSWORD=xxx /path/to/scripts/backup-postgres.sh /path/to/backups
```

## Route Yapısı

| Route | Açıklama |
|-------|----------|
| `/login` | Giriş |
| `/pos` | POS ekranı (Kasiyer) |
| `/bar` | Barista ekranı |
| `/menu` | QR Menü (herkese açık) |
| `/admin` | Admin Dashboard |
| `/admin/products` | Ürün yönetimi |
| `/admin/stock` | Stok yönetimi |
| `/admin/reports` | Raporlar |
| `/admin/users` | Kullanıcı yönetimi |

## Mimari

```
backend/
├── LoraCoffee.Domain/       # Entities, Enums
├── LoraCoffee.Application/  # CQRS, DTOs, Interfaces, Validators
├── LoraCoffee.Infrastructure/ # EF Core, Repositories, JWT, SignalR
└── LoraCoffee.API/          # Controllers, Middleware, Program.cs

frontend/
├── src/
│   ├── components/          # UI bileşenleri
│   ├── pages/               # POS, Bar, Menu, Admin
│   ├── stores/              # Zustand (auth, pos)
│   ├── lib/                 # API, SignalR, utils
│   └── types/               # TypeScript tipleri
```

## Özellikler

- JWT Authentication + Role Based Authorization
- BCrypt password hashing
- Real-time sipariş takibi (SignalR, yetkilendirilmiş hub)
- Offline-first POS (local queue + sync)
- Touch-friendly POS tasarımı
- Admin dashboard ve raporlar
- Stok yönetimi ve kritik stok uyarıları
- Health check endpoint (`/health`)
- Login rate limiting
- Global exception handling (production'da stack trace gizli)

## Renk Paleti

- Primary: `#C98A6A` (Copper)
- Background: `#0F0F0F`
- Card: `#181818`
- Success: `#3BB273`
- Warning: `#FFB020`
- Danger: `#E5484D`
