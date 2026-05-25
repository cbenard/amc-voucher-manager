# Project Instructions

## Git

- **Never** stage, commit, push, pull, or perform any git operation without asking the user for explicit approval.

## Technology

- **Backend**: .NET 10, ASP.NET Core, C#
- **Frontend**: Vanilla JavaScript ES modules, bundled with Vite
- **Database**: SQLite via Entity Framework Core, auto-migrated at startup
- **Real-time**: SignalR for WebSocket-based broadcast
- **Testing**: xUnit + FluentAssertions + Moq
- **Container**: Docker, multi-stage build

## Architecture

- Clean Architecture, single project, folder-organized:
  - `Domain/` — entities, enums, interfaces
  - `Application/` — DTOs, service layer
  - `Infrastructure/` — EF Core, repository implementation
  - `WebApi/` — controllers, SignalR hub, Program.cs
- Frontend lives in `src/frontend/`, built by Vite into `wwwroot/`
- Test project at `src/AmcVoucherManager.Tests/`

## Code Style

- No comments in code unless the user explicitly asks for them
- Follow existing project conventions for naming, file organization, and patterns
- Keep responses and explanations concise

## Docker

- Multi-stage build: Node builds frontend → .NET SDK builds backend → .NET runtime serves
- SQLite database stored at `/data/vouchers.db` via Docker volume
- Database is created and migrated on container startup, never at build time
- Configuration via environment variables mapped to `IConfiguration`

## Frontend Conventions

- Mobile-first responsive design, dark theme (`#1a1a2e` / `#e94560`)
- PWA with manifest, service worker (Workbox via vite-plugin-pwa)
- Offline-first: IndexedDB local mirror, background sync when online
- Camera barcode scanning: native `BarcodeDetector` API with `@ericblade/quagga2` fallback
- Code128 barcodes via JsBarcode, QR codes via qrcode-generator
- Barcode cards display: QR (16-digit), 12-digit barcode, 16-digit barcode
- All three cards CSS-blurred by default; tap one to unblur, blurring the others (mutual exclusion)

## Voucher Data Model

- Fields: Id (GUID), Type (enum), Number12 (12 digits), Number16 (16 digits), Notes (optional), DateAdded (DateOnly), IsArchived (bool), ArchivedDate (DateOnly?), CreatedAt, UpdatedAt
- Types: Ticket, Drink, Popcorn — extensible via code (enum + TYPE_CONFIG)
- Active vouchers sorted FIFO by DateAdded ascending
- Archived vouchers behind expander, sorted LIFO by ArchivedDate descending
- Archive is the primary action; delete requires double confirmation
- Notes truncated at ~80 chars with "..." in list view

## Security

- See `SECURITY.md` for the full threat model and risk register
- **Never** use `FromSql`, `ExecuteSqlRaw`, or string concatenation in queries — EF Core LINQ only
- **Never** render user input via `innerHTML` — use `textContent` or `createElement`
- **Never** add client-invokable SignalR hub methods — broadcasts must originate server-side
- **Always** validate input with data annotations (`[Required]`, `[StringLength]`, `[RegularExpression]`)
- **Always** add `[IgnoreAntiforgeryToken]` to new GET endpoints
- **Use** `Enum.TryParse` instead of `Enum.Parse` for user-supplied strings
- **Use** `document.createElement` + `textContent` instead of `innerHTML` with interpolated strings
- All mutating endpoints require `X-CSRF-TOKEN` header (fetched from `GET /api/antiforgery/token`)
- Rate limited to 100 requests/min
- CSP configured — update when adding new external resources

## Testing

- xUnit tests with FluentAssertions for assertions, Moq for mocking
- Test layers: Domain (entity behavior), Application (service logic), WebApi (controller responses)
- Cover happy paths and error paths (404, missing entities, etc.)
