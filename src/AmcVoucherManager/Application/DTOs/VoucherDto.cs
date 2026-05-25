using AmcVoucherManager.Domain.Enums;

namespace AmcVoucherManager.Application.DTOs;

public record VoucherDto(
    Guid Id,
    VoucherType Type,
    string Number12,
    string Number16,
    string? Notes,
    DateOnly DateAdded,
    bool IsArchived,
    DateOnly? ArchivedDate,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
