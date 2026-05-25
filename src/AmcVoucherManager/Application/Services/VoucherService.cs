using AmcVoucherManager.Application.DTOs;
using AmcVoucherManager.Domain.Entities;
using AmcVoucherManager.Domain.Enums;
using AmcVoucherManager.Domain.Interfaces;

namespace AmcVoucherManager.Application.Services;

public class VoucherService : IVoucherService
{
    private readonly IVoucherRepository _repository;

    public VoucherService(IVoucherRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<VoucherDto>> GetAllAsync(string? type = null, bool includeArchived = false)
    {
        VoucherType? parsedType = null;
        if (type is not null)
        {
            if (!Enum.TryParse<VoucherType>(type, ignoreCase: true, out var parsed))
                return [];
            parsedType = parsed;
        }

        var vouchers = await _repository.GetAllAsync(parsedType, includeArchived);
        return vouchers.Select(MapToDto);
    }

    public async Task<VoucherDto?> GetByIdAsync(Guid id)
    {
        var voucher = await _repository.GetByIdAsync(id);
        return voucher is null ? null : MapToDto(voucher);
    }

    public async Task<VoucherDto> CreateAsync(CreateVoucherRequest request)
    {
        var voucher = new Voucher
        {
            Id = Guid.NewGuid(),
            Type = request.Type,
            Number12 = request.Number12,
            Number16 = request.Number16,
            Notes = request.Notes,
            DateAdded = request.DateAdded ?? DateOnly.FromDateTime(DateTime.UtcNow),
            IsArchived = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(voucher);
        return MapToDto(created);
    }

    public async Task<VoucherDto> UpdateAsync(Guid id, UpdateVoucherRequest request)
    {
        var existing = await _repository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Voucher with id {id} not found");

        if (request.Type.HasValue)
            existing.Type = request.Type.Value;
        if (request.Number12 is not null)
            existing.Number12 = request.Number12;
        if (request.Number16 is not null)
            existing.Number16 = request.Number16;
        if (request.Notes is not null)
            existing.Notes = request.Notes;
        if (request.DateAdded.HasValue)
            existing.DateAdded = request.DateAdded.Value;
        if (request.IsArchived.HasValue)
        {
            existing.IsArchived = request.IsArchived.Value;
            existing.ArchivedDate = request.IsArchived.Value
                ? DateOnly.FromDateTime(DateTime.UtcNow)
                : null;
        }

        existing.UpdatedAt = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(existing);
        return MapToDto(updated);
    }

    public async Task<VoucherDto?> ToggleArchiveAsync(Guid id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null) return null;

        existing.IsArchived = !existing.IsArchived;
        existing.ArchivedDate = existing.IsArchived
            ? DateOnly.FromDateTime(DateTime.UtcNow)
            : null;
        existing.UpdatedAt = DateTime.UtcNow;

        var updated = await _repository.UpdateAsync(existing);
        return MapToDto(updated);
    }

    public async Task DeleteAsync(Guid id)
    {
        await _repository.DeleteAsync(id);
    }

    private static VoucherDto MapToDto(Voucher v) => new(
        v.Id, v.Type, v.Number12, v.Number16,
        v.Notes, v.DateAdded, v.IsArchived,
        v.ArchivedDate, v.CreatedAt, v.UpdatedAt
    );
}
