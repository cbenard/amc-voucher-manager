# Security Analysis

This document describes the security posture of AMC Voucher Manager. Every checklist item was verified against the actual source code at the time of writing.

---

## Threat Model

| Context | Detail |
|---|---|
| **Deployment** | Behind Authelia forward-auth reverse proxy. No direct internet exposure. |
| **Authentication** | Handled entirely by Authelia at the proxy layer. The application itself issues no tokens, manages no sessions, and stores no credentials. |
| **Authorization** | Single-user data set — every authenticated user sees every voucher. No `UserId` or ownership model exists (by design). |
| **Data sensitivity** | 12-digit and 16-digit voucher codes. No PII, no financial account numbers, no passwords. |

---

## OWASP Top 10 — Coverage

### A01: Broken Access Control

| Check | Status | Detail |
|---|---|---|
| IDOR via GUID enumeration | ✅ Not vulnerable | IDs are random GUIDs, not sequential. No `UserId` field to manipulate. |
| Mass assignment / over-posting | ✅ Not vulnerable | DTOs (`CreateVoucherRequest`, `UpdateVoucherRequest`) are used exclusively. The `Voucher` entity is never bound from the request body. |
| CSRF on mutating endpoints | ✅ Mitigated | `AddAntiforgery()` registered with header `X-CSRF-TOKEN`. `[AutoValidateAntiforgeryToken]` on controller validates all POST/PUT/PATCH/DELETE. GET endpoints decorated with `[IgnoreAntiforgeryToken]`. Client fetches token via `GET /api/antiforgery/token` on startup and sends it with every mutating request. |
| SignalR hub authorization | ✅ Mitigated | `[Authorize]` attribute on `VoucherHub`. Broadcasts originate server-side only (via `IHubContext<VoucherHub>` in the controller), never from client-invokable hub methods. |

### A02: Cryptographic Failures

| Check | Status | Detail |
|---|---|---|
| HTTPS at the proxy | ✅ Mitigated | App runs HTTP on `:5000`. `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` trusts the proxy's `X-Forwarded-Proto`. TLS is terminated at the reverse proxy (Authelia / Nginx / Traefik / Caddy). Direct HTTP exposure is a documented deployment risk. |
| Data at rest | ⚠️ Acceptable | SQLite file on Docker volume at `/data/vouchers.db`. Voucher codes stored in plaintext. No PII or secrets are stored. Volume encryption is the operator's responsibility. |
| Data in transit (client) | ⚠️ Acceptable | IndexedDB stores voucher codes in plaintext. Device-level encryption (iOS Keychain / Android Keystore / macOS FileVault) is the operator's responsibility. |

### A03: Injection

| Check | Status | Detail |
|---|---|---|
| SQL injection | ✅ Not vulnerable | All queries use EF Core LINQ expressions, which generate parameterized SQL. No `FromSql`, `ExecuteSqlRaw`, or string concatenation exists anywhere. |
| XSS (stored) | ✅ Not vulnerable | Notes and voucher numbers rendered via `textContent` (detail view) or `escapeHtml()` using DOM node textContent → innerHTML (list view). |
| XSS (reflected) | ✅ Mitigated | `escapeAttr()` escapes `&`, `"`, `<`, `>` before interpolating into HTML attributes in template literals. No `innerHTML` is used with user data — only with hardcoded strings. |
| XSS (DOM) | ✅ Mitigated | `showConfirm()` modal uses `document.createElement` and `textContent` exclusively. No template literal injection into `innerHTML`. |

### A04: Insecure Design

| Check | Status | Detail |
|---|---|---|
| Rate limiting | ✅ Mitigated | Fixed-window limiter: 100 requests/minute, 429 on exceed. Applied globally via `UseRateLimiter()` + `[EnableRateLimiting("Api")]` on the controller. |
| Enum parsing | ✅ Mitigated | `Enum.TryParse` used instead of `Enum.Parse`. Invalid type values return an empty result set instead of throwing a 500. |
| Input length limits | ✅ Mitigated | DTO data annotations: `[StringLength(12, MinimumLength = 12)]`, `[StringLength(16, MinimumLength = 16)]`, `[RegularExpression(@"^\d{12}$")]`. Server rejects oversized/malformed payloads. |

### A05: Security Misconfiguration

| Check | Status | Detail |
|---|---|---|
| Security headers | ✅ Mitigated | Middleware adds: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy: no-referrer`. |
| CSP value | | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws:; font-src 'self'` |
| Error handling | ✅ Mitigated | Global `UseExceptionHandler()` returns a generic 500 `application/problem+json` body. No stack traces, no internal details exposed. |
| CORS | ✅ Not vulnerable | No CORS middleware configured — API and frontend are same-origin (ASP.NET Core serves the built SPA from `wwwroot/`). |
| Debug/development endpoints | ✅ Not exposed | No Swagger, no debug endpoints in production. |
| Directory listing | ✅ Disabled | `UseDefaultFiles()` / `UseStaticFiles()` without `ServeUnknownFileTypes`. |
| SPA fallback | ✅ Correct | `MapFallbackToFile("index.html")` only — no wildcard routing that could serve sensitive files. |

### A06: Vulnerable & Outdated Components

| Component | Version | Status |
|---|---|---|
| `Microsoft.EntityFrameworkCore.Sqlite` | 10.0.8 | Current, Microsoft-maintained |
| `@microsoft/signalr` | ^8.0.0 | Latest 8.x |
| `vite` | ^6.0.0 | Current |
| `idb` | ^8.0.0 | Well-maintained |
| `@ericblade/quagga2` | ^1.12.0 | Third-party, stable |
| `jsbarcode` | ^3.11.6 | Stable |
| `qrcode-generator` | ^1.4.4 | Stable |

No known CVEs against these versions at the time of analysis. Run `npm audit` and `dotnet list package --vulnerable` periodically.

### A07: Identification & Authentication Failures

| Check | Status | Detail |
|---|---|---|
| Authentication | ✅ Delegated | Handled upstream by Authelia. Application has no auth code, no user store, no passwords. |
| Session management | ✅ Delegated | No session cookies, no JWTs, no tokens issued by the application. |
| Credential storage | ✅ Not applicable | No credentials stored. |

### A08: Software & Data Integrity Failures

| Check | Status | Detail |
|---|---|---|
| Dependency integrity | ✅ Mitigated | `package-lock.json` pins transitive dependency versions. `npm ci` enforces exact installs. Docker multi-stage build reduces supply-chain surface. |
| Unsigned binaries | ⚠️ Acceptable | No code signing in this project tier. |

### A09: Security Logging & Monitoring

| Check | Status | Detail |
|---|---|---|
| HTTP request logging | ✅ Mitigated | `AddHttpLogging()` logs request method, path, and response status code. |
| Exception logging | ✅ Mitigated | `UseExceptionHandler()` catches unhandled exceptions before they reach the client. ASP.NET Core's default logging writes to stdout / container logs. |
| Structured logging | ⚠️ Acceptable | No Serilog or similar — standard `ILogger<T>` output to console. Container logs can be ingested by Loki / Datadog / etc. |

### A10: Server-Side Request Forgery

| Check | Status | Detail |
|---|---|---|
| SSRF | ✅ Not vulnerable | The application makes no outbound HTTP requests from the server. No URL parameters are fetched or proxied. |

---

## Additional Checks

### SignalR

| Check | Status | Detail |
|---|---|---|
| Hub methods client-invokable | ✅ Mitigated | All hub methods removed. `VoucherHub` is empty — broadcasts originate only from the controller via `IHubContext`. Clients cannot invoke any hub method. |
| WebTransport / long-polling | ⚠️ Default | SignalR negotiates transports including WebSockets and long-polling. Long-polling uses POST and is subject to the same CSRF protections (when using negotiate with antiforgery). |

### HTTP Headers

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws:; font-src 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(self), microphone=()` |
| `Referrer-Policy` | `no-referrer` |
| `Strict-Transport-Security` | Not set (TLS is handled at the proxy layer — set `HSTS` at your reverse proxy) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CSRF via malicious site | Low | Low | SameSite cookies (Authelia) + antiforgery tokens + JSON Content-Type |
| SQL injection | None | Critical | EF Core parameterized queries everywhere |
| XSS via voucher notes | Low | Medium | `textContent` / DOM-based escaping; no `innerHTML` with user data |
| Brute force / enumeration | Low | Medium | Rate limiting (100 req/min) + GUID IDs instead of sequential |
| Indirect exposure via reverse proxy misconfiguration | Medium | High | App only listens on `:5000` internal; all security headers set at app level |
| Physical device compromise | Low | High | Voucher codes in plaintext IndexedDB; device encryption is operator's responsibility |

---

## Secure Development Guidelines

When modifying this codebase:

1. **Never use `FromSql`, `ExecuteSqlRaw`, or string concatenation in queries** — always use EF Core LINQ.
2. **Never render user input via `innerHTML`** — use `textContent` or `createElement` with explicit encoding.
3. **Never add client-invokable SignalR hub methods** that mutate data or broadcast unchecked payloads — broadcasts must originate server-side after validation.
4. **Always add `[IgnoreAntiforgeryToken]` to new GET endpoints** on controllers that use `[AutoValidateAntiforgeryToken]`.
5. **Validate all input** with data annotations (`[Required]`, `[StringLength]`, `[RegularExpression]`).
6. **Use `Enum.TryParse`** instead of `Enum.Parse` when parsing user-supplied strings to enums.
7. **Keep the CSP updated** when adding new external resources.
