using AmcVoucherManager.Domain.Interfaces;
using AmcVoucherManager.Infrastructure.Data;
using AmcVoucherManager.Infrastructure.Repositories;
using AmcVoucherManager.Application.Services;
using AmcVoucherManager.WebApi.Hubs;
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

builder.Services.AddControllers();
builder.Services.AddSignalR();

var app = builder.Build();

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
