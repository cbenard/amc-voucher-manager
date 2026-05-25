using AmcVoucherManager.Application.DTOs;

namespace AmcVoucherManager.Domain.Interfaces;

public interface IVoucherService
{
    Task<IEnumerable<VoucherDto>> GetAllAsync(string? type = null, bool includeArchived = false);
    Task<VoucherDto?> GetByIdAsync(Guid id);
    Task<VoucherDto> CreateAsync(CreateVoucherRequest request);
    Task<VoucherDto> UpdateAsync(Guid id, UpdateVoucherRequest request);
    Task<VoucherDto?> ToggleArchiveAsync(Guid id);
    Task DeleteAsync(Guid id);
}
