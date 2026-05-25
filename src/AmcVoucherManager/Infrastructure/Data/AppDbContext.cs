using AmcVoucherManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AmcVoucherManager.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Voucher> Vouchers => Set<Voucher>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Number12)
                .IsRequired()
                .HasMaxLength(12);

            entity.Property(e => e.Number16)
                .IsRequired()
                .HasMaxLength(16);

            entity.Property(e => e.Notes)
                .HasMaxLength(2000);

            entity.Property(e => e.Type)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.IsArchived);
            entity.HasIndex(e => e.DateAdded);
            entity.HasIndex(e => new { e.Number12, e.Number16 }).IsUnique();
        });
    }
}
