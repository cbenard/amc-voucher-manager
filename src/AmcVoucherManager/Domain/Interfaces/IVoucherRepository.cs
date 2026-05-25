using AmcVoucherManager.Domain.Entities;
using AmcVoucherManager.Domain.Enums;

namespace AmcVoucherManager.Domain.Interfaces;

public interface IVoucherRepository
{
    Task<IEnumerable<Voucher>> GetAllAsync(VoucherType? type = null, bool includeArchived = false);
    Task<Voucher?> GetByIdAsync(Guid id);
    Task<Voucher> CreateAsync(Voucher voucher);
    Task<Voucher> UpdateAsync(Voucher voucher);
    Task DeleteAsync(Guid id);
}
