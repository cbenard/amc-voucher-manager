# AMC Voucher Manager — Requirements

## Purpose

A Progressive Web App (PWA) for managing AMC Theater vouchers. Users can import vouchers via barcode scanning or manual entry, organize them by type (ticket, drink, popcorn), view them as scannable barcodes/QR codes with privacy blur, archive them, and sync data across multiple devices in real time — all with full offline support.

---

## Functional Requirements

### 1. Voucher Data Model

Each voucher stores:

| Field | Type | Notes |
|---|---|---|
| `id` | GUID | Auto-generated primary key |
| `type` | Enum | `Ticket`, `Drink`, `Popcorn` — extensible via code |
| `number12` | String (12 digits) | 12-digit number from PDF, rendered as Code128 barcode |
| `number16` | String (16 digits) | 16-digit number from PDF, rendered as Code128 barcode; QR encodes this |
| `notes` | String? | Optional free-text notes |
| `dateAdded` | DateOnly | Defaults to today; editable via HTML5 date picker |
| `isArchived` | Bool | Soft archive, default `false` |
| `archivedDate` | DateOnly? | Set when archived, cleared when unarchived |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Updated on every modification |

### 2. Voucher Types

- **Ticket** — 🎟️
- **Drink** — 🥤
- **Popcorn** — 🍿

Extensible via code: add a new member to the `VoucherType` enum + corresponding entry in the frontend `TYPE_CONFIG` array.

### 3. Adding Vouchers

- **Manual entry**: Type selector (tabs with icons), 12-digit field, 16-digit field, date picker (defaults to today), optional notes (deemphasized "add notes" link)
- **Barcode scanning**: Tap "Scan Barcode" button → opens camera → auto-detects Code128 / EAN / UPC barcodes via native `BarcodeDetector` API with QuaggaJS fallback
- Offline: vouchers saved to IndexedDB immediately; queued for server sync when online

### 4. Viewing Vouchers

**Home screen**: Type selection grid showing active count per type

**List by type**:
- Active vouchers sorted FIFO by `dateAdded` (ascending)
- Archived vouchers behind an expander, sorted LIFO by `archivedDate` (descending)
- Each card shows: type icon, date, truncated notes (80 chars with `…`), full card is tappable

**Voucher detail** (single voucher view):
- QR code (encodes 16-digit) — presented first by default
- Code128 barcode for 12-digit number
- Code128 barcode for 16-digit number
- All three are CSS-blurred by default
- Tap any one card → unblurs it, blurs the other two (mutual exclusion)
- Tap again → re-blurs
- Archive / Unarchive button
- Edit button
- Delete button (double-confirm, hard delete)

### 5. Archive / Delete

- **Archive**: Primary action. Toggles `isArchived`. Sets `archivedDate`. Unarchiving clears `archivedDate`.
- **Delete**: Destructive action. Requires two confirmation dialogs. Hard delete from database.

### 6. Offline Support

- Service worker caches app shell (Workbox via `vite-plugin-pwa`)
- All voucher data mirrored in IndexedDB
- Reads served from IndexedDB (instant, works offline)
- Writes go to server API; if offline, queued in `pendingChanges` store
- Background Sync API flushes pending changes when connectivity returns
- Periodic sync every 30 seconds when online

### 7. Real-Time Multi-Device Sync

- SignalR hub at `/hubs/vouchers`
- Server broadcasts: `VoucherCreated`, `VoucherUpdated`, `VoucherArchived`, `VoucherDeleted`
- Connected clients update IndexedDB in real time
- No authentication (protected upstream by NPMPlus + Authelia forward auth)
- All authorized users share the same data set
- Conflict resolution: server timestamp wins (last-write-wins)

### 8. PWA Features

- `manifest.webmanifest` with standalone display, portrait orientation
- Service worker for offline caching
- Mobile-first responsive design with dark theme
- Install prompt on supported browsers
- Cross-platform: iOS (Safari), Android (Chrome), macOS/Windows (any modern browser)

### 9. User Interface

- Dark theme (`#1a1a2e` background, `#e94560` accent)
- Hamburger menu for navigation (Home, Ticket list, Drink list, Popcorn list, Add)
- Back navigation via browser back or hamburger menu
- Toast notifications for actions
- Modal confirmation dialogs for destructive operations
- HTML5 date picker (`<input type="date">`)
- Camera scanner overlay with close button

---

## Non-Functional Requirements

### Architecture
- **Backend**: ASP.NET Core (`.NET 10`) with Clean Architecture folders: `Domain` → `Application` → `Infrastructure` → `WebApi` (single project)
- **Frontend**: Vanilla JavaScript SPA bundled with Vite, organized into ES modules (`src/js/`)
- **Database**: SQLite via Entity Framework Core, auto-migrated on startup
- **Real-time**: SignalR for WebSocket-based broadcast

### API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/vouchers?type=&includeArchived=` | List vouchers |
| `GET` | `/api/vouchers/{id}` | Get single voucher |
| `POST` | `/api/vouchers` | Create voucher |
| `PUT` | `/api/vouchers/{id}` | Update voucher |
| `PATCH` | `/api/vouchers/{id}/archive` | Toggle archive |
| `DELETE` | `/api/vouchers/{id}` | Delete voucher |

### Deployment
- Containerized via multi-stage Dockerfile
- SQLite data stored on a Docker volume at `/data`
- Ready for reverse-proxy deployment behind NPMPlus + Authelia

### Testing
- xUnit test project (`AmcVoucherManager.Tests`) with FluentAssertions and Moq
- Domain, Application service, and WebApi controller test coverage
