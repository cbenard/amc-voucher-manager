# AMC Voucher Manager

A Progressive Web App for managing AMC Theater vouchers. Import vouchers by scanning barcodes with your phone camera or enter them manually. View them as scannable QR codes and Code128 barcodes with privacy blur. Organize by type (tickets, drinks, popcorn), archive what you've used, and sync across all your devices in real time — fully offline-capable.

---

## Features

- **📱 PWA** — Install on your phone home screen, works offline
- **📷 Barcode scanning** — Point camera at any Code128/EAN/UPC barcode to auto-import
- **🔐 Privacy blur** — QR codes and barcodes blurred by default; tap to reveal one at a time
- **📂 Organize by type** — Tickets, drinks, popcorn with type-specific icons
- **📦 Offline-first** — All data stored locally in IndexedDB, syncs in background
- **🔄 Real-time sync** — SignalR keeps all devices updated simultaneously
- **🏷️ Archive / Delete** — Archive used vouchers, delete with double-confirmation
- **📝 Notes** — Optional notes on each voucher, truncated in list view
- **🔍 FIFO / LIFO** — Active vouchers oldest-first; archived newest-first behind expander
- **🐳 Docker** — Single-container deployment with SQLite persistence
- **🔒 Security built in** — CSRF protection, rate limiting, security headers, input validation, paramaterized queries

---

## Usage

### Docker Run

```bash
# Build the image
docker build -t amc-voucher-manager .

# Run with a named volume (persists SQLite database)
docker run -d \
  --name amc-vouchers \
  -p 5000:5000 \
  -v vouchers-data:/data \
  amc-voucher-manager

# Or run with a host directory bind mount
docker run -d \
  --name amc-vouchers \
  -p 5000:5000 \
  -v /path/to/your/data:/data \
  amc-voucher-manager

# Open http://localhost:5000
```

The SQLite database file is stored at `/data/vouchers.db` inside the container. Mount a volume or host directory to `/data` for persistence across container restarts.

### Docker Compose

```bash
# Start the service
docker compose up -d

# View logs
docker compose logs -f

# Stop and remove
docker compose down
```

### Security

See [`SECURITY.md`](SECURITY.md) for the full threat model, OWASP coverage, and risk register.

Mutating API endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require an `X-CSRF-TOKEN` header. The client fetches the token automatically from `GET /api/antiforgery/token` on startup. Rate limiting allows 100 requests per minute per client.

### Configuration via Environment Variables

All configuration is read from environment variables into ASP.NET Core's `IConfiguration`. Set them in `docker run -e` flags, `docker-compose.yml` `environment` block, or your orchestrator's config map.

| Variable | Default | Description |
|---|---|---|
| `ASPNETCORE_URLS` | `http://+:5000` | Listening address and port |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Sets runtime environment (`Development` / `Production`) |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | `true` | Enables forwarded headers middleware (needed behind reverse proxies) |
| `DataDirectory` | `/data` | Directory for the SQLite database file |

Override any variable at runtime:

```bash
docker run -d \
  --name amc-vouchers \
  -p 8080:8080 \
  -v vouchers-data:/data \
  -e ASPNETCORE_URLS=http://+:8080 \
  amc-voucher-manager
```

### Production behind a Reverse Proxy

The app is designed to sit behind NPMPlus, Nginx Proxy Manager, Caddy, or Traefik with Authelia forward auth. No application-level authentication is included — all authorized users share the same voucher data.

TLS is terminated at the reverse proxy. The app runs HTTP internally (`:5000`) with `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`. Set HSTS headers at the reverse proxy level.

```bash
docker run -d \
  --name amc-vouchers \
  -p 5000:5000 \
  -v /path/to/data:/data \
  --restart unless-stopped \
  amc-voucher-manager
```

---

## Architecture

```
amc-voucher-manager/
├── Dockerfile                          # Multi-stage: Node → .NET SDK → .NET Runtime
├── REQUIREMENTS.md                     # Full feature requirements
├── src/
│   ├── AmcVoucherManager.slnx
│   ├── AmcVoucherManager/              # .NET 10 ASP.NET Core backend
│   │   ├── Domain/                     # Entities, enums, interfaces
│   │   ├── Application/                # DTOs, service layer
│   │   ├── Infrastructure/             # EF Core + SQLite, repository
│   │   ├── WebApi/                     # Controllers, SignalR hub
│   │   ├── Program.cs                  # Startup, DI, static file serving
│   │   └── wwwroot/                    # Built frontend (Vite output)
│   ├── AmcVoucherManager.Tests/        # xUnit tests (FluentAssertions + Moq)
│   └── frontend/                       # Vanilla JS SPA (Vite-bundled)
│       ├── index.html                  # SPA shell
│       ├── vite.config.js              # Vite + PWA plugin config
│       ├── public/icons/               # PWA icons
│       └── src/
│           ├── styles/main.css         # Mobile-first dark theme
│           └── js/
│               ├── main.js             # Bootstrap, router, SignalR connect
│               ├── router.js           # Hash-based SPA router
│               ├── api.js              # REST + SignalR client
│               ├── db.js               # IndexedDB wrapper (idb)
│               ├── sync.js             # Offline queue + background sync
│               ├── scanner.js          # Camera barcode scanner
│               ├── barcode.js          # Code128 rendering (JsBarcode)
│               ├── qrcode.js           # QR rendering (qrcode-generator)
│               └── views/              # SPA page components
│                   ├── home.js         # Type selection screen
│                   ├── list.js         # Voucher list by type
│                   ├── detail.js       # Single voucher view
│                   └── form.js         # Add/edit form
```

### Backend (Clean Architecture)

| Layer | Responsibility |
|---|---|
| **Domain** | `Voucher` entity, `VoucherType` enum, repository/service interfaces |
| **Application** | `VoucherService` with business logic, DTOs for API contracts |
| **Infrastructure** | EF Core `AppDbContext` (SQLite), `VoucherRepository` implementation |
| **WebApi** | `VouchersController` (REST), `VoucherHub` (SignalR), static file serving |

### Frontend (Vanilla JS + Vite)

- **No framework** — Plain ES modules for maintainability
- **Vite** — Fast dev server with HMR, production bundling
- **PWA** — Service worker via `vite-plugin-pwa` (Workbox), manifest, offline caching
- **IndexedDB** — Local data mirror via `idb` wrapper
- **SignalR** — Real-time updates via `@microsoft/signalr`
- **Barcode scanning** — Native `BarcodeDetector` API with `@ericblade/quagga2` fallback
- **Code128** — `JsBarcode` for 1D barcode rendering
- **QR codes** — `qrcode-generator` for QR rendering

---

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Development

```bash
# Terminal 1 — start the backend
dotnet run --project src/AmcVoucherManager

# Terminal 2 — start the frontend dev server (with hot reload)
cd src/frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies API requests to `http://localhost:5000`.

### Running Tests

```bash
dotnet test src/AmcVoucherManager.Tests
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/vouchers?type=ticket&includeArchived=false` | List vouchers, optional type filter |
| `GET` | `/api/vouchers/{id}` | Get voucher by ID |
| `POST` | `/api/vouchers` | Create voucher (requires `X-CSRF-TOKEN`) |
| `PUT` | `/api/vouchers/{id}` | Update voucher (requires `X-CSRF-TOKEN`) |
| `PATCH` | `/api/vouchers/{id}/archive` | Toggle archive (requires `X-CSRF-TOKEN`) |
| `DELETE` | `/api/vouchers/{id}` | Delete voucher (requires `X-CSRF-TOKEN`) |

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | ASP.NET Core 10, C# |
| Database | SQLite via Entity Framework Core |
| Real-time | SignalR |
| Frontend | Vanilla JavaScript, Vite, PWA |
| Barcodes | Code128 (JsBarcode), QR (qrcode-generator) |
| Scanner | BarcodeDetector API + @ericblade/quagga2 |
| Offline | IndexedDB (idb), Workbox service worker |
| Testing | xUnit, FluentAssertions, Moq |
| Container | Docker, multi-stage build |

---

## License

MIT
