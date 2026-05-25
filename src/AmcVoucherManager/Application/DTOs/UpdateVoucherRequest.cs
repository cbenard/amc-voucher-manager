using AmcVoucherManager.Domain.Enums;

namespace AmcVoucherManager.Application.DTOs;

public record UpdateVoucherRequest(
    VoucherType? Type,
    string? Number12,
    string? Number16,
    string? Notes,
    DateOnly? DateAdded,
    bool? IsArchived
);
