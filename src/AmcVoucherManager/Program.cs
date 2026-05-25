using System.Text.Json.Serialization;
using AmcVoucherManager.Domain.Interfaces;
using AmcVoucherManager.Infrastructure.Data;
using AmcVoucherManager.Infrastructure.Repositories;
using AmcVoucherManager.Application.Services;
using AmcVoucherManager.WebApi.Hubs;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var sqlitePath = builder.Configuration.GetValue<string>("DataDirectory")
    ?? Path.Combine(AppContext.BaseDirectory, "data");
Directory.CreateDirectory(sqlitePath);

var connectionString = $"Data Source={Path.Combine(sqlitePath, "vouchers.db")}";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IVoucherRepository, VoucherRepository>();
builder.Services.AddScoped<IVoucherService, VoucherService>();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = ".AspNetCore.Antiforgery";
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("Api", config =>
    {
        config.PermitLimit = 100;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

builder.Services.AddHttpLogging(logging =>
{
    logging.LoggingFields = Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.RequestMethod
        | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.RequestPath
        | Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.ResponseStatusCode;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSignalR();

var app = builder.Build();

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        await Results.Problem(
            title: "Internal Server Error",
            detail: "An unexpected error occurred.",
            statusCode: StatusCodes.Status500InternalServerError
        ).ExecuteAsync(context);
    });
});

app.UseHttpLogging();

app.UseRateLimiter();

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
        + "img-src 'self' data:; connect-src 'self' ws:; font-src 'self';");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Permissions-Policy",
        "camera=(self), microphone=()");
    context.Response.Headers.Append("Referrer-Policy", "no-referrer");
    await next();
});

app.Use(async (context, next) =>
{
    if (context.Request.Path == "/api/antiforgery/token" && context.Request.Method == "GET")
    {
        var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
        var tokens = antiforgery.GetAndStoreTokens(context);
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(
            $"{{\"token\":\"{tokens.RequestToken}\"}}");
        return;
    }
    await next();
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<VoucherHub>("/hubs/vouchers");

app.MapFallbackToFile("index.html");

app.Run();
