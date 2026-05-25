using AmcVoucherManager.Domain.Entities;
using AmcVoucherManager.Domain.Enums;
using AmcVoucherManager.Domain.Interfaces;
using AmcVoucherManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AmcVoucherManager.Infrastructure.Repositories;

public class VoucherRepository : IVoucherRepository
{
    private readonly AppDbContext _context;

    public VoucherRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Voucher>> GetAllAsync(VoucherType? type = null, bool includeArchived = false)
    {
        var query = _context.Vouchers.AsQueryable();

        if (type.HasValue)
            query = query.Where(v => v.Type == type.Value);

        if (!includeArchived)
            query = query.Where(v => !v.IsArchived);

        return await query
            .OrderBy(v => v.DateAdded)
            .ThenBy(v => v.CreatedAt)
            .ToListAsync();
    }

    public async Task<Voucher?> GetByIdAsync(Guid id)
    {
        return await _context.Vouchers.FindAsync(id);
    }

    public async Task<Voucher> CreateAsync(Voucher voucher)
    {
        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync();
        return voucher;
    }

    public async Task<Voucher> UpdateAsync(Voucher voucher)
    {
        _context.Vouchers.Update(voucher);
        await _context.SaveChangesAsync();
        return voucher;
    }

    public async Task DeleteAsync(Guid id)
    {
        var voucher = await _context.Vouchers.FindAsync(id);
        if (voucher is not null)
        {
            _context.Vouchers.Remove(voucher);
            await _context.SaveChangesAsync();
        }
    }
}
